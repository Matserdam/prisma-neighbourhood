/**
 * @fileoverview Prisma schema parser using @prisma/internals.
 * Parses Prisma schema files and converts them to our internal representation.
 */

import { readFile } from "node:fs/promises";
import { getDMMF } from "@prisma/internals";
import type {
	Field,
	Model,
	ParseResult,
	ParserOptions,
	Relation,
	RelationType,
} from "./types";

/**
 * Determines the relation type based on field properties.
 * Analyzes the field and its corresponding back-relation to determine cardinality.
 *
 * @param field - The DMMF field being analyzed
 * @param relatedField - The corresponding field on the related model (if found)
 * @returns The appropriate RelationType
 */
function determineRelationType(
	field: { isList: boolean; isRequired: boolean },
	relatedField: { isList: boolean; isRequired: boolean } | undefined,
): RelationType {
	// If this field is a list
	if (field.isList) {
		// If the related field is also a list, it's many-to-many
		if (relatedField?.isList) {
			return "MANY_TO_MANY";
		}
		// This side is "many", so from parent's perspective it's one-to-many
		return "ONE_TO_MANY";
	}

	// This field is not a list (single reference)
	// If the related field is a list, it's the "one" side of one-to-many
	if (relatedField?.isList) {
		return "ONE_TO_MANY";
	}

	// Neither side is a list - it's one-to-one
	return "ONE_TO_ONE";
}

/**
 * Checks if a field is a relation field (references another model).
 *
 * @param field - The DMMF field to check
 * @returns True if the field is a relation
 */
function isRelationField(field: {
	kind: string;
	relationName?: string | null;
}): boolean {
	return field.kind === "object" && field.relationName !== undefined;
}

/**
 * Checks if a field has the @id attribute (is a primary key).
 *
 * @param field - The DMMF field to check
 * @returns True if the field is a primary key
 */
function isPrimaryKeyField(field: { isId: boolean }): boolean {
	return field.isId;
}

/**
 * Checks if a field has the @unique attribute.
 *
 * @param field - The DMMF field to check
 * @returns True if the field is unique
 */
function isUniqueField(field: { isUnique: boolean }): boolean {
	return field.isUnique;
}

/**
 * Parses a Prisma schema file and returns a structured representation.
 *
 * Uses @prisma/internals getDMMF to parse the schema file and extract
 * model definitions, fields, and relationships.
 *
 * @param options - Parser configuration options
 * @returns A ParseResult containing the parsed schema or an error
 *
 * @example
 * ```typescript
 * const result = await parseSchema({ schemaPath: './prisma/schema.prisma' });
 * if (result.success) {
 *   console.log(result.schema.models);
 * }
 * ```
 */
export async function parseSchema(
	options: ParserOptions,
): Promise<ParseResult> {
	const { schemaPath } = options;

	try {
		// Step 1: Read the schema file content
		let schemaContent: string;
		try {
			schemaContent = await readFile(schemaPath, "utf-8");
		} catch {
			return {
				success: false,
				error: `Failed to read schema file: ${schemaPath}`,
			};
		}

		// Step 2: Parse the schema using Prisma's DMMF generator
		const dmmf = await getDMMF({ datamodel: schemaContent });

		// Step 3: Build a lookup map of all models for relation resolution
		const dmmfModels = dmmf.datamodel.models;
		const modelMap = new Map<string, (typeof dmmfModels)[number]>();
		for (const model of dmmfModels) {
			modelMap.set(model.name, model);
		}

		// Step 4: Convert DMMF models to our internal representation
		const models = new Map<string, Model>();

		for (const dmmfModel of dmmfModels) {
			// Parse all fields in the model
			const fields: Field[] = [];
			const relations: Relation[] = [];

			for (const dmmfField of dmmfModel.fields) {
				// Create the field representation
				const field: Field = {
					name: dmmfField.name,
					type: dmmfField.type,
					isRequired: dmmfField.isRequired,
					isList: dmmfField.isList,
					isPrimaryKey: isPrimaryKeyField(dmmfField),
					isUnique: isUniqueField(dmmfField),
					isRelation: isRelationField(dmmfField),
				};

				fields.push(field);

				// If this is a relation field, also create a Relation entry
				if (isRelationField(dmmfField)) {
					// Find the related model to determine relation type
					const relatedModel = modelMap.get(dmmfField.type);
					const relatedField = relatedModel?.fields.find(
						(f) =>
							f.relationName === dmmfField.relationName &&
							f.name !== dmmfField.name,
					);

					// Determine relation type based on both sides
					const relationType = determineRelationType(
						{ isList: dmmfField.isList, isRequired: dmmfField.isRequired },
						relatedField
							? {
									isList: relatedField.isList,
									isRequired: relatedField.isRequired,
								}
							: undefined,
					);

					// Determine if this side owns the relation (has the foreign key)
					// The owner is the side that has relationFromFields defined
					const isOwner =
						dmmfField.relationFromFields !== undefined &&
						dmmfField.relationFromFields.length > 0;

					const relation: Relation = {
						relatedModel: dmmfField.type,
						type: relationType,
						fieldName: dmmfField.name,
						isOwner,
					};

					relations.push(relation);
				}
			}

			// Create the model representation
			const model: Model = {
				name: dmmfModel.name,
				fields,
				relations,
			};

			models.set(model.name, model);
		}

		// Step 5: Return the parsed schema
		return {
			success: true,
			schema: { models },
		};
	} catch (error) {
		// Handle any parsing errors from getDMMF
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return {
			success: false,
			error: `Failed to parse schema: ${errorMessage}`,
		};
	}
}
