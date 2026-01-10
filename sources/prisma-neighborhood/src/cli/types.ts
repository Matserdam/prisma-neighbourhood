/**
 * @fileoverview Type definitions for CLI options and configuration.
 */

/**
 * CLI command options parsed from command-line arguments.
 */
export interface CliOptions {
	/** Path to the Prisma schema file */
	readonly schema: string;

	/** Name of the model to start traversal from */
	readonly model: string;

	/** Maximum traversal depth (default: 3) */
	readonly depth: number;

	/** Renderer to use (default: "vector") */
	readonly renderer: string;

	/** Output file path (stdout if not specified). Extension determines format: .mmd/.md (text), .png/.pdf (image) */
	readonly output?: string;

	/** List available renderers and exit */
	readonly listRenderers: boolean;
}

/**
 * Default CLI options.
 */
export const DEFAULT_CLI_OPTIONS: {
	depth: number;
	renderer: string;
	listRenderers: boolean;
} = {
	depth: 3,
	renderer: "vector",
	listRenderers: false,
};
