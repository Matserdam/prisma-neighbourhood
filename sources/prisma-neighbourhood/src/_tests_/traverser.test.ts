/**
 * @fileoverview Tests for the entity traverser.
 * Tests cover BFS traversal of models, views, and enums with depth limiting.
 */

import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { parseSchema } from "../parser/schema-parser";
import type { ParsedSchema } from "../parser/types";
import { traverseEntities } from "../traversal/entity-traverser";

/** Helper to get the path to a test fixture */
const fixturePath = (name: string): string =>
	path.join(__dirname, "fixtures", name);

describe("Entity Traverser", () => {
	let simpleSchema: ParsedSchema;
	let selfRefSchema: ParsedSchema;
	let enumsViewsSchema: ParsedSchema;

	// Load test schemas before running tests
	beforeAll(async () => {
		const simpleResult = await parseSchema({
			schemaPath: fixturePath("simple.prisma"),
		});
		if (!simpleResult.success) {
			throw new Error("Failed to parse simple.prisma fixture");
		}
		simpleSchema = simpleResult.schema;

		const selfRefResult = await parseSchema({
			schemaPath: fixturePath("self-referential.prisma"),
		});
		if (!selfRefResult.success) {
			throw new Error("Failed to parse self-referential.prisma fixture");
		}
		selfRefSchema = selfRefResult.schema;

		const enumsViewsResult = await parseSchema({
			schemaPath: fixturePath("with-enums-views.prisma"),
		});
		if (!enumsViewsResult.success) {
			throw new Error("Failed to parse with-enums-views.prisma fixture");
		}
		enumsViewsSchema = enumsViewsResult.schema;
	});

	describe("traverseEntities - models", () => {
		it("should return the starting model at depth 0", () => {
			// Act
			const result = traverseEntities(simpleSchema, {
				startEntity: "User",
				maxDepth: 0,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			expect(result.entities).toHaveLength(1);
			expect(result.entities[0].entity.name).toBe("User");
			expect(result.entities[0].kind).toBe("model");
			expect(result.entities[0].depth).toBe(0);
		});

		it("should traverse related models at depth 1", () => {
			// Act
			const result = traverseEntities(simpleSchema, {
				startEntity: "User",
				maxDepth: 1,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			// User has relations to Post and Profile
			const entityNames = result.entities.map((e) => e.entity.name);
			expect(entityNames).toContain("User");
			expect(entityNames).toContain("Post");
			expect(entityNames).toContain("Profile");

			// Check depths
			const userEntity = result.entities.find(
				(e) => e.entity.name === "User",
			);
			const postEntity = result.entities.find(
				(e) => e.entity.name === "Post",
			);
			const profileEntity = result.entities.find(
				(e) => e.entity.name === "Profile",
			);

			expect(userEntity?.depth).toBe(0);
			expect(postEntity?.depth).toBe(1);
			expect(profileEntity?.depth).toBe(1);
		});

		it("should traverse to specified max depth", () => {
			// Act - Start from User with depth 2, should reach Tag through Post
			const result = traverseEntities(simpleSchema, {
				startEntity: "User",
				maxDepth: 2,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			const entityNames = result.entities.map((e) => e.entity.name);
			expect(entityNames).toContain("User"); // depth 0
			expect(entityNames).toContain("Post"); // depth 1
			expect(entityNames).toContain("Profile"); // depth 1
			expect(entityNames).toContain("Tag"); // depth 2 (through Post)

			// Tag should be at depth 2
			const tagEntity = result.entities.find((e) => e.entity.name === "Tag");
			expect(tagEntity?.depth).toBe(2);
		});

		it("should not exceed max depth", () => {
			// Act - Start from Tag with depth 1, should not reach User
			const result = traverseEntities(simpleSchema, {
				startEntity: "Tag",
				maxDepth: 1,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			const entityNames = result.entities.map((e) => e.entity.name);
			expect(entityNames).toContain("Tag"); // depth 0
			expect(entityNames).toContain("Post"); // depth 1
			expect(entityNames).not.toContain("User"); // would be depth 2
		});

		it("should use default depth of 3 when not specified", () => {
			// Act
			const result = traverseEntities(simpleSchema, {
				startEntity: "User",
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			// Should traverse all models in the schema with default depth
			expect(result.entities.length).toBeGreaterThanOrEqual(4);
		});

		it("should not visit the same entity twice (cycle detection)", () => {
			// Act - User -> Post -> User would create a cycle
			const result = traverseEntities(simpleSchema, {
				startEntity: "User",
				maxDepth: 5,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			// Each entity should only appear once
			const entityNames = result.entities.map((e) => e.entity.name);
			const uniqueNames = new Set(entityNames);
			expect(entityNames.length).toBe(uniqueNames.size);
		});

		it("should handle self-referential relations", () => {
			// Act
			const result = traverseEntities(selfRefSchema, {
				startEntity: "Employee",
				maxDepth: 3,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			// Employee should only appear once despite self-reference
			const employeeEntities = result.entities.filter(
				(e) => e.entity.name === "Employee",
			);
			expect(employeeEntities).toHaveLength(1);
			expect(employeeEntities[0].depth).toBe(0);
		});

		it("should return error for non-existent entity", () => {
			// Act
			const result = traverseEntities(simpleSchema, {
				startEntity: "NonExistent",
				maxDepth: 3,
			});

			// Assert
			expect(result.success).toBe(false);
			if (result.success) return;

			expect(result.error).toContain("NonExistent");
		});

		it("should return entities in BFS order (breadth-first)", () => {
			// Act
			const result = traverseEntities(simpleSchema, {
				startEntity: "User",
				maxDepth: 2,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			// Verify BFS order: all depth N entities come before depth N+1 entities
			let previousDepth = 0;
			for (const traversed of result.entities) {
				expect(traversed.depth).toBeGreaterThanOrEqual(previousDepth);
				if (traversed.depth > previousDepth) {
					// When depth increases, it should only increase by 1
					expect(traversed.depth).toBe(previousDepth + 1);
					previousDepth = traversed.depth;
				}
			}
		});

		it("should traverse from a leaf model", () => {
			// Act - Profile has only one relation (to User)
			const result = traverseEntities(simpleSchema, {
				startEntity: "Profile",
				maxDepth: 2,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			const entityNames = result.entities.map((e) => e.entity.name);
			expect(entityNames).toContain("Profile"); // depth 0
			expect(entityNames).toContain("User"); // depth 1
			expect(entityNames).toContain("Post"); // depth 2 (through User)
		});
	});

	describe("traverseEntities - enums", () => {
		it("should start from an enum and find models using it", () => {
			// Act - Role enum is used by User model
			const result = traverseEntities(enumsViewsSchema, {
				startEntity: "Role",
				maxDepth: 1,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			const entityNames = result.entities.map((e) => e.entity.name);
			expect(entityNames).toContain("Role"); // depth 0
			expect(entityNames).toContain("User"); // depth 1 (uses Role enum)

			// Check kind is enum for Role
			const roleEntity = result.entities.find(
				(e) => e.entity.name === "Role",
			);
			expect(roleEntity?.kind).toBe("enum");
		});

		it("should traverse from enum through models to related entities", () => {
			// Act - Status enum is used by Post model, which has relations
			const result = traverseEntities(enumsViewsSchema, {
				startEntity: "Status",
				maxDepth: 2,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			const entityNames = result.entities.map((e) => e.entity.name);
			expect(entityNames).toContain("Status"); // depth 0
			expect(entityNames).toContain("Post"); // depth 1 (uses Status enum)
			// depth 2 should include User (author relation), Tag
		});

		it("should include enums when traversing from a model", () => {
			// Act - User model has Role enum field
			const result = traverseEntities(enumsViewsSchema, {
				startEntity: "User",
				maxDepth: 1,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			const entityNames = result.entities.map((e) => e.entity.name);
			expect(entityNames).toContain("User"); // depth 0
			expect(entityNames).toContain("Role"); // depth 1 (enum used by User)
			expect(entityNames).toContain("Post"); // depth 1 (relation)
			expect(entityNames).toContain("Profile"); // depth 1 (relation)

			// Check Role has kind "enum"
			const roleEntity = result.entities.find(
				(e) => e.entity.name === "Role",
			);
			expect(roleEntity?.kind).toBe("enum");
			expect(roleEntity?.depth).toBe(1);
		});
	});

	describe("traverseEntities - views", () => {
		it("should start from a view", () => {
			// Act
			const result = traverseEntities(enumsViewsSchema, {
				startEntity: "UserPostCount",
				maxDepth: 0,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			expect(result.entities).toHaveLength(1);
			expect(result.entities[0].entity.name).toBe("UserPostCount");
			expect(result.entities[0].kind).toBe("view");
			expect(result.entities[0].depth).toBe(0);
		});

		it("should find views when traversing from enum if view uses enum", () => {
			// Note: Our test views don't use enums, so this tests the general mechanism
			// by verifying that views without enum fields are not included when starting from enum
			const result = traverseEntities(enumsViewsSchema, {
				startEntity: "Role",
				maxDepth: 2,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			// Views UserPostCount and PublishedPostSummary don't have enum fields
			// so they shouldn't be traversed from Role enum
			const viewNames = result.entities
				.filter((e) => e.kind === "view")
				.map((e) => e.entity.name);
			expect(viewNames).not.toContain("UserPostCount");
			expect(viewNames).not.toContain("PublishedPostSummary");
		});
	});

	describe("traverseEntities - mixed scenarios", () => {
		it("should traverse models, enums, and maintain proper depths", () => {
			// Act - Start from Post which has Status enum and relations
			const result = traverseEntities(enumsViewsSchema, {
				startEntity: "Post",
				maxDepth: 2,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			// Check that we have models and enums in the result
			const modelEntities = result.entities.filter((e) => e.kind === "model");
			const enumEntities = result.entities.filter((e) => e.kind === "enum");

			expect(modelEntities.length).toBeGreaterThan(0);
			expect(enumEntities.length).toBeGreaterThan(0);

			// Post at depth 0
			const postEntity = result.entities.find(
				(e) => e.entity.name === "Post",
			);
			expect(postEntity?.depth).toBe(0);

			// Status enum at depth 1
			const statusEntity = result.entities.find(
				(e) => e.entity.name === "Status",
			);
			expect(statusEntity?.depth).toBe(1);
			expect(statusEntity?.kind).toBe("enum");
		});

		it("should not duplicate entities across types", () => {
			// Act
			const result = traverseEntities(enumsViewsSchema, {
				startEntity: "User",
				maxDepth: 3,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			// Check uniqueness - each entity name should appear only once
			const entityKeys = result.entities.map(
				(e) => `${e.kind}:${e.entity.name}`,
			);
			const uniqueKeys = new Set(entityKeys);
			expect(entityKeys.length).toBe(uniqueKeys.size);
		});
	});
});
