/**
 * @fileoverview Type definitions for parsed Prisma schema models, views, and enums.
 * These types provide a clean internal representation independent of Prisma internals.
 */

/**
 * Represents the cardinality of a relationship between models.
 * - ONE_TO_ONE: Single record on both sides
 * - ONE_TO_MANY: Single record on one side, multiple on the other
 * - MANY_TO_MANY: Multiple records on both sides
 */
export type RelationType = "ONE_TO_ONE" | "ONE_TO_MANY" | "MANY_TO_MANY";

/**
 * Represents a relationship between two models in the schema.
 */
export interface Relation {
	/** The name of the related model */
	readonly relatedModel: string;

	/** The type of relationship (cardinality) */
	readonly type: RelationType;

	/** The field name on this model that defines the relation */
	readonly fieldName: string;

	/** Whether this is the owning side of the relation (has the foreign key) */
	readonly isOwner: boolean;
}

/**
 * Scalar field types supported in Prisma schemas.
 */
export type ScalarType =
	| "String"
	| "Int"
	| "BigInt"
	| "Float"
	| "Decimal"
	| "Boolean"
	| "DateTime"
	| "Json"
	| "Bytes";

/**
 * Represents a field in a Prisma model.
 */
export interface Field {
	/** The field name */
	readonly name: string;

	/** The field type (scalar type or model name for relations) */
	readonly type: string;

	/** Whether the field is required (not nullable) */
	readonly isRequired: boolean;

	/** Whether the field is a list (array) */
	readonly isList: boolean;

	/** Whether this field is the primary key */
	readonly isPrimaryKey: boolean;

	/** Whether this field is unique */
	readonly isUnique: boolean;

	/** Whether this field is a relation to another model */
	readonly isRelation: boolean;

	/** Whether this field is a foreign key (references another model's PK) */
	readonly isForeignKey: boolean;
}

/**
 * Represents a parsed Prisma model with its fields and relations.
 */
export interface Model {
	/** The model name */
	readonly name: string;

	/** All fields in the model */
	readonly fields: readonly Field[];

	/** Relations to other models */
	readonly relations: readonly Relation[];
}

/**
 * Represents a parsed Prisma view with its fields and relations.
 * Views are structurally similar to models but represent database views.
 * Requires the `views` preview feature to be enabled in the Prisma schema.
 */
export interface View {
	/** The view name */
	readonly name: string;

	/** All fields in the view */
	readonly fields: readonly Field[];

	/** Relations to other models/views */
	readonly relations: readonly Relation[];
}

/**
 * Represents a Prisma enum with its possible values.
 */
export interface Enum {
	/** The enum name */
	readonly name: string;

	/** The possible values of the enum */
	readonly values: readonly string[];
}

/**
 * Represents the complete parsed schema containing models, views, and enums.
 */
export interface ParsedSchema {
	/** All models in the schema, keyed by model name */
	readonly models: ReadonlyMap<string, Model>;

	/** All views in the schema, keyed by view name */
	readonly views: ReadonlyMap<string, View>;

	/** All enums in the schema, keyed by enum name */
	readonly enums: ReadonlyMap<string, Enum>;
}

/**
 * Configuration options for the schema parser.
 */
export interface ParserOptions {
	/** Path to the Prisma schema file */
	readonly schemaPath: string;
}

/**
 * Result of a parsing operation.
 */
export type ParseResult =
	| { readonly success: true; readonly schema: ParsedSchema }
	| { readonly success: false; readonly error: string };
