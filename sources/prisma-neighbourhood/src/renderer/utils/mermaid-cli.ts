import { exec } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface MermaidCliOptions {
	outputFormat: "svg" | "png" | "pdf";
	outputPath?: string;
	backgroundColor?: string;
	theme?: string;
}

/**
 * Mermaid config for SVG output compatible with sharp/librsvg.
 */
const MERMAID_CONFIG = {
	htmlLabels: false,
	flowchart: { htmlLabels: false },
};

/**
 * Custom CSS to fix relationship label text visibility.
 * The purple label boxes are fine, but the text inside needs to be dark for contrast.
 */
const CUSTOM_CSS = `
.edgeLabel .label {
  fill: #fff !important;
}
.edgeLabel tspan {
  fill: #333333 !important;
}
`;

/**
 * Runs @mermaid-js/mermaid-cli to render a diagram.
 *
 * @param mermaidContent - The Mermaid diagram syntax
 * @param options - Configuration options
 * @returns The rendered content as string (SVG) or Buffer (PNG/PDF)
 */
export async function runMermaidCli(
	mermaidContent: string,
	options: MermaidCliOptions,
): Promise<string | Buffer> {
	const tempDir = await mkdtemp(join(tmpdir(), "prisma-neighborhood-mermaid-"));
	const inputPath = join(tempDir, "input.mmd");
	const configPath = join(tempDir, "config.json");
	const cssPath = join(tempDir, "custom.css");
	const outputPath =
		options.outputPath ?? join(tempDir, `output.${options.outputFormat}`);

	try {
		await writeFile(inputPath, mermaidContent, "utf-8");
		await writeFile(configPath, JSON.stringify(MERMAID_CONFIG), "utf-8");
		await writeFile(cssPath, CUSTOM_CSS, "utf-8");

		const background = options.backgroundColor ?? "white";
		const theme = options.theme ?? "default";

		await execAsync(
			`bunx mmdc -i "${inputPath}" -o "${outputPath}" -c "${configPath}" -C "${cssPath}" -b ${background} -t ${theme}`,
		);

		if (options.outputFormat === "svg") {
			return await readFile(outputPath, "utf-8");
		}
		return await readFile(outputPath);
	} finally {
		await rm(tempDir, { recursive: true, force: true });
	}
}
