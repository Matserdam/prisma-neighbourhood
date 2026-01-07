/**
 * @fileoverview CLI option parsing utilities.
 * Parses command-line arguments into structured options.
 */
import type { CliOptions } from "./types";
/**
 * Result of CLI option parsing.
 */
export type ParseResult = {
    readonly success: true;
    readonly options: CliOptions;
} | {
    readonly success: false;
    readonly error: string;
};
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
export declare function parseCliOptions(args: string[]): ParseResult;
//# sourceMappingURL=options.d.ts.map