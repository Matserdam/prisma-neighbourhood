/**
 * @fileoverview CLI option parsing utilities.
 * Parses command-line arguments into structured options.
 */

import type { CliOptions } from "./types";
import { DEFAULT_CLI_OPTIONS } from "./types";

/**
 * Result of CLI option parsing.
 */
export type ParseResult =
	| { readonly success: true; readonly options: CliOptions }
	| { readonly success: false; readonly error: string };

/**
 * Parse CLI arguments into structured options.
 *
 * Arguments format:
 *   prisma-erd [options]
 *
 * Options:
 *   -s, --schema <path>    Path to the Prisma schema file
 *   -m, --model <name>     Name of the model to start traversal from
 *   -d, --depth <n>        Traversal depth (default: 3)
 *   -r, --renderer <name>  Diagram renderer (default: "mermaid")
 *   -o, --output <file>    Output file: .mmd, .md (text), .png, .pdf (image)
 *   --list-renderers       Show available renderers
 *
 * @param args - Command-line arguments (without node and script path)
 * @returns A ParseResult containing the parsed options or an error
 *
 * @example
 * ```typescript
 * const result = parseCliOptions(['--schema', './schema.prisma', '--model', 'User', '-d', '5']);
 * if (result.success) {
 *   console.log(result.options);
 * }
 * ```
 */
export function parseCliOptions(args: string[]): ParseResult {
	// Initialize options with defaults
	let schema: string | undefined;
	let model: string | undefined;
	let depth = DEFAULT_CLI_OPTIONS.depth;
	let renderer: string = DEFAULT_CLI_OPTIONS.renderer;
	let output: string | undefined;
	let listRenderers = DEFAULT_CLI_OPTIONS.listRenderers;

	// Parse arguments
	let i = 0;

	while (i < args.length) {
		const arg = args[i];

		// Handle flags and options
		if (arg.startsWith("-")) {
			switch (arg) {
				case "-s":
				case "--schema": {
					i++;
					const value = args[i];
					if (!value || value.startsWith("-")) {
						return {
							success: false,
							error: "Missing value for --schema option",
						};
					}
					schema = value;
					break;
				}

				case "-m":
				case "--model": {
					i++;
					const value = args[i];
					if (!value || value.startsWith("-")) {
						return {
							success: false,
							error: "Missing value for --model option",
						};
					}
					model = value;
					break;
				}

				case "-d":
				case "--depth": {
					i++;
					const depthValue = args[i];
					if (!depthValue || depthValue.startsWith("-")) {
						return {
							success: false,
							error: "Missing value for --depth option",
						};
					}
					const parsed = parseInt(depthValue, 10);
					if (Number.isNaN(parsed) || parsed < 0) {
						return {
							success: false,
							error: `Invalid depth value: ${depthValue}`,
						};
					}
					depth = parsed;
					break;
				}

				case "-r":
				case "--renderer": {
					i++;
					const rendererValue = args[i];
					if (!rendererValue || rendererValue.startsWith("-")) {
						return {
							success: false,
							error: "Missing value for --renderer option",
						};
					}
					renderer = rendererValue;
					break;
				}

				case "-o":
				case "--output": {
					i++;
					const outputValue = args[i];
					if (!outputValue || outputValue.startsWith("-")) {
						return {
							success: false,
							error: "Missing value for --output option",
						};
					}
					output = outputValue;
					break;
				}

				case "--list-renderers": {
					listRenderers = true;
					break;
				}

				case "-h":
				case "--help": {
					return {
						success: false,
						error: "HELP_REQUESTED",
					};
				}

				case "-V":
				case "--version": {
					return {
						success: false,
						error: "VERSION_REQUESTED",
					};
				}

				default: {
					return { success: false, error: `Unknown option: ${arg}` };
				}
			}
		} else {
			// Unexpected positional argument
			return { success: false, error: `Unexpected argument: ${arg}` };
		}

		i++;
	}

	// If --list-renderers is set, we don't need schema/model
	if (listRenderers) {
		return {
			success: true,
			options: {
				schema: "",
				model: "",
				depth,
				renderer,
				output,
				listRenderers,
			},
		};
	}

	// Validate required options
	if (!schema) {
		return { success: false, error: "Missing required option: --schema" };
	}
	if (!model) {
		return { success: false, error: "Missing required option: --model" };
	}

	return {
		success: true,
		options: {
			schema,
			model,
			depth,
			renderer,
			output,
			listRenderers,
		},
	};
}
