/**
 * @fileoverview Prisma schema parser using @prisma/internals.
 * Parses Prisma schema files and converts them to our internal representation.
 */

import { readFile } from "node:fs/promises";
import { getDMMF } from "@prisma/internals";
import type {
	Enum,
	Field,
	Model,
	ParseResult,
	ParserOptions,
	Relation,
	RelationType,
	View,
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
 * DMMF field type used for parsing models and views.
 */
type DMMFField = {
	readonly name: string;
	readonly type: string;
	readonly isRequired: boolean;
	readonly isList: boolean;
	readonly isId: boolean;
	readonly isUnique: boolean;
	readonly kind: string;
	readonly relationName?: string | null;
	readonly relationFromFields?: readonly string[];
};

/**
 * Extracts view names from the raw Prisma schema content.
 * Since DMMF may not differentiate views from models, we parse the schema
 * text to find `view` declarations.
 *
 * @param schemaContent - Raw Prisma schema file content
 * @returns Set of view names declared in the schema
 */
function extractViewNames(schemaContent: string): Set<string> {
	const viewNames = new Set<string>();
	// Match "view <Name> {" with optional whitespace
	const viewRegex = /^\s*view\s+(\w+)\s*\{/gm;
	let match: RegExpExecArray | null;
	while ((match = viewRegex.exec(schemaContent)) !== null) {
		viewNames.add(match[1]);
	}
	return viewNames;
}

/**
 * DMMF model/view type used for parsing.
 */
type DMMFModelOrView = {
	readonly name: string;
	readonly fields: readonly DMMFField[];
};

/**
 * Parses fields and relations from a DMMF model or view.
 *
 * @param dmmfEntity - The DMMF model or view to parse
 * @param entityLookup - Map of all models and views for relation resolution
 * @returns Object containing parsed fields and relations
 */
function parseFieldsAndRelations(
	dmmfEntity: DMMFModelOrView,
	entityLookup: Map<string, DMMFModelOrView>,
): { fields: Field[]; relations: Relation[] } {
	const fields: Field[] = [];
	const relations: Relation[] = [];

	for (const dmmfField of dmmfEntity.fields) {
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
			// Find the related entity to determine relation type
			const relatedEntity = entityLookup.get(dmmfField.type);
			const relatedField = relatedEntity?.fields.find(
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

	return { fields, relations };
}

/**
 * Parses a Prisma schema file and returns a structured representation.
 *
 * Uses @prisma/internals getDMMF to parse the schema file and extract
 * model, view, and enum definitions with their fields and relationships.
 *
 * @param options - Parser configuration options
 * @returns A ParseResult containing the parsed schema or an error
 *
 * @example
 * ```typescript
 * const result = await parseSchema({ schemaPath: './prisma/schema.prisma' });
 * if (result.success) {
 *   console.log(result.schema.models);
 *   console.log(result.schema.views);
 *   console.log(result.schema.enums);
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

		// Step 3: Extract view names from raw schema (DMMF may not separate them)
		const viewNamesFromSchema = extractViewNames(schemaContent);

		// Step 4: Build a lookup map of all models and views for relation resolution
		// DMMF puts both models and views in the models array, so we use schema parsing
		// to differentiate them
		const dmmfModels = dmmf.datamodel.models;
		const dmmfEnums = dmmf.datamodel.enums ?? [];

		const entityLookup = new Map<string, DMMFModelOrView>();
		for (const model of dmmfModels) {
			entityLookup.set(model.name, model);
		}

		// Step 5: Separate models and views based on schema parsing
		const models = new Map<string, Model>();
		const views = new Map<string, View>();

		for (const dmmfModel of dmmfModels) {
			const { fields, relations } = parseFieldsAndRelations(
				dmmfModel,
				entityLookup,
			);

			// Check if this is actually a view based on schema parsing
			if (viewNamesFromSchema.has(dmmfModel.name)) {
				const view: View = {
					name: dmmfModel.name,
					fields,
					relations,
				};
				views.set(view.name, view);
			} else {
				const model: Model = {
					name: dmmfModel.name,
					fields,
					relations,
				};
				models.set(model.name, model);
			}
		}

		// Step 6: Convert DMMF enums to our internal representation
		const enums = new Map<string, Enum>();
		for (const dmmfEnum of dmmfEnums) {
			const enumDef: Enum = {
				name: dmmfEnum.name,
				values: dmmfEnum.values.map((v) => v.name),
			};
			enums.set(enumDef.name, enumDef);
		}

		// Step 7: Return the parsed schema
		return {
			success: true,
			schema: { models, views, enums },
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
