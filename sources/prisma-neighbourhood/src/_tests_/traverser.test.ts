/**
 * @fileoverview Tests for the model traverser.
 * Tests cover BFS traversal, depth limiting, and cycle detection.
 */

import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { parseSchema } from "../parser/schema-parser";
import type { ParsedSchema } from "../parser/types";
import { traverseModels } from "../traversal/model-traverser";

/** Helper to get the path to a test fixture */
const fixturePath = (name: string): string =>
	path.join(__dirname, "fixtures", name);

describe("Model Traverser", () => {
	let simpleSchema: ParsedSchema;
	let selfRefSchema: ParsedSchema;

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
	});

	describe("traverseModels", () => {
		it("should return the starting model at depth 0", () => {
			// Act
			const result = traverseModels(simpleSchema, {
				startModel: "User",
				maxDepth: 0,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			expect(result.models).toHaveLength(1);
			expect(result.models[0].model.name).toBe("User");
			expect(result.models[0].depth).toBe(0);
		});

		it("should traverse related models at depth 1", () => {
			// Act
			const result = traverseModels(simpleSchema, {
				startModel: "User",
				maxDepth: 1,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			// User has relations to Post and Profile
			const modelNames = result.models.map((m) => m.model.name);
			expect(modelNames).toContain("User");
			expect(modelNames).toContain("Post");
			expect(modelNames).toContain("Profile");

			// Check depths
			const userModel = result.models.find((m) => m.model.name === "User");
			const postModel = result.models.find((m) => m.model.name === "Post");
			const profileModel = result.models.find(
				(m) => m.model.name === "Profile",
			);

			expect(userModel?.depth).toBe(0);
			expect(postModel?.depth).toBe(1);
			expect(profileModel?.depth).toBe(1);
		});

		it("should traverse to specified max depth", () => {
			// Act - Start from User with depth 2, should reach Tag through Post
			const result = traverseModels(simpleSchema, {
				startModel: "User",
				maxDepth: 2,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			const modelNames = result.models.map((m) => m.model.name);
			expect(modelNames).toContain("User"); // depth 0
			expect(modelNames).toContain("Post"); // depth 1
			expect(modelNames).toContain("Profile"); // depth 1
			expect(modelNames).toContain("Tag"); // depth 2 (through Post)

			// Tag should be at depth 2
			const tagModel = result.models.find((m) => m.model.name === "Tag");
			expect(tagModel?.depth).toBe(2);
		});

		it("should not exceed max depth", () => {
			// Act - Start from Tag with depth 1, should not reach User
			const result = traverseModels(simpleSchema, {
				startModel: "Tag",
				maxDepth: 1,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			const modelNames = result.models.map((m) => m.model.name);
			expect(modelNames).toContain("Tag"); // depth 0
			expect(modelNames).toContain("Post"); // depth 1
			expect(modelNames).not.toContain("User"); // would be depth 2
		});

		it("should use default depth of 3 when not specified", () => {
			// Act
			const result = traverseModels(simpleSchema, {
				startModel: "User",
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			// Should traverse all models in the schema with default depth
			expect(result.models.length).toBeGreaterThanOrEqual(4);
		});

		it("should not visit the same model twice (cycle detection)", () => {
			// Act - User -> Post -> User would create a cycle
			const result = traverseModels(simpleSchema, {
				startModel: "User",
				maxDepth: 5,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			// Each model should only appear once
			const modelNames = result.models.map((m) => m.model.name);
			const uniqueNames = new Set(modelNames);
			expect(modelNames.length).toBe(uniqueNames.size);
		});

		it("should handle self-referential relations", () => {
			// Act
			const result = traverseModels(selfRefSchema, {
				startModel: "Employee",
				maxDepth: 3,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			// Employee should only appear once despite self-reference
			const employeeModels = result.models.filter(
				(m) => m.model.name === "Employee",
			);
			expect(employeeModels).toHaveLength(1);
			expect(employeeModels[0].depth).toBe(0);
		});

		it("should return error for non-existent start model", () => {
			// Act
			const result = traverseModels(simpleSchema, {
				startModel: "NonExistent",
				maxDepth: 3,
			});

			// Assert
			expect(result.success).toBe(false);
			if (result.success) return;

			expect(result.error).toContain("NonExistent");
		});

		it("should return models in BFS order (breadth-first)", () => {
			// Act
			const result = traverseModels(simpleSchema, {
				startModel: "User",
				maxDepth: 2,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			// Verify BFS order: all depth N models come before depth N+1 models
			let previousDepth = 0;
			for (const traversed of result.models) {
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
			const result = traverseModels(simpleSchema, {
				startModel: "Profile",
				maxDepth: 2,
			});

			// Assert
			expect(result.success).toBe(true);
			if (!result.success) return;

			const modelNames = result.models.map((m) => m.model.name);
			expect(modelNames).toContain("Profile"); // depth 0
			expect(modelNames).toContain("User"); // depth 1
			expect(modelNames).toContain("Post"); // depth 2 (through User)
		});
	});
});
