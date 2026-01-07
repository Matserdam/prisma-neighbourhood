/**
 * @fileoverview Renderer registry for managing diagram renderers.
 * Provides a central registry with default renderer support.
 */

import type { DiagramRenderer, RendererRegistration } from "./types";

/** The default renderer name */
const DEFAULT_RENDERER_NAME = "vector";

/**
 * Registry for managing diagram renderers.
 * Supports registration, lookup, and listing of renderers.
 */
export class RendererRegistry {
	/** Map of renderer name to renderer instance */
	private readonly renderers = new Map<string, DiagramRenderer>();

	/** The name of the default renderer */
	private defaultRendererName: string = DEFAULT_RENDERER_NAME;

	/**
	 * Register a renderer with the registry.
	 *
	 * @param registration - The renderer registration configuration
	 * @throws Error if a renderer with the same name is already registered
	 *
	 * @example
	 * ```typescript
	 * registry.register({
	 *   renderer: new MermaidRenderer(),
	 *   isDefault: true
	 * });
	 * ```
	 */
	register(registration: RendererRegistration): void {
		const { renderer, isDefault } = registration;

		// Check for duplicate registration
		if (this.renderers.has(renderer.name)) {
			throw new Error(`Renderer "${renderer.name}" is already registered`);
		}

		// Add the renderer to the registry
		this.renderers.set(renderer.name, renderer);

		// Set as default if specified
		if (isDefault) {
			this.defaultRendererName = renderer.name;
		}
	}

	/**
	 * Get a renderer by name.
	 *
	 * @param name - The renderer name to look up
	 * @returns The renderer, or undefined if not found
	 */
	get(name: string): DiagramRenderer | undefined {
		return this.renderers.get(name);
	}

	/**
	 * Get the default renderer.
	 *
	 * @returns The default renderer, or undefined if no default is set
	 */
	getDefault(): DiagramRenderer | undefined {
		return this.renderers.get(this.defaultRendererName);
	}

	/**
	 * Get the name of the default renderer.
	 *
	 * @returns The default renderer name
	 */
	getDefaultName(): string {
		return this.defaultRendererName;
	}

	/**
	 * Check if a renderer is registered.
	 *
	 * @param name - The renderer name to check
	 * @returns True if the renderer is registered
	 */
	has(name: string): boolean {
		return this.renderers.has(name);
	}

	/**
	 * Get all registered renderers.
	 *
	 * @returns An array of all registered renderers
	 */
	list(): readonly DiagramRenderer[] {
		return Array.from(this.renderers.values());
	}

	/**
	 * Get all renderer names.
	 *
	 * @returns An array of all registered renderer names
	 */
	listNames(): readonly string[] {
		return Array.from(this.renderers.keys());
	}

	/**
	 * Clear all registered renderers.
	 * Primarily used for testing.
	 */
	clear(): void {
		this.renderers.clear();
		this.defaultRendererName = DEFAULT_RENDERER_NAME;
	}
}

/**
 * The global renderer registry instance.
 * Use this instance for registering and looking up renderers.
 */
export const rendererRegistry = new RendererRegistry();
