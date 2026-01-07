/**
 * @fileoverview Mermaid ERD renderer implementation.
 * Converts traversed models to Mermaid Entity-Relationship Diagram syntax.
 */
import type { TraversedModel } from "../traversal/types";
import type { DiagramRenderer, ExportFormat } from "./types";
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
export declare class MermaidRenderer implements DiagramRenderer {
    /** Unique renderer identifier */
    readonly name = "mermaid";
    /** Human-readable description */
    readonly description = "Mermaid ERD syntax - supports PNG/PDF export via mermaid-cli";
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
    render(models: readonly TraversedModel[]): string;
    /**
     * Export the diagram to PNG or PDF format.
     * Uses mermaid-cli (@mermaid-js/mermaid-cli) for rendering.
     *
     * @param content - The Mermaid diagram content
     * @param outputPath - Path to write the output file
     * @param format - The export format (png or pdf)
     * @throws Error if mermaid-cli is not available or export fails
     */
    export(content: string, outputPath: string, format: ExportFormat): Promise<void>;
    /**
     * Whether this renderer supports export functionality.
     * @returns True - MermaidRenderer supports PNG/PDF export
     */
    supportsExport(): boolean;
    /**
     * Run mermaid-cli to convert the diagram to an image.
     *
     * @param inputPath - Path to the input .mmd file
     * @param outputPath - Path to write the output file
     * @param format - The export format
     */
    private runMermaidCli;
}
//# sourceMappingURL=mermaid-renderer.d.ts.map