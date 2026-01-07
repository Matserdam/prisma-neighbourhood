#!/usr/bin/env node
/**
 * @fileoverview Entry point for the prisma-neighborhood CLI.
 * Generates Entity-Relationship Diagrams from Prisma schemas.
 */

import { runCli } from "./cli/index";

// Run the CLI with process arguments
runCli(process.argv);
