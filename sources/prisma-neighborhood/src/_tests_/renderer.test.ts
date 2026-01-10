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
import { traverseEntities } from "../traversal/entity-traverser";
import type { TraversedEntity } from "../traversal/types";

/** Helper to get the path to a test fixture */
const fixturePath = (name: string): string =>
	path.join(__dirname, "fixtures", name);

describe("Renderer System", () => {
	let simpleSchema: ParsedSchema;
	let enumsViewsSchema: ParsedSchema;
	let traversedEntities: readonly TraversedEntity[];
	let enumsViewsEntities: readonly TraversedEntity[];

	// Load test schemas and traverse entities before running tests
	beforeAll(async () => {
		const result = await parseSchema({
			schemaPath: fixturePath("simple.prisma"),
		});
		if (!result.success) {
			throw new Error("Failed to parse simple.prisma fixture");
		}
		simpleSchema = result.schema;

		const traversalResult = traverseEntities(simpleSchema, {
			startEntity: "User",
			maxDepth: 2,
		});
		if (!traversalResult.success) {
			throw new Error("Failed to traverse entities");
		}
		traversedEntities = traversalResult.entities;

		// Load schema with enums and views
		const enumsViewsResult = await parseSchema({
			schemaPath: fixturePath("with-enums-views.prisma"),
		});
		if (!enumsViewsResult.success) {
			throw new Error("Failed to parse with-enums-views.prisma fixture");
		}
		enumsViewsSchema = enumsViewsResult.schema;

		const enumsViewsTraversalResult = traverseEntities(enumsViewsSchema, {
			startEntity: "User",
			maxDepth: 2,
		});
		if (!enumsViewsTraversalResult.success) {
			throw new Error("Failed to traverse entities from enums-views schema");
		}
		enumsViewsEntities = enumsViewsTraversalResult.entities;
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

		it("should render empty entities as minimal ERD", () => {
			// Act
			const output = renderer.render([]);

			// Assert
			expect(output).toContain("erDiagram");
		});

		it("should render model with fields", () => {
			// Arrange - Get just the User entity
			const userOnly = traversedEntities.filter(
				(e) => e.entity.name === "User",
			);

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
			const output = renderer.render(traversedEntities);

			// Assert - Should contain relationship notation
			// Mermaid ERD: ||--o{ for one-to-many
			expect(output).toMatch(/User.*Post|Post.*User/);
		});

		it("should render one-to-one relationships", () => {
			// Act - User has one Profile
			const output = renderer.render(traversedEntities);

			// Assert - Should contain relationship notation
			// Mermaid ERD: ||--|| for one-to-one
			expect(output).toMatch(/User.*Profile|Profile.*User/);
		});

		it("should render many-to-many relationships", () => {
			// Act - Post has many Tags, Tag has many Posts
			const output = renderer.render(traversedEntities);

			// Assert - Should contain relationship notation
			// Mermaid ERD: }o--o{ for many-to-many
			expect(output).toMatch(/Post.*Tag|Tag.*Post/);
		});

		it("should mark primary key fields", () => {
			// Act
			const output = renderer.render(traversedEntities);

			// Assert - PK fields should be marked (Mermaid format: type name modifiers)
			expect(output).toMatch(/Int\s+id\s+PK/);
		});

		it("should mark unique fields", () => {
			// Act
			const output = renderer.render(traversedEntities);

			// Assert - Email is unique in User model (Mermaid format: type name modifiers)
			expect(output).toMatch(/String\s+email\s+UK/);
		});

		it("should handle optional fields", () => {
			// Act
			const output = renderer.render(traversedEntities);

			// Assert - name is optional in User
			// Optional fields don't get special marking in Mermaid ERD
			expect(output).toContain("name");
		});

		it("should produce valid Mermaid syntax", () => {
			// Act
			const output = renderer.render(traversedEntities);

			// Assert - Basic Mermaid ERD structure
			expect(output).toMatch(/^erDiagram/m);
			// Models should be formatted correctly
			expect(output).toMatch(/\w+\s*\{/);
			// Fields should be formatted as: type name
			expect(output).toMatch(/\s+\w+\s+\w+/);
		});
	});

	describe("MermaidRenderer - Enums", () => {
		let renderer: MermaidRenderer;

		beforeEach(() => {
			renderer = new MermaidRenderer();
		});

		it("should render enums as entities with prefix", () => {
			// Act
			const output = renderer.render(enumsViewsEntities);

			// Assert - Role enum should be rendered with [enum] prefix
			expect(output).toContain('"[enum] Role"');
		});

		it("should render enum values with enum name as type", () => {
			// Act
			const output = renderer.render(enumsViewsEntities);

			// Assert - Enum values should have enum name as type
			expect(output).toMatch(/Role\s+USER/);
			expect(output).toMatch(/Role\s+ADMIN/);
			expect(output).toMatch(/Role\s+MODERATOR/);
		});

		it("should render relationships between models and enums", () => {
			// Act
			const output = renderer.render(enumsViewsEntities);

			// Assert - User model uses Role enum
			expect(output).toMatch(/User.*Role|Role.*User/);
		});

		it("should render multiple enums correctly", () => {
			// Arrange - Traverse from Post to get Status enum
			const postTraversal = traverseEntities(enumsViewsSchema, {
				startEntity: "Post",
				maxDepth: 1,
			});
			if (!postTraversal.success) throw new Error("Failed to traverse");

			// Act
			const output = renderer.render(postTraversal.entities);

			// Assert - Status enum should be rendered with prefix and enum name as type
			expect(output).toContain('"[enum] Status"');
			expect(output).toMatch(/Status\s+DRAFT/);
			expect(output).toMatch(/Status\s+PUBLISHED/);
			expect(output).toMatch(/Status\s+ARCHIVED/);
		});
	});

	describe("MermaidRenderer - Views", () => {
		let renderer: MermaidRenderer;

		beforeEach(() => {
			renderer = new MermaidRenderer();
		});

		it("should render views as entities with prefix", () => {
			// Arrange - Traverse starting from a view
			const viewTraversal = traverseEntities(enumsViewsSchema, {
				startEntity: "UserPostCount",
				maxDepth: 0,
			});
			if (!viewTraversal.success) throw new Error("Failed to traverse");

			// Act
			const output = renderer.render(viewTraversal.entities);

			// Assert - View should be rendered with [view] prefix
			expect(output).toContain('"[view] UserPostCount"');
		});

		it("should render view fields correctly", () => {
			// Arrange - Traverse starting from a view
			const viewTraversal = traverseEntities(enumsViewsSchema, {
				startEntity: "UserPostCount",
				maxDepth: 0,
			});
			if (!viewTraversal.success) throw new Error("Failed to traverse");

			// Act
			const output = renderer.render(viewTraversal.entities);

			// Assert - View fields should be shown
			expect(output).toContain("id");
			expect(output).toContain("email");
			expect(output).toContain("postCount");
		});

		it("should render views with prefix and models without", () => {
			// Arrange - Get view and model separately
			const viewTraversal = traverseEntities(enumsViewsSchema, {
				startEntity: "UserPostCount",
				maxDepth: 0,
			});
			const modelTraversal = traverseEntities(enumsViewsSchema, {
				startEntity: "User",
				maxDepth: 0,
			});
			if (!viewTraversal.success || !modelTraversal.success) {
				throw new Error("Failed to traverse");
			}

			// Act
			const viewOutput = renderer.render(viewTraversal.entities);
			const modelOutput = renderer.render(modelTraversal.entities);

			// Assert - Views have [view] prefix, models don't
			expect(viewOutput).toContain('"[view] UserPostCount"');
			expect(modelOutput).toMatch(/^ {2}User \{/m);
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
			const output = renderer.render(traversedEntities);
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
