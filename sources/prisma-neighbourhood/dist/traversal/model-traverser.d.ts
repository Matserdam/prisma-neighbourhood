/**
 * @fileoverview Model traverser for depth-limited BFS traversal.
 * Traverses model relationships from a starting model with configurable depth.
 */
import type { ParsedSchema } from "../parser/types";
import type { TraversalOptions, TraversalResult } from "./types";
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
export declare function traverseModels(schema: ParsedSchema, options: TraversalOptions): TraversalResult;
//# sourceMappingURL=model-traverser.d.ts.map