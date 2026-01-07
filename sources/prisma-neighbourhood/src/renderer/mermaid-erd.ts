/**
 * @fileoverview Shared Mermaid ERD text generation.
 * Kept in a separate module so multiple renderers can reuse the exact same ERD output.
 */

import type { TraversedModel } from "../traversal/types";

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
 * Generate Mermaid ERD syntax from traversed models.
 *
 * @param models - Traversed models to render
 * @returns Mermaid ERD text
 */
export function renderMermaidErd(models: readonly TraversedModel[]): string {
	const lines: string[] = ["erDiagram"];

	// Track rendered relationships to avoid duplicates
	const renderedRelations = new Set<string>();

	// Step 1: Render each model as an entity with fields
	for (const { model } of models) {
		lines.push(`  ${model.name} {`);

		// Render non-relation fields
		for (const field of model.fields) {
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

	// Step 2: Render relationships between models
	const modelNames = new Set(models.map((m) => m.model.name));

	for (const { model } of models) {
		for (const relation of model.relations) {
			// Only render if both models are in our traversed set
			if (!modelNames.has(relation.relatedModel)) {
				continue;
			}

			// Create a canonical key to avoid duplicate relations
			// Sort model names alphabetically to ensure A->B and B->A produce the same key
			const sortedNames = [model.name, relation.relatedModel].sort();
			const relationKey = `${sortedNames[0]}-${sortedNames[1]}`;

			// Skip if we've already rendered this relationship
			if (renderedRelations.has(relationKey)) {
				continue;
			}

			// Get the Mermaid relationship symbol
			const symbol = RELATION_SYMBOLS[relation.type];

			// Determine relationship label based on field name
			const label = relation.fieldName;

			// Render the relationship line
			// Format: EntityA ||--o{ EntityB : "label"
			lines.push(
				`  ${model.name} ${symbol} ${relation.relatedModel} : "${label}"`,
			);

			// Mark this relationship as rendered
			renderedRelations.add(relationKey);
		}
	}

	return lines.join("\n");
}
