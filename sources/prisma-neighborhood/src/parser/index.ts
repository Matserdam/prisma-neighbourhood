/**
 * @fileoverview Parser module exports.
 * Provides schema parsing functionality and type definitions.
 */

export { parseSchema } from "./schema-parser";
export type {
	Enum,
	Field,
	Model,
	ParsedSchema,
	ParseResult,
	ParserOptions,
	Relation,
	RelationType,
	ScalarType,
	View,
} from "./types";
