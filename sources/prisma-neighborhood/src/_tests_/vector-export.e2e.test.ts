/**
 * @fileoverview End-to-end smoke tests for VectorRenderer export.
 * These tests validate we can produce real SVG/PNG outputs without Puppeteer.
 */

import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { VectorRenderer } from "../renderer/vector-renderer";

describe("VectorRenderer export (e2e)", () => {
	it("should export SVG and PNG for a small diagram", async () => {
		const renderer = new VectorRenderer();

		// Minimal ER diagram that Mermaid can render.
		const content = [
			"erDiagram",
			"  User {",
			"    Int id PK",
			"    String email UK",
			"  }",
			"  Post {",
			"    Int id PK",
			"    String title",
			"  }",
			'  User ||--o{ Post : "posts"',
			"",
		].join("\n");

		const dir = await mkdtemp(join(tmpdir(), "prisma-neighborhood-e2e-"));
		const svgPath = join(dir, "erd.svg");
		const pngPath = join(dir, "erd.png");

		await renderer.export(content, svgPath, "svg");
		await renderer.export(content, pngPath, "png");

		const svg = await readFile(svgPath, "utf-8");
		expect(svg).toContain("<svg");
		// Ensure we don't produce a tiny/cropped viewport (which makes outputs look empty).
		const viewBoxMatch = svg.match(/\bviewBox="([^"]+)"/);
		expect(viewBoxMatch).not.toBeNull();
		const viewBoxParts = viewBoxMatch?.[1]
			.trim()
			.split(/\s+/)
			.map((v) => Number.parseFloat(v));
		expect(viewBoxParts?.length).toBe(4);
		const viewBoxWidth = viewBoxParts?.[2] ?? 0;
		const viewBoxHeight = viewBoxParts?.[3] ?? 0;
		// We mainly want to avoid the "tiny viewBox" bug that makes outputs look empty.
		expect(viewBoxWidth).toBeGreaterThan(50);
		expect(viewBoxHeight).toBeGreaterThan(50);

		const png = await readFile(pngPath);
		// PNG signature bytes: 89 50 4E 47 0D 0A 1A 0A
		expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");

		const pngStats = await stat(pngPath);
		expect(pngStats.size).toBeGreaterThan(1000);
	}, 30000); // Increased timeout for mermaid-cli which can be slow on first run
});
