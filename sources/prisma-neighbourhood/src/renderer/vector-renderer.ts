/**
 * @fileoverview Vector-first renderer.
 *
 * This renderer generates Mermaid ERD text (same as the Mermaid renderer),
 * and supports exporting to SVG/PNG/PDF without Puppeteer/Chromium.
 */

import { writeFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import svgToPdf from "svg-to-pdfkit";
import type { TraversedModel } from "../traversal/types";
import { renderMermaidErd } from "./mermaid-erd";
import type { DiagramRenderer, ExportFormat } from "./types";

/**
 * Extract width/height from an SVG string.
 * Falls back to viewBox if explicit width/height is missing.
 */
function getSvgSize(svg: string): {
	readonly widthPx: number;
	readonly heightPx: number;
} {
	const widthMatch = svg.match(/\bwidth="([^"]+)"/);
	const heightMatch = svg.match(/\bheight="([^"]+)"/);

	const parseCssPx = (value: string | undefined): number | undefined => {
		if (!value) return undefined;
		const trimmed = value.trim();
		// Ignore percentages and other non-px units (Mermaid often uses 100%).
		if (trimmed.includes("%")) return undefined;
		// Only accept plain numbers or px values.
		if (!/^\d+(\.\d+)?(px)?$/i.test(trimmed)) return undefined;
		const numeric = Number.parseFloat(trimmed.replace(/px$/, ""));
		return Number.isFinite(numeric) ? numeric : undefined;
	};

	const widthPx = parseCssPx(widthMatch?.[1]);
	const heightPx = parseCssPx(heightMatch?.[1]);
	if (widthPx && heightPx) {
		return { widthPx, heightPx };
	}

	const viewBoxMatch = svg.match(/\bviewBox="([^"]+)"/);
	if (viewBoxMatch) {
		const parts = viewBoxMatch[1].trim().split(/\s+/).map(Number.parseFloat);
		if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
			const vbWidth = parts[2];
			const vbHeight = parts[3];
			if (vbWidth > 0 && vbHeight > 0) {
				return { widthPx: vbWidth, heightPx: vbHeight };
			}
		}
	}

	// Conservative fallback: a reasonable page/image size.
	return { widthPx: 1920, heightPx: 1080 };
}

/**
 * Convert CSS px (96 dpi) to PDF points (72 dpi).
 */
function pxToPt(px: number): number {
	return (px * 72) / 96;
}

/**
 * Temporarily installs a JSDOM window/document on globalThis so Mermaid can render.
 * Restores previous globals after execution.
 */
async function withDom<T>(fn: (dom: JSDOM) => Promise<T>): Promise<T> {
	const previousWindow = (globalThis as unknown as { window?: unknown }).window;
	const previousDocument = (globalThis as unknown as { document?: unknown })
		.document;

	const dom = new JSDOM("<!doctype html><html><body></body></html>");
	(globalThis as unknown as { window: unknown }).window = dom.window;
	(globalThis as unknown as { document: unknown }).document =
		dom.window.document;

	try {
		// Mermaid uses SVG measurement APIs (notably getBBox) for layout.
		// JSDOM does not implement these, so we provide a conservative polyfill.
		installSvgMeasurementPolyfills(dom.window);

		return await fn(dom);
	} finally {
		(globalThis as unknown as { window?: unknown }).window = previousWindow;
		(globalThis as unknown as { document?: unknown }).document =
			previousDocument;
	}
}

/**
 * Install minimal SVG measurement polyfills required by Mermaid.
 *
 * Mermaid uses getBBox() to measure text and shapes for layout.
 * JSDOM doesn't implement getBBox, so we approximate it.
 *
 * This is intentionally conservative: it aims for correct-enough sizing to avoid overlaps,
 * not perfect typographic metrics.
 */
function installSvgMeasurementPolyfills(window: unknown): void {
	const w = window as unknown as {
		SVGElement?: { prototype: Record<string, unknown> };
		SVGGraphicsElement?: { prototype: Record<string, unknown> };
		Element?: { prototype: Record<string, unknown> };
	};

	const proto =
		w.SVGGraphicsElement?.prototype ?? w.SVGElement?.prototype ?? undefined;
	const elementProto = w.Element?.prototype;

	// If SVG prototypes exist and already have getBBox, we're done.
	if (proto && typeof proto.getBBox === "function") {
		return;
	}

	// If Element already has getBBox, we're done (covers both SVG + non-SVG elements).
	if (elementProto && typeof elementProto.getBBox === "function") {
		return;
	}

	const getBBoxPolyfill = function getBBoxPolyfill(this: Element): {
		x: number;
		y: number;
		width: number;
		height: number;
	} {
		const tag = String(this.tagName ?? "").toLowerCase();
		const text = typeof this.textContent === "string" ? this.textContent : "";

		// Try to infer font-size from style attribute; default to 16px.
		const style =
			typeof this.getAttribute === "function" ? this.getAttribute("style") : "";
		const fontSizeMatch =
			typeof style === "string"
				? style.match(/font-size:\\s*([\\d.]+)px/i)
				: null;
		const fontSizePx = fontSizeMatch ? Number.parseFloat(fontSizeMatch[1]) : 16;

		// Approximate text width: average glyph width ~= 0.6em.
		if (tag === "text" || tag === "tspan") {
			const width = Math.max(1, text.length) * fontSizePx * 0.6;
			const height = fontSizePx;
			return { x: 0, y: 0, width, height };
		}

		// For rect-like elements, try width/height attributes.
		const widthAttr =
			typeof this.getAttribute === "function"
				? this.getAttribute("width")
				: undefined;
		const heightAttr =
			typeof this.getAttribute === "function"
				? this.getAttribute("height")
				: undefined;
		const width = widthAttr ? Number.parseFloat(String(widthAttr)) : fontSizePx;
		const height = heightAttr
			? Number.parseFloat(String(heightAttr))
			: fontSizePx;

		return {
			x: 0,
			y: 0,
			width: Number.isFinite(width) && width > 0 ? width : fontSizePx,
			height: Number.isFinite(height) && height > 0 ? height : fontSizePx,
		};
	};

	// Prefer installing on SVG prototypes when available, but also install on Element to be safe.
	if (proto) {
		proto.getBBox = getBBoxPolyfill;
	}
	if (elementProto) {
		elementProto.getBBox = getBBoxPolyfill;
	}
}

/**
 * Render Mermaid text to an SVG string using Mermaid's in-process renderer.
 */
async function loadMermaid(): Promise<typeof import("mermaid").default> {
	// Mermaid's bundled ESM build includes DOMPurify, but it expects `window`/`document`
	// to exist at module evaluation time. So we load it lazily *after* JSDOM is installed.
	const mod = await import("mermaid/dist/mermaid.esm.min.mjs");
	return (mod as unknown as { default: typeof import("mermaid").default }).default;
}

async function renderMermaidToSvg(content: string): Promise<string> {
	return await withDom(async (dom) => {
		const mermaid = await loadMermaid();

		// Mermaid must be initialized before render.
		mermaid.initialize({
			startOnLoad: false,
			// This tool renders trusted, machine-generated Mermaid ERD content.
			// Using "loose" avoids DOMPurify hooks that aren't available in JSDOM by default.
			securityLevel: "loose",
		});

		const container = dom.window.document.body;
		const id = `erd_${Date.now()}_${Math.random().toString(16).slice(2)}`;
		const { svg } = await mermaid.render(id, content, container);
		return svg;
	});
}

/**
 * Rasterize SVG to PNG at a fixed high density.
 */
async function svgToPng(svg: string, outputPath: string): Promise<void> {
	// SVG is vector, so we can rasterize at high DPI for readability.
	// Sharp's SVG renderer uses `density` to control output resolution.
	const density = 300;
	await sharp(Buffer.from(svg), { density, limitInputPixels: false })
		.png()
		.toFile(outputPath);
}

/**
 * Convert SVG to a vector PDF.
 */
async function svgToPdfFile(svg: string, outputPath: string): Promise<void> {
	const { widthPx, heightPx } = getSvgSize(svg);
	const widthPt = pxToPt(widthPx);
	const heightPt = pxToPt(heightPx);

	const doc = new PDFDocument({
		size: [widthPt, heightPt],
		margin: 0,
	});

	const chunks: Buffer[] = [];
	doc.on("data", (chunk) => {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	});

	const done = new Promise<void>((resolve, reject) => {
		doc.on("end", () => resolve());
		doc.on("error", (err) => reject(err));
	});

	svgToPdf(doc, svg, 0, 0);
	doc.end();
	await done;

	await writeFile(outputPath, Buffer.concat(chunks));
}

/**
 * Vector-first renderer implementation.
 */
export class VectorRenderer implements DiagramRenderer {
	/** Unique renderer identifier */
	readonly name = "vector";

	/** Human-readable description */
	readonly description =
		"Vector-first Mermaid ERD renderer (default). Exports SVG/PNG/PDF without Puppeteer.";

	render(models: readonly TraversedModel[]): string {
		return renderMermaidErd(models);
	}

	async export(
		content: string,
		outputPath: string,
		format: ExportFormat,
	): Promise<void> {
		if (format === "svg") {
			const svg = await renderMermaidToSvg(content);
			await writeFile(outputPath, svg, "utf-8");
			return;
		}

		// For PNG/PDF we render SVG first to ensure consistent quality and sizing.
		const svg = await renderMermaidToSvg(content);

		if (format === "png") {
			await svgToPng(svg, outputPath);
			return;
		}

		if (format === "pdf") {
			await svgToPdfFile(svg, outputPath);
			return;
		}

		// Exhaustive guard for future formats.
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		throw new Error(`Unsupported export format: ${format}`);
	}

	supportsExport(): boolean {
		return true;
	}
}
