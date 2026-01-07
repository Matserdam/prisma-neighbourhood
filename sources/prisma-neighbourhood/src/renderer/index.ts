/**
 * @fileoverview Renderer module exports.
 * Provides diagram rendering functionality and type definitions.
 */

export { MermaidRenderer } from "./mermaid-renderer";
export { RendererRegistry, rendererRegistry } from "./registry";
export type {
	DiagramRenderer,
	ExportFormat,
	ExportResult,
	RendererRegistration,
	RenderResult,
} from "./types";

// Initialize the global registry with the default Mermaid renderer
import { MermaidRenderer } from "./mermaid-renderer";
import { rendererRegistry } from "./registry";

// Register Mermaid as the default renderer (only if not already registered)
if (!rendererRegistry.has("mermaid")) {
	rendererRegistry.register({
		renderer: new MermaidRenderer(),
		isDefault: true,
	});
}
