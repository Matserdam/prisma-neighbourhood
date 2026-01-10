/**
 * @fileoverview Vector-first renderer.
 *
 * This renderer generates Mermaid ERD text (same as the Mermaid renderer),
 * and supports exporting to SVG/PNG/PDF using @mermaid-js/mermaid-cli
 * with sharp for high-DPI PNG and pdfkit for vector PDF.
 */

import { writeFile } from "node:fs/promises";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import type { TraversedEntity } from "../traversal/types";
import { renderMermaidErd } from "./mermaid-erd";
import type { DiagramRenderer, ExportFormat } from "./types";
import { runMermaidCli } from "./utils/mermaid-cli";

/**
 * Vector-first renderer implementation.
 */
export class VectorRenderer implements DiagramRenderer {
	/** Unique renderer identifier */
	readonly name = "vector";

	/** Human-readable description */
	readonly description =
		"Vector-first Mermaid ERD renderer (default). Exports SVG/PNG/PDF using mermaid-cli with sharp for high-DPI output.";

	render(entities: readonly TraversedEntity[]): string {
		return renderMermaidErd(entities);
	}

	async export(
		content: string,
		outputPath: string,
		format: ExportFormat,
	): Promise<void> {
		// Always get SVG from mermaid-cli first
		const svg = (await runMermaidCli(content, {
			outputFormat: "svg",
		})) as string;

		if (format === "svg") {
			await writeFile(outputPath, svg, "utf-8");
			return;
		}

		// Convert SVG to high-DPI PNG using sharp (300 DPI) with white background
		const pngBuffer = await sharp(Buffer.from(svg), { density: 300 })
			.flatten({ background: { r: 255, g: 255, b: 255 } })
			.png()
			.toBuffer();

		if (format === "png") {
			await writeFile(outputPath, pngBuffer);
			return;
		}

		if (format === "pdf") {
			// Embed PNG into PDF
			const metadata = await sharp(pngBuffer).metadata();
			const width = metadata.width ?? 1920;
			const height = metadata.height ?? 1080;

			const doc = new PDFDocument({
				size: [width, height],
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

			doc.image(pngBuffer, 0, 0, { width, height });
			doc.end();
			await done;

			await writeFile(outputPath, Buffer.concat(chunks));
			return;
		}

		throw new Error(`Unsupported export format: ${format}`);
	}

	supportsExport(): boolean {
		return true;
	}
}
