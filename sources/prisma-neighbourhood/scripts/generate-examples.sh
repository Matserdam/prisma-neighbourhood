#!/bin/bash
# Generate ERD diagrams for all example schemas
# Outputs: SVG only for each schema/model combination

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CLI="$PROJECT_DIR/dist/cli.js"
EXAMPLES_DIR="$PROJECT_DIR/examples"
OUTPUT_DIR="$PROJECT_DIR/examples/output"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "Generating ERD diagrams (SVG only)..."
echo "Output directory: $OUTPUT_DIR"
echo ""

# Blog schema
echo "=== Blog Schema ==="
$CLI -s "$EXAMPLES_DIR/blog.prisma" -m User -d 2 -o "$OUTPUT_DIR/blog-user.svg"
echo "  ✓ User model"

$CLI -s "$EXAMPLES_DIR/blog.prisma" -m Post -d 2 -o "$OUTPUT_DIR/blog-post.svg"
echo "  ✓ Post model"

# E-commerce schema (includes enums)
echo ""
echo "=== E-commerce Schema ==="
$CLI -s "$EXAMPLES_DIR/ecommerce.prisma" -m Order -d 2 -o "$OUTPUT_DIR/ecommerce-order.svg"
echo "  ✓ Order model (includes OrderStatus enum)"

$CLI -s "$EXAMPLES_DIR/ecommerce.prisma" -m Product -d 2 -o "$OUTPUT_DIR/ecommerce-product.svg"
echo "  ✓ Product model"

$CLI -s "$EXAMPLES_DIR/ecommerce.prisma" -m Customer -d 2 -o "$OUTPUT_DIR/ecommerce-customer.svg"
echo "  ✓ Customer model"

# Start from enum - shows all models using the enum
$CLI -s "$EXAMPLES_DIR/ecommerce.prisma" -m OrderStatus -d 2 -o "$OUTPUT_DIR/ecommerce-orderstatus-enum.svg"
echo "  ✓ OrderStatus enum (traverses to Order → related entities)"

$CLI -s "$EXAMPLES_DIR/ecommerce.prisma" -m PaymentStatus -d 2 -o "$OUTPUT_DIR/ecommerce-paymentstatus-enum.svg"
echo "  ✓ PaymentStatus enum (traverses to Payment → Order)"

# SaaS schema
echo ""
echo "=== SaaS Schema ==="
$CLI -s "$EXAMPLES_DIR/saas.prisma" -m User -d 2 -o "$OUTPUT_DIR/saas-user.svg"
echo "  ✓ User model"

$CLI -s "$EXAMPLES_DIR/saas.prisma" -m Organization -d 2 -o "$OUTPUT_DIR/saas-organization.svg"
echo "  ✓ Organization model"

# Analytics schema (views and enums)
echo ""
echo "=== Analytics Schema (Views & Enums) ==="
$CLI -s "$EXAMPLES_DIR/analytics.prisma" -m User -d 2 -o "$OUTPUT_DIR/analytics-user.svg"
echo "  ✓ User model (includes UserRole enum)"

$CLI -s "$EXAMPLES_DIR/analytics.prisma" -m Event -d 2 -o "$OUTPUT_DIR/analytics-event.svg"
echo "  ✓ Event model (includes EventType enum)"

# Start from enums
$CLI -s "$EXAMPLES_DIR/analytics.prisma" -m UserRole -d 2 -o "$OUTPUT_DIR/analytics-userrole-enum.svg"
echo "  ✓ UserRole enum"

$CLI -s "$EXAMPLES_DIR/analytics.prisma" -m EventType -d 2 -o "$OUTPUT_DIR/analytics-eventtype-enum.svg"
echo "  ✓ EventType enum"

$CLI -s "$EXAMPLES_DIR/analytics.prisma" -m ReportStatus -d 2 -o "$OUTPUT_DIR/analytics-reportstatus-enum.svg"
echo "  ✓ ReportStatus enum"

# Start from views
$CLI -s "$EXAMPLES_DIR/analytics.prisma" -m UserEventSummary -d 1 -o "$OUTPUT_DIR/analytics-usereventsummary-view.svg"
echo "  ✓ UserEventSummary view"

$CLI -s "$EXAMPLES_DIR/analytics.prisma" -m EventTypeStats -d 1 -o "$OUTPUT_DIR/analytics-eventtypestats-view.svg"
echo "  ✓ EventTypeStats view"

$CLI -s "$EXAMPLES_DIR/analytics.prisma" -m DailyEventMetrics -d 1 -o "$OUTPUT_DIR/analytics-dailyeventmetrics-view.svg"
echo "  ✓ DailyEventMetrics view"

# View with enum - traverses to enum, then to all models using that enum
$CLI -s "$EXAMPLES_DIR/analytics.prisma" -m ActiveUsersByRole -d 2 -o "$OUTPUT_DIR/analytics-activeusers-view-enum.svg"
echo "  ✓ ActiveUsersByRole view (depth 2: view → UserRole enum → User + AuditLog models)"

echo ""
echo "Done! Generated $(ls -1 "$OUTPUT_DIR"/*.svg 2>/dev/null | wc -l | tr -d ' ') SVG files:"
ls -la "$OUTPUT_DIR"/*.svg
