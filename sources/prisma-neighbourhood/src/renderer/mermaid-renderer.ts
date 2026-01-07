/**
 * @fileoverview Mermaid ERD renderer implementation.
 * Converts traversed models to Mermaid Entity-Relationship Diagram syntax.
 */

import { spawn } from "node:child_process";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TraversedModel } from "../traversal/types";
import type { DiagramRenderer, ExportFormat } from "./types";

/**
 * Maps our RelationType to Mermaid ERD relationship notation.
 *
 * Mermaid ERD relationship notation:
 * - ||--|| : one-to-one
 * - ||--o{ : one-to-many (one to zero or more)
 * - }o--o{ : many-to-many
 */
const RELATION_SYMBOLS = {
	ONE_TO_ONE: "||--||",
	ONE_TO_MANY: "||--o{",
	MANY_TO_MANY: "}o--o{",
} as const;

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
		"Mermaid ERD syntax - supports PNG/PDF export via mermaid-cli";

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
		const lines: string[] = ["erDiagram"];

		// Track rendered relationships to avoid duplicates
		const renderedRelations = new Set<string>();

		// Step 1: Render each model as an entity with fields
		for (const { model } of models) {
			lines.push(`  ${model.name} {`);

			// Render non-relation fields
			for (const field of model.fields) {
				// Skip relation fields (they're represented as relationship lines)
				if (field.isRelation) {
					continue;
				}

				// Build field line: type name [modifiers]
				const modifiers: string[] = [];
				if (field.isPrimaryKey) {
					modifiers.push("PK");
				}
				if (field.isUnique && !field.isPrimaryKey) {
					modifiers.push("UK");
				}

				const modifierStr =
					modifiers.length > 0 ? ` ${modifiers.join(",")}` : "";
				lines.push(`    ${field.type} ${field.name}${modifierStr}`);
			}

			lines.push("  }");
		}

		// Step 2: Render relationships between models
		const modelNames = new Set(models.map((m) => m.model.name));

		for (const { model } of models) {
			for (const relation of model.relations) {
				// Only render if both models are in our traversed set
				if (!modelNames.has(relation.relatedModel)) {
					continue;
				}

				// Create a canonical key to avoid duplicate relations
				// Sort model names alphabetically to ensure A->B and B->A produce the same key
				const sortedNames = [model.name, relation.relatedModel].sort();
				const relationKey = `${sortedNames[0]}-${sortedNames[1]}`;

				// Skip if we've already rendered this relationship
				if (renderedRelations.has(relationKey)) {
					continue;
				}

				// Get the Mermaid relationship symbol
				const symbol = RELATION_SYMBOLS[relation.type];

				// Determine relationship label based on field name
				const label = relation.fieldName;

				// Render the relationship line
				// Format: EntityA ||--o{ EntityB : "label"
				lines.push(
					`  ${model.name} ${symbol} ${relation.relatedModel} : "${label}"`,
				);

				// Mark this relationship as rendered
				renderedRelations.add(relationKey);
			}
		}

		return lines.join("\n");
	}

	/**
	 * Export the diagram to PNG or PDF format.
	 * Uses mermaid-cli (@mermaid-js/mermaid-cli) for rendering.
	 *
	 * @param content - The Mermaid diagram content
	 * @param outputPath - Path to write the output file
	 * @param format - The export format (png or pdf)
	 * @throws Error if mermaid-cli is not available or export fails
	 */
	async export(
		content: string,
		outputPath: string,
		format: ExportFormat,
	): Promise<void> {
		// Step 1: Write content to a temporary file
		const tempInputPath = join(tmpdir(), `prisma-erd-${Date.now()}.mmd`);

		try {
			await writeFile(tempInputPath, content, "utf-8");

			// Step 2: Run mermaid-cli to render the diagram
			await this.runMermaidCli(tempInputPath, outputPath, format);
		} finally {
			// Step 3: Clean up the temporary file
			try {
				await unlink(tempInputPath);
			} catch {
				// Ignore cleanup errors
			}
		}
	}

	/**
	 * Whether this renderer supports export functionality.
	 * @returns True - MermaidRenderer supports PNG/PDF export
	 */
	supportsExport(): boolean {
		return true;
	}

	/**
	 * Run mermaid-cli to convert the diagram to an image.
	 *
	 * @param inputPath - Path to the input .mmd file
	 * @param outputPath - Path to write the output file
	 * @param format - The export format
	 */
	private runMermaidCli(
		inputPath: string,
		outputPath: string,
		format: ExportFormat,
	): Promise<void> {
		return new Promise((resolve, reject) => {
			// Use npx to run mermaid-cli
			const args = [
				"-y",
				"mmdc",
				"-i",
				inputPath,
				"-o",
				outputPath,
				"-e",
				format,
			];
			const process = spawn("npx", args, {
				stdio: ["ignore", "pipe", "pipe"],
			});

			let stderr = "";

			process.stderr?.on("data", (data: Buffer) => {
				stderr += data.toString();
			});

			process.on("close", (code) => {
				if (code === 0) {
					resolve();
				} else {
					reject(
						new Error(
							`mermaid-cli exited with code ${code}: ${stderr || "Unknown error"}`,
						),
					);
				}
			});

			process.on("error", (err) => {
				reject(new Error(`Failed to run mermaid-cli: ${err.message}`));
			});
		});
	}
}
