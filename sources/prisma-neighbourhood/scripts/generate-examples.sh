#!/bin/bash
# Generate ERD diagrams for all example schemas
# Outputs: PDF, PNG, and MMD for each schema/model combination

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CLI="$PROJECT_DIR/dist/cli.js"
EXAMPLES_DIR="$PROJECT_DIR/examples"
OUTPUT_DIR="$PROJECT_DIR/examples/output"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "Generating ERD diagrams..."
echo "Output directory: $OUTPUT_DIR"
echo ""

# Blog schema
echo "=== Blog Schema ==="
$CLI -s "$EXAMPLES_DIR/blog.prisma" -m User -d 2 -o "$OUTPUT_DIR/blog-user.mmd"
$CLI -s "$EXAMPLES_DIR/blog.prisma" -m User -d 2 -o "$OUTPUT_DIR/blog-user.png"
$CLI -s "$EXAMPLES_DIR/blog.prisma" -m User -d 2 -o "$OUTPUT_DIR/blog-user.pdf"
$CLI -s "$EXAMPLES_DIR/blog.prisma" -m User -d 2 -o "$OUTPUT_DIR/blog-user.svg"
echo "  ✓ User model"

$CLI -s "$EXAMPLES_DIR/blog.prisma" -m Post -d 2 -o "$OUTPUT_DIR/blog-post.mmd"
$CLI -s "$EXAMPLES_DIR/blog.prisma" -m Post -d 2 -o "$OUTPUT_DIR/blog-post.png"
$CLI -s "$EXAMPLES_DIR/blog.prisma" -m Post -d 2 -o "$OUTPUT_DIR/blog-post.pdf"
$CLI -s "$EXAMPLES_DIR/blog.prisma" -m Post -d 2 -o "$OUTPUT_DIR/blog-post.svg"
echo "  ✓ Post model"

# E-commerce schema
echo ""
echo "=== E-commerce Schema ==="
$CLI -s "$EXAMPLES_DIR/ecommerce.prisma" -m Order -d 2 -o "$OUTPUT_DIR/ecommerce-order.mmd"
$CLI -s "$EXAMPLES_DIR/ecommerce.prisma" -m Order -d 2 -o "$OUTPUT_DIR/ecommerce-order.png"
$CLI -s "$EXAMPLES_DIR/ecommerce.prisma" -m Order -d 2 -o "$OUTPUT_DIR/ecommerce-order.pdf"
$CLI -s "$EXAMPLES_DIR/ecommerce.prisma" -m Order -d 2 -o "$OUTPUT_DIR/ecommerce-order.svg"
echo "  ✓ Order model"

$CLI -s "$EXAMPLES_DIR/ecommerce.prisma" -m Product -d 2 -o "$OUTPUT_DIR/ecommerce-product.mmd"
$CLI -s "$EXAMPLES_DIR/ecommerce.prisma" -m Product -d 2 -o "$OUTPUT_DIR/ecommerce-product.png"
$CLI -s "$EXAMPLES_DIR/ecommerce.prisma" -m Product -d 2 -o "$OUTPUT_DIR/ecommerce-product.pdf"
$CLI -s "$EXAMPLES_DIR/ecommerce.prisma" -m Product -d 2 -o "$OUTPUT_DIR/ecommerce-product.svg"
echo "  ✓ Product model"

$CLI -s "$EXAMPLES_DIR/ecommerce.prisma" -m Customer -d 2 -o "$OUTPUT_DIR/ecommerce-customer.mmd"
$CLI -s "$EXAMPLES_DIR/ecommerce.prisma" -m Customer -d 2 -o "$OUTPUT_DIR/ecommerce-customer.png"
$CLI -s "$EXAMPLES_DIR/ecommerce.prisma" -m Customer -d 2 -o "$OUTPUT_DIR/ecommerce-customer.pdf"
$CLI -s "$EXAMPLES_DIR/ecommerce.prisma" -m Customer -d 2 -o "$OUTPUT_DIR/ecommerce-customer.svg"
echo "  ✓ Customer model"

# SaaS schema
echo ""
echo "=== SaaS Schema ==="
$CLI -s "$EXAMPLES_DIR/saas.prisma" -m User -d 2 -o "$OUTPUT_DIR/saas-user.mmd"
$CLI -s "$EXAMPLES_DIR/saas.prisma" -m User -d 2 -o "$OUTPUT_DIR/saas-user.png"
$CLI -s "$EXAMPLES_DIR/saas.prisma" -m User -d 2 -o "$OUTPUT_DIR/saas-user.pdf"
$CLI -s "$EXAMPLES_DIR/saas.prisma" -m User -d 2 -o "$OUTPUT_DIR/saas-user.svg"
echo "  ✓ User model"

$CLI -s "$EXAMPLES_DIR/saas.prisma" -m Organization -d 2 -o "$OUTPUT_DIR/saas-organization.mmd"
$CLI -s "$EXAMPLES_DIR/saas.prisma" -m Organization -d 2 -o "$OUTPUT_DIR/saas-organization.png"
$CLI -s "$EXAMPLES_DIR/saas.prisma" -m Organization -d 2 -o "$OUTPUT_DIR/saas-organization.pdf"
$CLI -s "$EXAMPLES_DIR/saas.prisma" -m Organization -d 2 -o "$OUTPUT_DIR/saas-organization.svg"
echo "  ✓ Organization model"

echo ""
echo "Done! Generated files:"
ls -la "$OUTPUT_DIR"

