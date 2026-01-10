import type { TraversedEntity } from "../traversal/types";
import { renderMermaidErd } from "./mermaid-erd";
import type { DiagramRenderer, ExportFormat } from "./types";
import { runMermaidCli } from "./utils/mermaid-cli";

/**
 * Mermaid ERD renderer implementation.
 * Generates Mermaid Entity-Relationship Diagram syntax from traversed entities.
 *
 * @example
 * ```typescript
 * const renderer = new MermaidRenderer();
 * const output = renderer.render(traversedEntities);
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
		"Mermaid ERD syntax (text). Supports export via mermaid-cli.";

	/**
	 * Generate Mermaid ERD syntax from traversed entities.
	 *
	 * The output includes:
	 * - Entity definitions with fields and types
	 * - Primary key (PK) and unique (UK) markers
	 * - Relationship lines between entities
	 * - Enum definitions with their values
	 *
	 * @param entities - The traversed entities to render
	 * @returns The Mermaid ERD syntax as a string
	 */
	render(entities: readonly TraversedEntity[]): string {
		return renderMermaidErd(entities);
	}

	/**
	 * Export the diagram to a file format (SVG/PNG/PDF).
	 * Uses @mermaid-js/mermaid-cli for rendering.
	 */
	async export(
		content: string,
		outputPath: string,
		format: ExportFormat,
	): Promise<void> {
		await runMermaidCli(content, { outputFormat: format, outputPath });
	}

	/**
	 * Whether this renderer supports export functionality.
	 * @returns True - MermaidRenderer supports PNG/PDF export
	 */
	supportsExport(): boolean {
		return true;
	}
}
