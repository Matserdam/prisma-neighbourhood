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

  /** Renderer to use (default: "mermaid") */
  readonly renderer: string;

  /** Output file path (stdout if not specified). Extension determines format: .mmd/.md (text), .png/.pdf (image) */
  readonly output?: string;

  /** List available renderers and exit */
  readonly listRenderers: boolean;
}

/**
 * Default CLI options.
 */
export const DEFAULT_CLI_OPTIONS: Partial<CliOptions> = {
  depth: 3,
  renderer: "mermaid",
  listRenderers: false,
};
