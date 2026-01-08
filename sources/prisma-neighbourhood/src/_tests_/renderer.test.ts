/**
 * @fileoverview Tests for the renderer system.
 * Tests cover DiagramRenderer interface compliance, Mermaid output, and registry.
 */

import path from "node:path";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { parseSchema } from "../parser/schema-parser";
import type { ParsedSchema } from "../parser/types";
import { MermaidRenderer } from "../renderer/mermaid-renderer";
import { RendererRegistry, rendererRegistry } from "../renderer/registry";
import type { DiagramRenderer } from "../renderer/types";
import { VectorRenderer } from "../renderer/vector-renderer";
import { traverseModels } from "../traversal/model-traverser";
import type { TraversedModel } from "../traversal/types";

/** Helper to get the path to a test fixture */
const fixturePath = (name: string): string =>
	path.join(__dirname, "fixtures", name);

describe("Renderer System", () => {
	let simpleSchema: ParsedSchema;
	let traversedModels: readonly TraversedModel[];

	// Load test schemas and traverse models before running tests
	beforeAll(async () => {
		const result = await parseSchema({
			schemaPath: fixturePath("simple.prisma"),
		});
		if (!result.success) {
			throw new Error("Failed to parse simple.prisma fixture");
		}
		simpleSchema = result.schema;

		const traversalResult = traverseModels(simpleSchema, {
			startModel: "User",
			maxDepth: 2,
		});
		if (!traversalResult.success) {
			throw new Error("Failed to traverse models");
		}
		traversedModels = traversalResult.models;
	});

	describe("RendererRegistry", () => {
		let registry: RendererRegistry;

		beforeEach(() => {
			registry = new RendererRegistry();
		});

		it("should register a renderer", () => {
			// Arrange
			const mockRenderer: DiagramRenderer = {
				name: "test",
				description: "Test renderer",
				render: () => "",
				supportsExport: () => false,
			};

			// Act
			registry.register({ renderer: mockRenderer });

			// Assert
			expect(registry.has("test")).toBe(true);
			expect(registry.get("test")).toBe(mockRenderer);
		});

		it("should throw on duplicate registration", () => {
			// Arrange
			const mockRenderer: DiagramRenderer = {
				name: "test",
				description: "Test renderer",
				render: () => "",
				supportsExport: () => false,
			};
			registry.register({ renderer: mockRenderer });

			// Act & Assert
			expect(() => registry.register({ renderer: mockRenderer })).toThrow(
				'Renderer "test" is already registered',
			);
		});

		it("should set default renderer", () => {
			// Arrange
			const renderer1: DiagramRenderer = {
				name: "first",
				description: "First renderer",
				render: () => "first",
				supportsExport: () => false,
			};
			const renderer2: DiagramRenderer = {
				name: "second",
				description: "Second renderer",
				render: () => "second",
				supportsExport: () => false,
			};

			// Act
			registry.register({ renderer: renderer1 });
			registry.register({ renderer: renderer2, isDefault: true });

			// Assert
			expect(registry.getDefault()).toBe(renderer2);
			expect(registry.getDefaultName()).toBe("second");
		});

		it("should list all registered renderers", () => {
			// Arrange
			const renderer1: DiagramRenderer = {
				name: "first",
				description: "First renderer",
				render: () => "",
				supportsExport: () => false,
			};
			const renderer2: DiagramRenderer = {
				name: "second",
				description: "Second renderer",
				render: () => "",
				supportsExport: () => false,
			};

			// Act
			registry.register({ renderer: renderer1 });
			registry.register({ renderer: renderer2 });

			// Assert
			expect(registry.list()).toHaveLength(2);
			expect(registry.listNames()).toContain("first");
			expect(registry.listNames()).toContain("second");
		});

		it("should return undefined for unregistered renderer", () => {
			expect(registry.get("nonexistent")).toBeUndefined();
		});

		it("should default to 'vector' as default renderer name", () => {
			expect(registry.getDefaultName()).toBe("vector");
		});
	});

	describe("MermaidRenderer", () => {
		let renderer: MermaidRenderer;

		beforeEach(() => {
			renderer = new MermaidRenderer();
		});

		it("should have correct name and description", () => {
			expect(renderer.name).toBe("mermaid");
			expect(renderer.description).toContain("Mermaid");
		});

		it("should support export", () => {
			expect(renderer.supportsExport()).toBe(true);
		});

		it("should render empty models as minimal ERD", () => {
			// Act
			const output = renderer.render([]);

			// Assert
			expect(output).toContain("erDiagram");
		});

		it("should render model with fields", () => {
			// Arrange - Get just the User model
			const userOnly = traversedModels.filter((m) => m.model.name === "User");

			// Act
			const output = renderer.render(userOnly);

			// Assert
			expect(output).toContain("erDiagram");
			expect(output).toContain("User");
			expect(output).toContain("id");
			expect(output).toContain("email");
			expect(output).toContain("Int");
			expect(output).toContain("String");
		});

		it("should render one-to-many relationships", () => {
			// Act - User has many Posts
			const output = renderer.render(traversedModels);

			// Assert - Should contain relationship notation
			// Mermaid ERD: ||--o{ for one-to-many
			expect(output).toMatch(/User.*Post|Post.*User/);
		});

		it("should render one-to-one relationships", () => {
			// Act - User has one Profile
			const output = renderer.render(traversedModels);

			// Assert - Should contain relationship notation
			// Mermaid ERD: ||--|| for one-to-one
			expect(output).toMatch(/User.*Profile|Profile.*User/);
		});

		it("should render many-to-many relationships", () => {
			// Act - Post has many Tags, Tag has many Posts
			const output = renderer.render(traversedModels);

			// Assert - Should contain relationship notation
			// Mermaid ERD: }o--o{ for many-to-many
			expect(output).toMatch(/Post.*Tag|Tag.*Post/);
		});

		it("should mark primary key fields", () => {
			// Act
			const output = renderer.render(traversedModels);

			// Assert - PK fields should be marked (Mermaid format: type name modifiers)
			expect(output).toMatch(/Int\s+id\s+PK/);
		});

		it("should mark unique fields", () => {
			// Act
			const output = renderer.render(traversedModels);

			// Assert - Email is unique in User model (Mermaid format: type name modifiers)
			expect(output).toMatch(/String\s+email\s+UK/);
		});

		it("should handle optional fields", () => {
			// Act
			const output = renderer.render(traversedModels);

			// Assert - name is optional in User
			// Optional fields don't get special marking in Mermaid ERD
			expect(output).toContain("name");
		});

		it("should produce valid Mermaid syntax", () => {
			// Act
			const output = renderer.render(traversedModels);

			// Assert - Basic Mermaid ERD structure
			expect(output).toMatch(/^erDiagram/m);
			// Models should be formatted correctly
			expect(output).toMatch(/\w+\s*\{/);
			// Fields should be formatted as: type name
			expect(output).toMatch(/\s+\w+\s+\w+/);
		});
	});

	describe("VectorRenderer", () => {
		let renderer: VectorRenderer;

		beforeEach(() => {
			renderer = new VectorRenderer();
		});

		it("should have correct name and description", () => {
			expect(renderer.name).toBe("vector");
			expect(renderer.description).toContain("Vector");
		});

		it("should support export", () => {
			expect(renderer.supportsExport()).toBe(true);
		});

		it("should render Mermaid ERD text", () => {
			const output = renderer.render(traversedModels);
			expect(output).toMatch(/^erDiagram/m);
		});
	});

	describe("Global Registry", () => {
		beforeEach(() => {
			// Clear the global registry before each test
			rendererRegistry.clear();
		});

		it("should be a singleton instance", () => {
			expect(rendererRegistry).toBeInstanceOf(RendererRegistry);
		});

		it("should allow registering renderers globally", () => {
			// Arrange
			const mermaid = new MermaidRenderer();

			// Act
			rendererRegistry.register({ renderer: mermaid, isDefault: true });

			// Assert
			expect(rendererRegistry.get("mermaid")).toBe(mermaid);
			expect(rendererRegistry.getDefault()).toBe(mermaid);
		});
	});
});
