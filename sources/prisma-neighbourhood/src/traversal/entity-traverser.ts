/**
 * @fileoverview Unified entity traverser for depth-limited BFS traversal.
 * Traverses models, views, and enums from a starting entity with configurable depth.
 */

import type { Enum, Model, ParsedSchema, View } from "../parser/types";
import type {
	Entity,
	EntityKind,
	TraversalOptions,
	TraversalResult,
	TraversedEntity,
} from "./types";

/** Default maximum traversal depth when not specified */
const DEFAULT_MAX_DEPTH = 3;

/**
 * Creates a unique key for tracking visited entities.
 * Combines kind and name to ensure uniqueness across entity types.
 *
 * @param kind - The entity kind
 * @param name - The entity name
 * @returns A unique key string
 */
function entityKey(kind: EntityKind, name: string): string {
	return `${kind}:${name}`;
}

/**
 * Looks up an entity by name across all entity types.
 * Searches in order: models, views, enums.
 *
 * @param schema - The parsed schema
 * @param name - The entity name to find
 * @returns The entity and its kind, or undefined if not found
 */
function findEntity(
	schema: ParsedSchema,
	name: string,
): { entity: Entity; kind: EntityKind } | undefined {
	// Check models first
	const model = schema.models.get(name);
	if (model) {
		return { entity: model, kind: "model" };
	}

	// Check views
	const view = schema.views.get(name);
	if (view) {
		return { entity: view, kind: "view" };
	}

	// Check enums
	const enumDef = schema.enums.get(name);
	if (enumDef) {
		return { entity: enumDef, kind: "enum" };
	}

	return undefined;
}

/**
 * Finds all models and views that use a given enum type.
 *
 * @param schema - The parsed schema
 * @param enumName - The enum name to search for
 * @returns Array of models and views with their kinds
 */
function findEntitiesUsingEnum(
	schema: ParsedSchema,
	enumName: string,
): Array<{ entity: Model | View; kind: "model" | "view" }> {
	const result: Array<{ entity: Model | View; kind: "model" | "view" }> = [];

	// Search models
	for (const model of schema.models.values()) {
		const usesEnum = model.fields.some((f) => f.type === enumName);
		if (usesEnum) {
			result.push({ entity: model, kind: "model" });
		}
	}

	// Search views
	for (const view of schema.views.values()) {
		const usesEnum = view.fields.some((f) => f.type === enumName);
		if (usesEnum) {
			result.push({ entity: view, kind: "view" });
		}
	}

	return result;
}

/**
 * Gets enums referenced by a model or view's fields.
 *
 * @param entity - The model or view to check
 * @param schema - The parsed schema
 * @returns Array of enums referenced by the entity
 */
function getReferencedEnums(
	entity: Model | View,
	schema: ParsedSchema,
): Enum[] {
	const enums: Enum[] = [];
	for (const field of entity.fields) {
		const enumDef = schema.enums.get(field.type);
		if (enumDef) {
			enums.push(enumDef);
		}
	}
	return enums;
}

/**
 * Gets related models and views from a model or view's relations.
 *
 * @param entity - The model or view to get relations from
 * @param schema - The parsed schema
 * @returns Array of related models/views with their kinds
 */
function getRelatedEntities(
	entity: Model | View,
	schema: ParsedSchema,
): Array<{ entity: Model | View; kind: "model" | "view" }> {
	const result: Array<{ entity: Model | View; kind: "model" | "view" }> = [];

	for (const relation of entity.relations) {
		const relatedModel = schema.models.get(relation.relatedModel);
		if (relatedModel) {
			result.push({ entity: relatedModel, kind: "model" });
			continue;
		}

		const relatedView = schema.views.get(relation.relatedModel);
		if (relatedView) {
			result.push({ entity: relatedView, kind: "view" });
		}
	}

	return result;
}

/**
 * Performs a breadth-first traversal of entity relationships starting from
 * a specified entity (model, view, or enum) with configurable depth limiting.
 *
 * The traversal:
 * - Starts from the specified entity at depth 0
 * - Visits all related entities at each subsequent depth level
 * - For models/views: follows relations AND enum-type fields
 * - For enums: finds all models/views using that enum
 * - Tracks visited entities to prevent cycles
 * - Stops when max depth is reached or all reachable entities are visited
 *
 * @param schema - The parsed schema containing all entities
 * @param options - Traversal configuration options
 * @returns A TraversalResult containing the traversed entities or an error
 *
 * @example
 * ```typescript
 * const result = traverseEntities(schema, {
 *   startEntity: 'User',
 *   maxDepth: 2
 * });
 * if (result.success) {
 *   for (const { entity, kind, depth } of result.entities) {
 *     console.log(`${entity.name} (${kind}) at depth ${depth}`);
 *   }
 * }
 * ```
 */
export function traverseEntities(
	schema: ParsedSchema,
	options: TraversalOptions,
): TraversalResult {
	const { startEntity: startEntityName, maxDepth = DEFAULT_MAX_DEPTH } =
		options;

	// Step 1: Find the starting entity
	const startFound = findEntity(schema, startEntityName);
	if (!startFound) {
		return {
			success: false,
			error: `Entity "${startEntityName}" not found in schema (searched models, views, and enums)`,
		};
	}

	const { entity: startEntity, kind: startKind } = startFound;

	// Step 2: Initialize BFS data structures
	// - visited: Set of entity keys we've already added to the queue
	// - result: The traversed entities in BFS order
	// - queue: Entities to process, with their kind and depth level
	const visited = new Set<string>();
	const result: TraversedEntity[] = [];
	const queue: Array<{ entity: Entity; kind: EntityKind; depth: number }> = [];

	// Step 3: Start BFS with the initial entity
	queue.push({ entity: startEntity, kind: startKind, depth: 0 });
	visited.add(entityKey(startKind, startEntity.name));

	// Step 4: Process the queue in BFS order
	while (queue.length > 0) {
		// Dequeue the next entity to process
		const current = queue.shift();
		if (!current) break;
		const { entity, kind, depth } = current;

		// Add this entity to the result
		result.push({ entity, kind, depth });

		// If we've reached max depth, don't explore further from this entity
		if (depth >= maxDepth) {
			continue;
		}

		// Step 5: Explore neighbors based on entity kind
		if (kind === "enum") {
			// From enum: find all models/views that use this enum
			const users = findEntitiesUsingEnum(schema, entity.name);
			for (const { entity: user, kind: userKind } of users) {
				const key = entityKey(userKind, user.name);
				if (!visited.has(key)) {
					visited.add(key);
					queue.push({ entity: user, kind: userKind, depth: depth + 1 });
				}
			}
		} else {
			// From model/view: explore relations and enum references
			const modelOrView = entity as Model | View;

			// Follow relations to other models/views
			const related = getRelatedEntities(modelOrView, schema);
			for (const { entity: relatedEntity, kind: relatedKind } of related) {
				const key = entityKey(relatedKind, relatedEntity.name);
				if (!visited.has(key)) {
					visited.add(key);
					queue.push({
						entity: relatedEntity,
						kind: relatedKind,
						depth: depth + 1,
					});
				}
			}

			// Follow enum-type fields to enums
			const enums = getReferencedEnums(modelOrView, schema);
			for (const enumDef of enums) {
				const key = entityKey("enum", enumDef.name);
				if (!visited.has(key)) {
					visited.add(key);
					queue.push({ entity: enumDef, kind: "enum", depth: depth + 1 });
				}
			}
		}
	}

	// Step 6: Return the traversal result
	return {
		success: true,
		entities: result,
	};
}
