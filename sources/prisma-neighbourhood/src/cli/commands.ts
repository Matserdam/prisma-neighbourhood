/**
 * @fileoverview CLI command definitions using Commander.
 * Defines the main CLI program and its commands.
 */

import { writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { Command } from "commander";
import { parseSchema } from "../parser";
import { rendererRegistry } from "../renderer";
import type { ExportFormat } from "../renderer/types";
import { traverseModels } from "../traversal";
import { DEFAULT_CLI_OPTIONS } from "./types";

/** Supported output file extensions */
const SUPPORTED_EXTENSIONS = [".mmd", ".md", ".png", ".pdf"] as const;

/**
 * Gets the output format from a file extension.
 *
 * @param ext - The file extension (e.g., ".png")
 * @returns The export format, or undefined for text output
 */
function getFormatFromExtension(ext: string): ExportFormat | undefined {
	if (ext === ".png") return "png";
	if (ext === ".pdf") return "pdf";
	return undefined;
}

/**
 * Checks if an extension is supported.
 *
 * @param ext - The file extension to check
 * @returns True if the extension is supported
 */
function isSupportedExtension(ext: string): boolean {
	return SUPPORTED_EXTENSIONS.includes(
		ext as (typeof SUPPORTED_EXTENSIONS)[number],
	);
}

/**
 * Creates and configures the CLI program.
 *
 * @returns The configured Commander program
 */
export function createProgram(): Command {
	const program = new Command();

	program
		.name("prisma-neighborhood")
		.description("Generate Entity-Relationship Diagrams from Prisma schemas")
		.version("0.1.0")
		.option("-s, --schema <path>", "Path to the Prisma schema file")
		.option("-m, --model <name>", "Name of the model to start traversal from")
		.option(
			"-d, --depth <n>",
			"Traversal depth",
			String(DEFAULT_CLI_OPTIONS.depth),
		)
		.option(
			"-r, --renderer <name>",
			"Diagram renderer",
			DEFAULT_CLI_OPTIONS.renderer,
		)
		.option(
			"-o, --output <file>",
			"Output file: .mmd, .md (text), .png, .pdf (image)",
		)
		.option("--list-renderers", "Show available renderers")
		.action(runCommand);

	return program;
}

/**
 * Lists all available renderers and exits.
 */
function listRenderers(): void {
	console.log("Available renderers:\n");

	const defaultName = rendererRegistry.getDefaultName();
	const renderers = rendererRegistry.list();

	for (const renderer of renderers) {
		const isDefault = renderer.name === defaultName;
		const defaultMarker = isDefault ? " (default)" : "";
		const exportSupport = renderer.supportsExport()
			? " [supports PNG/PDF export]"
			: "";

		console.log(`  ${renderer.name}${defaultMarker}`);
		console.log(`    ${renderer.description}${exportSupport}`);
		console.log();
	}
}

/**
 * Main command action handler.
 *
 * @param options - Parsed CLI options
 */
async function runCommand(options: {
	schema?: string;
	model?: string;
	depth: string;
	renderer: string;
	output?: string;
	listRenderers?: boolean;
}): Promise<void> {
	try {
		// Handle --list-renderers flag first
		if (options.listRenderers) {
			listRenderers();
			return;
		}

		// Validate required arguments
		if (!options.schema) {
			console.error("Error: Missing required option: --schema <path>");
			process.exit(1);
		}
		if (!options.model) {
			console.error("Error: Missing required option: --model <name>");
			process.exit(1);
		}

		// Step 1: Validate and get the renderer
		const renderer = rendererRegistry.get(options.renderer);
		if (!renderer) {
			console.error(`Error: Unknown renderer "${options.renderer}"`);
			console.error(
				`Available renderers: ${rendererRegistry.listNames().join(", ")}`,
			);
			process.exit(1);
		}

		// Step 2: Determine output format from file extension
		let format: ExportFormat | undefined;
		if (options.output) {
			const ext = extname(options.output).toLowerCase();

			// Validate extension is supported
			if (!isSupportedExtension(ext)) {
				console.error(
					`Error: Unsupported file extension "${ext}". Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`,
				);
				process.exit(1);
			}

			// Get format for image extensions
			format = getFormatFromExtension(ext);

			// Check if renderer supports export for image formats
			if (format && !renderer.supportsExport()) {
				console.error(
					`Error: Renderer "${options.renderer}" does not support export to ${format}`,
				);
				process.exit(1);
			}
		}

		// Step 3: Parse the schema
		const parseResult = await parseSchema({ schemaPath: options.schema });
		if (!parseResult.success) {
			console.error(`Error: ${parseResult.error}`);
			process.exit(1);
		}

		// Step 4: Traverse models
		const depth = parseInt(options.depth, 10);
		const traversalResult = traverseModels(parseResult.schema, {
			startModel: options.model,
			maxDepth: depth,
		});

		if (!traversalResult.success) {
			console.error(`Error: ${traversalResult.error}`);
			process.exit(1);
		}

		// Step 5: Render the diagram
		const output = renderer.render(traversalResult.models);

		// Step 6: Output the result
		if (options.output) {
			if (format && renderer.export) {
				// Export to PNG/PDF
				await renderer.export(output, options.output, format);
				console.log(`Diagram exported to ${options.output}`);
			} else {
				// Write text output to file (.mmd or .md)
				await writeFile(options.output, output, "utf-8");
				console.log(`Diagram written to ${options.output}`);
			}
		} else {
			// Output to stdout
			console.log(output);
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error(`Error: ${message}`);
		process.exit(1);
	}
}

/**
 * Runs the CLI with the provided arguments.
 *
 * @param args - Command-line arguments (typically process.argv)
 */
export async function runCli(args: string[]): Promise<void> {
	const program = createProgram();
	await program.parseAsync(args);
}
