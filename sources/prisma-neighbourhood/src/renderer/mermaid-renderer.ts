import type { TraversedModel } from "../traversal/types";
import { renderMermaidErd } from "./mermaid-erd";
import type { DiagramRenderer } from "./types";

/**
 * Mermaid ERD renderer implementation.
 * Generates Mermaid Entity-Relationship Diagram syntax from traversed models.
 *
 * @example
 * ```typescript
 * const renderer = new MermaidRenderer();
 * const output = renderer.render(traversedModels);
 * console.log(output);
 * // erDiagram
 * //   User {
 * //     Int id PK
 * //     String email UK
 * //     ...
 * //   }
 * ```
 */
export class MermaidRenderer implements DiagramRenderer {
	/** Unique renderer identifier */
	readonly name = "mermaid";

	/** Human-readable description */
	readonly description =
		"Mermaid ERD syntax (text). For SVG/PNG/PDF export, use the 'vector' renderer.";

	/**
	 * Generate Mermaid ERD syntax from traversed models.
	 *
	 * The output includes:
	 * - Entity definitions with fields and types
	 * - Primary key (PK) and unique (UK) markers
	 * - Relationship lines between entities
	 *
	 * @param models - The traversed models to render
	 * @returns The Mermaid ERD syntax as a string
	 */
	render(models: readonly TraversedModel[]): string {
		return renderMermaidErd(models);
	}

	/**
	 * Whether this renderer supports export functionality.
	 * @returns True - MermaidRenderer supports PNG/PDF export
	 */
	supportsExport(): boolean {
		return false;
	}
}
