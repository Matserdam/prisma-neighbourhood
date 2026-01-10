/**
 * @fileoverview Type definitions for entity traversal.
 * These types support BFS traversal of models, views, and enums with depth limiting.
 */

import type { Enum, Model, View } from "../parser/types";

/**
 * The kind of entity being traversed.
 */
export type EntityKind = "model" | "view" | "enum";

/**
 * Union type for all traversable entities.
 */
export type Entity = Model | View | Enum;

/**
 * Represents an entity that has been visited during traversal,
 * including its kind and depth level from the starting entity.
 */
export interface TraversedEntity {
	/** The traversed entity (model, view, or enum) */
	readonly entity: Entity;

	/** The kind of entity */
	readonly kind: EntityKind;

	/** The depth level from the starting entity (0 = starting entity) */
	readonly depth: number;
}

/**
 * Configuration options for entity traversal.
 */
export interface TraversalOptions {
	/** The name of the entity to start traversal from (model, view, or enum) */
	readonly startEntity: string;

	/** Maximum depth to traverse (default: 3) */
	readonly maxDepth?: number;
}

/**
 * Result of a traversal operation.
 */
export type TraversalResult =
	| { readonly success: true; readonly entities: readonly TraversedEntity[] }
	| { readonly success: false; readonly error: string };
