/**
 * @fileoverview Type definitions for the pluggable renderer system.
 * Defines the DiagramRenderer interface and registry types for extensibility.
 */

import type { TraversedModel } from "../traversal/types";

/**
 * Supported export formats for diagram rendering.
 */
export type ExportFormat = "png" | "pdf";

/**
 * Interface for diagram renderers.
 * Implementations convert traversed models to diagram syntax and optionally
 * support exporting to image formats.
 *
 * @example
 * ```typescript
 * class MermaidRenderer implements DiagramRenderer {
 *   readonly name = "mermaid";
 *
 *   render(models: TraversedModel[]): string {
 *     // Generate Mermaid ERD syntax
 *     return "erDiagram\\n...";
 *   }
 *
 *   async export(content: string, outputPath: string, format: ExportFormat): Promise<void> {
 *     // Use mermaid-cli to render to PNG/PDF
 *   }
 * }
 * ```
 */
export interface DiagramRenderer {
  /**
   * Unique renderer identifier (e.g., "mermaid", "plantuml").
   * Used for CLI flag matching and registry lookup.
   */
  readonly name: string;

  /**
   * Human-readable description of the renderer.
   * Displayed in --list-renderers output.
   */
  readonly description: string;

  /**
   * Generate diagram text from traversed models.
   *
   * @param models - The traversed models to render
   * @returns The diagram syntax as a string
   */
  render(models: readonly TraversedModel[]): string;

  /**
   * Export the diagram to a file format (PNG/PDF) if supported.
   * This method is optional - not all renderers support export.
   *
   * @param content - The rendered diagram content
   * @param outputPath - Path to write the output file
   * @param format - The export format (png or pdf)
   * @throws Error if export is not supported or fails
   */
  export?(content: string, outputPath: string, format: ExportFormat): Promise<void>;

  /**
   * Whether this renderer supports export functionality.
   * @returns True if export() is implemented and functional
   */
  supportsExport(): boolean;
}

/**
 * Configuration for renderer registration.
 */
export interface RendererRegistration {
  /** The renderer instance */
  readonly renderer: DiagramRenderer;

  /** Whether this is the default renderer */
  readonly isDefault?: boolean;
}

/**
 * Result of a render operation.
 */
export type RenderResult =
  | { readonly success: true; readonly output: string }
  | { readonly success: false; readonly error: string };

/**
 * Result of an export operation.
 */
export type ExportResult =
  | { readonly success: true; readonly outputPath: string }
  | { readonly success: false; readonly error: string };

