/**
 * @fileoverview Parser module exports.
 * Provides schema parsing functionality and type definitions.
 */

export type {
  Field,
  Model,
  ParsedSchema,
  ParserOptions,
  ParseResult,
  Relation,
  RelationType,
  ScalarType,
} from "./types";

export { parseSchema } from "./schema-parser";

