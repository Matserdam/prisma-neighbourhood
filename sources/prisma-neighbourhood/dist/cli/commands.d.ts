/**
 * @fileoverview CLI command definitions using Commander.
 * Defines the main CLI program and its commands.
 */
import { Command } from "commander";
/**
 * Creates and configures the CLI program.
 *
 * @returns The configured Commander program
 */
export declare function createProgram(): Command;
/**
 * Runs the CLI with the provided arguments.
 *
 * @param args - Command-line arguments (typically process.argv)
 */
export declare function runCli(args: string[]): Promise<void>;
//# sourceMappingURL=commands.d.ts.map