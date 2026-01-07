/**
 * @fileoverview Renderer registry for managing diagram renderers.
 * Provides a central registry with default renderer support.
 */
import type { DiagramRenderer, RendererRegistration } from "./types";
/**
 * Registry for managing diagram renderers.
 * Supports registration, lookup, and listing of renderers.
 */
export declare class RendererRegistry {
    /** Map of renderer name to renderer instance */
    private readonly renderers;
    /** The name of the default renderer */
    private defaultRendererName;
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
    register(registration: RendererRegistration): void;
    /**
     * Get a renderer by name.
     *
     * @param name - The renderer name to look up
     * @returns The renderer, or undefined if not found
     */
    get(name: string): DiagramRenderer | undefined;
    /**
     * Get the default renderer.
     *
     * @returns The default renderer, or undefined if no default is set
     */
    getDefault(): DiagramRenderer | undefined;
    /**
     * Get the name of the default renderer.
     *
     * @returns The default renderer name
     */
    getDefaultName(): string;
    /**
     * Check if a renderer is registered.
     *
     * @param name - The renderer name to check
     * @returns True if the renderer is registered
     */
    has(name: string): boolean;
    /**
     * Get all registered renderers.
     *
     * @returns An array of all registered renderers
     */
    list(): readonly DiagramRenderer[];
    /**
     * Get all renderer names.
     *
     * @returns An array of all registered renderer names
     */
    listNames(): readonly string[];
    /**
     * Clear all registered renderers.
     * Primarily used for testing.
     */
    clear(): void;
}
/**
 * The global renderer registry instance.
 * Use this instance for registering and looking up renderers.
 */
export declare const rendererRegistry: RendererRegistry;
//# sourceMappingURL=registry.d.ts.map