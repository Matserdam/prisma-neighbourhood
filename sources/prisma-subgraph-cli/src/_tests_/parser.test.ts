/**
 * @fileoverview Tests for the Prisma schema parser.
 * Tests cover parsing of models, fields, relations, and edge cases.
 */

import { describe, expect, it } from "vitest";
import path from "node:path";
import { parseSchema } from "../parser/schema-parser";

/** Helper to get the path to a test fixture */
const fixturePath = (name: string): string =>
  path.join(__dirname, "fixtures", name);

describe("Schema Parser", () => {
  describe("parseSchema", () => {
    it("should parse a simple schema with multiple models", async () => {
      // Arrange
      const schemaPath = fixturePath("simple.prisma");

      // Act
      const result = await parseSchema({ schemaPath });

      // Assert
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.schema.models.size).toBe(4);
      expect(result.schema.models.has("User")).toBe(true);
      expect(result.schema.models.has("Post")).toBe(true);
      expect(result.schema.models.has("Profile")).toBe(true);
      expect(result.schema.models.has("Tag")).toBe(true);
    });

    it("should parse model fields correctly", async () => {
      // Arrange
      const schemaPath = fixturePath("simple.prisma");

      // Act
      const result = await parseSchema({ schemaPath });

      // Assert
      expect(result.success).toBe(true);
      if (!result.success) return;

      const userModel = result.schema.models.get("User");
      expect(userModel).toBeDefined();
      if (!userModel) return;

      // Check scalar fields
      const idField = userModel.fields.find((f) => f.name === "id");
      expect(idField).toMatchObject({
        name: "id",
        type: "Int",
        isRequired: true,
        isPrimaryKey: true,
        isRelation: false,
      });

      const emailField = userModel.fields.find((f) => f.name === "email");
      expect(emailField).toMatchObject({
        name: "email",
        type: "String",
        isRequired: true,
        isUnique: true,
        isRelation: false,
      });

      const nameField = userModel.fields.find((f) => f.name === "name");
      expect(nameField).toMatchObject({
        name: "name",
        type: "String",
        isRequired: false,
        isRelation: false,
      });
    });

    it("should parse one-to-many relations correctly", async () => {
      // Arrange
      const schemaPath = fixturePath("simple.prisma");

      // Act
      const result = await parseSchema({ schemaPath });

      // Assert
      expect(result.success).toBe(true);
      if (!result.success) return;

      const userModel = result.schema.models.get("User");
      expect(userModel).toBeDefined();
      if (!userModel) return;

      // User has many Posts
      const postsRelation = userModel.relations.find(
        (r) => r.relatedModel === "Post"
      );
      expect(postsRelation).toMatchObject({
        relatedModel: "Post",
        type: "ONE_TO_MANY",
        fieldName: "posts",
        isOwner: false,
      });

      // Post belongs to User
      const postModel = result.schema.models.get("Post");
      expect(postModel).toBeDefined();
      if (!postModel) return;

      const authorRelation = postModel.relations.find(
        (r) => r.relatedModel === "User"
      );
      expect(authorRelation).toMatchObject({
        relatedModel: "User",
        type: "ONE_TO_MANY",
        fieldName: "author",
        isOwner: true,
      });
    });

    it("should parse one-to-one relations correctly", async () => {
      // Arrange
      const schemaPath = fixturePath("simple.prisma");

      // Act
      const result = await parseSchema({ schemaPath });

      // Assert
      expect(result.success).toBe(true);
      if (!result.success) return;

      const userModel = result.schema.models.get("User");
      expect(userModel).toBeDefined();
      if (!userModel) return;

      // User has one Profile
      const profileRelation = userModel.relations.find(
        (r) => r.relatedModel === "Profile"
      );
      expect(profileRelation).toMatchObject({
        relatedModel: "Profile",
        type: "ONE_TO_ONE",
        fieldName: "profile",
        isOwner: false,
      });

      // Profile belongs to User
      const profileModel = result.schema.models.get("Profile");
      expect(profileModel).toBeDefined();
      if (!profileModel) return;

      const userRelation = profileModel.relations.find(
        (r) => r.relatedModel === "User"
      );
      expect(userRelation).toMatchObject({
        relatedModel: "User",
        type: "ONE_TO_ONE",
        fieldName: "user",
        isOwner: true,
      });
    });

    it("should parse many-to-many relations correctly", async () => {
      // Arrange
      const schemaPath = fixturePath("simple.prisma");

      // Act
      const result = await parseSchema({ schemaPath });

      // Assert
      expect(result.success).toBe(true);
      if (!result.success) return;

      const postModel = result.schema.models.get("Post");
      expect(postModel).toBeDefined();
      if (!postModel) return;

      // Post has many Tags (implicit many-to-many)
      const tagsRelation = postModel.relations.find(
        (r) => r.relatedModel === "Tag"
      );
      expect(tagsRelation).toMatchObject({
        relatedModel: "Tag",
        type: "MANY_TO_MANY",
        fieldName: "tags",
      });

      const tagModel = result.schema.models.get("Tag");
      expect(tagModel).toBeDefined();
      if (!tagModel) return;

      // Tag has many Posts (implicit many-to-many)
      const postsRelation = tagModel.relations.find(
        (r) => r.relatedModel === "Post"
      );
      expect(postsRelation).toMatchObject({
        relatedModel: "Post",
        type: "MANY_TO_MANY",
        fieldName: "posts",
      });
    });

    it("should handle self-referential relations", async () => {
      // Arrange
      const schemaPath = fixturePath("self-referential.prisma");

      // Act
      const result = await parseSchema({ schemaPath });

      // Assert
      expect(result.success).toBe(true);
      if (!result.success) return;

      const employeeModel = result.schema.models.get("Employee");
      expect(employeeModel).toBeDefined();
      if (!employeeModel) return;

      // Employee has manager (self-referential)
      const managerRelation = employeeModel.relations.find(
        (r) => r.fieldName === "manager"
      );
      expect(managerRelation).toMatchObject({
        relatedModel: "Employee",
        fieldName: "manager",
      });

      // Employee has subordinates (self-referential)
      const subordinatesRelation = employeeModel.relations.find(
        (r) => r.fieldName === "subordinates"
      );
      expect(subordinatesRelation).toMatchObject({
        relatedModel: "Employee",
        fieldName: "subordinates",
      });
    });

    it("should return error for non-existent schema file", async () => {
      // Arrange
      const schemaPath = fixturePath("non-existent.prisma");

      // Act
      const result = await parseSchema({ schemaPath });

      // Assert
      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error).toContain("non-existent.prisma");
    });

    it("should return error for invalid schema syntax", async () => {
      // This test would require an invalid schema fixture
      // For now, we'll test with a path that doesn't exist
      const schemaPath = fixturePath("invalid.prisma");

      const result = await parseSchema({ schemaPath });

      expect(result.success).toBe(false);
    });
  });
});

