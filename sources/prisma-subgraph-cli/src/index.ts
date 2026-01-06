#!/usr/bin/env node
/**
 * @fileoverview Entry point for the prisma-erd CLI.
 * Generates Entity-Relationship Diagrams from Prisma schemas.
 */

import { runCli } from "./cli";

// Run the CLI with process arguments
runCli(process.argv);

