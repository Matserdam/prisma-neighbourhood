/**
 * @fileoverview Type definitions for model traversal.
 * These types support BFS traversal of model relationships with depth limiting.
 */

import type { Model } from "../parser/types";

/**
 * Represents a model that has been visited during traversal,
 * including its depth level from the starting model.
 */
export interface TraversedModel {
  /** The traversed model */
  readonly model: Model;

  /** The depth level from the starting model (0 = starting model) */
  readonly depth: number;
}

/**
 * Configuration options for model traversal.
 */
export interface TraversalOptions {
  /** The name of the model to start traversal from */
  readonly startModel: string;

  /** Maximum depth to traverse (default: 3) */
  readonly maxDepth?: number;
}

/**
 * Result of a traversal operation.
 */
export type TraversalResult =
  | { readonly success: true; readonly models: readonly TraversedModel[] }
  | { readonly success: false; readonly error: string };

