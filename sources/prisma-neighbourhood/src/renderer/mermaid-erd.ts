/**
 * @fileoverview Shared Mermaid ERD text generation.
 * Renders models, views, and enums as Mermaid ERD syntax.
 */

import type { Enum, Model, View } from "../parser/types";
import type { TraversedEntity } from "../traversal/types";

/**
 * Maps our RelationType to Mermaid ERD relationship notation.
 *
 * Mermaid ERD relationship notation:
 * - ||--|| : one-to-one
 * - ||--o{ : one-to-many (one to zero or more)
 * - }o--o{ : many-to-many
 */
const RELATION_SYMBOLS = {
	ONE_TO_ONE: "||--||",
	ONE_TO_MANY: "||--o{",
	MANY_TO_MANY: "}o--o{",
} as const;

/**
 * Symbol for enum usage relationship (one-to-one, as each field uses exactly one enum).
 */
const ENUM_USAGE_SYMBOL = "}o--||";

/**
 * Renders a model or view as a Mermaid ERD entity.
 *
 * @param entity - The model or view to render
 * @param isView - Whether this entity is a view
 * @param lines - Array to append lines to
 */
function renderModelOrView(
	entity: Model | View,
	isView: boolean,
	lines: string[],
): void {
	// Views get a prefix and need quotes; models don't
	const displayName = isView ? `"[view] ${entity.name}"` : entity.name;
	lines.push(`  ${displayName} {`);

	// Render non-relation fields
	for (const field of entity.fields) {
		// Skip relation fields (they're represented as relationship lines)
		if (field.isRelation) {
			continue;
		}

		// Build field line: type name [modifiers]
		const modifiers: string[] = [];
		if (field.isPrimaryKey) {
			modifiers.push("PK");
		}
		if (field.isUnique && !field.isPrimaryKey) {
			modifiers.push("UK");
		}

		const modifierStr = modifiers.length > 0 ? ` ${modifiers.join(",")}` : "";
		lines.push(`    ${field.type} ${field.name}${modifierStr}`);
	}

	lines.push("  }");
}

/**
 * Renders an enum as a Mermaid ERD entity.
 * Enum values are displayed with the enum name as their type.
 *
 * @param enumDef - The enum to render
 * @param lines - Array to append lines to
 */
function renderEnum(enumDef: Enum, lines: string[]): void {
	lines.push(`  "[enum] ${enumDef.name}" {`);

	// Render each enum value with enum name as type
	// Mermaid ERD requires "type name" format for all attributes
	for (const value of enumDef.values) {
		lines.push(`    ${enumDef.name} ${value}`);
	}

	lines.push("  }");
}

/**
 * Generate Mermaid ERD syntax from traversed entities.
 *
 * @param entities - Traversed entities (models, views, enums) to render
 * @returns Mermaid ERD text
 */
export function renderMermaidErd(entities: readonly TraversedEntity[]): string {
	const lines: string[] = ["erDiagram"];

	// Track rendered relationships to avoid duplicates
	const renderedRelations = new Set<string>();

	// Build sets of entity names by type for relationship validation
	const modelViewNames = new Set<string>();
	const enumNames = new Set<string>();

	// Map entity names to their display names (with prefixes for views/enums)
	const displayNames = new Map<string, string>();

	for (const { entity, kind } of entities) {
		if (kind === "enum") {
			enumNames.add(entity.name);
			displayNames.set(entity.name, `"[enum] ${entity.name}"`);
		} else if (kind === "view") {
			modelViewNames.add(entity.name);
			displayNames.set(entity.name, `"[view] ${entity.name}"`);
		} else {
			modelViewNames.add(entity.name);
			displayNames.set(entity.name, entity.name);
		}
	}

	// Helper to get display name (with fallback to original)
	const getDisplayName = (name: string): string =>
		displayNames.get(name) ?? name;

	// Step 1: Render each entity
	for (const { entity, kind } of entities) {
		if (kind === "enum") {
			renderEnum(entity as Enum, lines);
		} else {
			renderModelOrView(entity as Model | View, kind === "view", lines);
		}
	}

	// Step 2: Render relationships between models/views
	for (const { entity, kind } of entities) {
		if (kind === "enum") {
			continue; // Enum relationships are handled below
		}

		const modelOrView = entity as Model | View;

		// Render model-to-model/view relations
		for (const relation of modelOrView.relations) {
			// Only render if the related entity is in our traversed set
			if (!modelViewNames.has(relation.relatedModel)) {
				continue;
			}

			// Create a canonical key to avoid duplicate relations
			const sortedNames = [entity.name, relation.relatedModel].sort();
			const relationKey = `model:${sortedNames[0]}-${sortedNames[1]}`;

			// Skip if we've already rendered this relationship
			if (renderedRelations.has(relationKey)) {
				continue;
			}

			// Get the Mermaid relationship symbol
			const symbol = RELATION_SYMBOLS[relation.type];

			// Render the relationship line with display names
			lines.push(
				`  ${getDisplayName(entity.name)} ${symbol} ${getDisplayName(relation.relatedModel)} : "${relation.fieldName}"`,
			);

			renderedRelations.add(relationKey);
		}

		// Render model/view-to-enum relations (enum field usage)
		for (const field of modelOrView.fields) {
			// Skip non-enum fields
			if (!enumNames.has(field.type)) {
				continue;
			}

			// Create a canonical key for this enum usage
			const enumRelationKey = `enum:${entity.name}-${field.type}-${field.name}`;

			// Skip if we've already rendered this relationship
			if (renderedRelations.has(enumRelationKey)) {
				continue;
			}

			// Render the enum usage relationship with display names
			lines.push(
				`  ${getDisplayName(entity.name)} ${ENUM_USAGE_SYMBOL} ${getDisplayName(field.type)} : "${field.name}"`,
			);

			renderedRelations.add(enumRelationKey);
		}
	}

	return lines.join("\n");
}
