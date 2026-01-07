/**
 * @fileoverview Tests for the CLI interface.
 * Tests cover command-line argument parsing, renderer selection, and output.
 */

import { describe, expect, it } from "vitest";
import { parseCliOptions } from "../cli/options";
import { DEFAULT_CLI_OPTIONS } from "../cli/types";
import { rendererRegistry } from "../renderer";

describe("CLI", () => {
	describe("parseCliOptions", () => {
		it("should parse required flag arguments", () => {
			// Act
			const result = parseCliOptions([
				"--schema",
				"./schema.prisma",
				"--model",
				"User",
			]);

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			expect(result.options.schema).toBe("./schema.prisma");
			expect(result.options.model).toBe("User");
		});

		it("should parse short flag arguments", () => {
			// Act
			const result = parseCliOptions(["-s", "./schema.prisma", "-m", "User"]);

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			expect(result.options.schema).toBe("./schema.prisma");
			expect(result.options.model).toBe("User");
		});

		it("should use default depth of 3", () => {
			// Act
			const result = parseCliOptions(["-s", "./schema.prisma", "-m", "User"]);

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			expect(result.options.depth).toBe(DEFAULT_CLI_OPTIONS.depth);
		});

		it("should parse --depth option", () => {
			// Act
			const result = parseCliOptions([
				"-s",
				"./schema.prisma",
				"-m",
				"User",
				"--depth",
				"5",
			]);

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			expect(result.options.depth).toBe(5);
		});

		it("should parse -d short option for depth", () => {
			// Act
			const result = parseCliOptions([
				"-s",
				"./schema.prisma",
				"-m",
				"User",
				"-d",
				"2",
			]);

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			expect(result.options.depth).toBe(2);
		});

		it("should use default renderer of 'mermaid'", () => {
			// Act
			const result = parseCliOptions(["-s", "./schema.prisma", "-m", "User"]);

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			expect(result.options.renderer).toBe(DEFAULT_CLI_OPTIONS.renderer);
		});

		it("should parse --renderer option", () => {
			// Act
			const result = parseCliOptions([
				"-s",
				"./schema.prisma",
				"-m",
				"User",
				"--renderer",
				"plantuml",
			]);

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			expect(result.options.renderer).toBe("plantuml");
		});

		it("should parse -r short option for renderer", () => {
			// Act
			const result = parseCliOptions([
				"-s",
				"./schema.prisma",
				"-m",
				"User",
				"-r",
				"d2",
			]);

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			expect(result.options.renderer).toBe("d2");
		});

		it("should parse --output option", () => {
			// Act
			const result = parseCliOptions([
				"-s",
				"./schema.prisma",
				"-m",
				"User",
				"--output",
				"./diagram.mmd",
			]);

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			expect(result.options.output).toBe("./diagram.mmd");
		});

		it("should parse -o short option for output", () => {
			// Act
			const result = parseCliOptions([
				"-s",
				"./schema.prisma",
				"-m",
				"User",
				"-o",
				"./output.png",
			]);

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			expect(result.options.output).toBe("./output.png");
		});

		it("should parse --list-renderers flag", () => {
			// Act
			const result = parseCliOptions(["--list-renderers"]);

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			expect(result.options.listRenderers).toBe(true);
		});

		it("should return error for missing --schema option", () => {
			// Act
			const result = parseCliOptions(["-m", "User"]);

			// Assert
			expect(result.success).toBe(false);
			if (result.success) return;

			expect(result.error).toContain("--schema");
		});

		it("should return error for missing --model option", () => {
			// Act
			const result = parseCliOptions(["-s", "./schema.prisma"]);

			// Assert
			expect(result.success).toBe(false);
			if (result.success) return;

			expect(result.error).toContain("--model");
		});

		it("should combine multiple options", () => {
			// Act
			const result = parseCliOptions([
				"-s",
				"./schema.prisma",
				"-m",
				"User",
				"-d",
				"4",
				"-r",
				"mermaid",
				"-o",
				"./output.png",
			]);

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			expect(result.options).toMatchObject({
				schema: "./schema.prisma",
				model: "User",
				depth: 4,
				renderer: "mermaid",
				output: "./output.png",
			});
		});

		it("should return error for unexpected positional argument", () => {
			// Act
			const result = parseCliOptions([
				"-s",
				"./schema.prisma",
				"-m",
				"User",
				"unexpected",
			]);

			// Assert
			expect(result.success).toBe(false);
			if (result.success) return;

			expect(result.error).toContain("Unexpected argument");
		});
	});

	describe("Renderer Registry Integration", () => {
		it("should have mermaid as the default renderer", () => {
			expect(rendererRegistry.getDefault()).toBeDefined();
			expect(rendererRegistry.getDefaultName()).toBe("mermaid");
		});

		it("should list mermaid in available renderers", () => {
			const names = rendererRegistry.listNames();
			expect(names).toContain("mermaid");
		});
	});
});
