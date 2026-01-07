/**
 * @fileoverview Model traverser for depth-limited BFS traversal.
 * Traverses model relationships from a starting model with configurable depth.
 */

import type { Model, ParsedSchema } from "../parser/types";
import type {
	TraversalOptions,
	TraversalResult,
	TraversedModel,
} from "./types";

/** Default maximum traversal depth when not specified */
const DEFAULT_MAX_DEPTH = 3;

/**
 * Performs a breadth-first traversal of model relationships starting from
 * a specified model, with configurable depth limiting.
 *
 * The traversal:
 * - Starts from the specified model at depth 0
 * - Visits all related models at each subsequent depth level
 * - Tracks visited models to prevent cycles
 * - Stops when max depth is reached or all reachable models are visited
 *
 * @param schema - The parsed schema containing all models
 * @param options - Traversal configuration options
 * @returns A TraversalResult containing the traversed models or an error
 *
 * @example
 * ```typescript
 * const result = traverseModels(schema, {
 *   startModel: 'User',
 *   maxDepth: 2
 * });
 * if (result.success) {
 *   for (const { model, depth } of result.models) {
 *     console.log(`${model.name} at depth ${depth}`);
 *   }
 * }
 * ```
 */
export function traverseModels(
	schema: ParsedSchema,
	options: TraversalOptions,
): TraversalResult {
	const { startModel: startModelName, maxDepth = DEFAULT_MAX_DEPTH } = options;

	// Step 1: Validate that the start model exists
	const startModel = schema.models.get(startModelName);
	if (!startModel) {
		return {
			success: false,
			error: `Start model "${startModelName}" not found in schema`,
		};
	}

	// Step 2: Initialize BFS data structures
	// - visited: Set of model names we've already added to the queue
	// - result: The traversed models in BFS order
	// - queue: Models to process, with their depth level
	const visited = new Set<string>();
	const result: TraversedModel[] = [];
	const queue: Array<{ model: Model; depth: number }> = [];

	// Step 3: Start BFS with the initial model
	queue.push({ model: startModel, depth: 0 });
	visited.add(startModelName);

	// Step 4: Process the queue in BFS order
	while (queue.length > 0) {
		// Dequeue the next model to process (guaranteed to exist due to while condition)
		const current = queue.shift();
		if (!current) break;
		const { model, depth } = current;

		// Add this model to the result
		result.push({ model, depth });

		// If we've reached max depth, don't explore further from this model
		if (depth >= maxDepth) {
			continue;
		}

		// Step 5: Explore all relations from this model
		for (const relation of model.relations) {
			const relatedModelName = relation.relatedModel;

			// Skip if we've already visited this model (cycle detection)
			if (visited.has(relatedModelName)) {
				continue;
			}

			// Get the related model from the schema
			const relatedModel = schema.models.get(relatedModelName);
			if (!relatedModel) {
				// This shouldn't happen in a valid schema, but handle gracefully
				continue;
			}

			// Mark as visited and add to queue for processing
			visited.add(relatedModelName);
			queue.push({ model: relatedModel, depth: depth + 1 });
		}
	}

	// Step 6: Return the traversal result
	return {
		success: true,
		models: result,
	};
}
