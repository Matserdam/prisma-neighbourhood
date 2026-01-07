/**
 * @fileoverview Prisma schema parser using @prisma/internals.
 * Parses Prisma schema files and converts them to our internal representation.
 */
import type { ParserOptions, ParseResult } from "./types";
/**
 * Parses a Prisma schema file and returns a structured representation.
 *
 * Uses @prisma/internals getDMMF to parse the schema file and extract
 * model definitions, fields, and relationships.
 *
 * @param options - Parser configuration options
 * @returns A ParseResult containing the parsed schema or an error
 *
 * @example
 * ```typescript
 * const result = await parseSchema({ schemaPath: './prisma/schema.prisma' });
 * if (result.success) {
 *   console.log(result.schema.models);
 * }
 * ```
 */
export declare function parseSchema(options: ParserOptions): Promise<ParseResult>;
//# sourceMappingURL=schema-parser.d.ts.map