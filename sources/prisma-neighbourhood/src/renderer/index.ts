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
export { VectorRenderer } from "./vector-renderer";

// Initialize the global registry with the default renderer(s)
import { MermaidRenderer } from "./mermaid-renderer";
import { rendererRegistry } from "./registry";
import { VectorRenderer } from "./vector-renderer";

// Register Vector as the default renderer (only if not already registered)
if (!rendererRegistry.has("vector")) {
	rendererRegistry.register({
		renderer: new VectorRenderer(),
		isDefault: true,
	});
}

// Register Mermaid as an available (text-only) renderer
if (!rendererRegistry.has("mermaid")) {
	rendererRegistry.register({
		renderer: new MermaidRenderer(),
		isDefault: false,
	});
}
