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

# Tiny schema (minimal example) - depths 1, 2, 3 in SVG and PNG
echo "=== Tiny Schema (Minimal) - Depths 1, 2, 3 ==="
for depth in 1 2 3; do
  $CLI -s "$EXAMPLES_DIR/tiny.prisma" -m User -d $depth -o "$OUTPUT_DIR/tiny-user-d${depth}.svg"
  $CLI -s "$EXAMPLES_DIR/tiny.prisma" -m User -d $depth -o "$OUTPUT_DIR/tiny-user-d${depth}.png"
  echo "  ✓ User model (depth $depth) - SVG + PNG"

  $CLI -s "$EXAMPLES_DIR/tiny.prisma" -m Post -d $depth -o "$OUTPUT_DIR/tiny-post-d${depth}.svg"
  $CLI -s "$EXAMPLES_DIR/tiny.prisma" -m Post -d $depth -o "$OUTPUT_DIR/tiny-post-d${depth}.png"
  echo "  ✓ Post model (depth $depth) - SVG + PNG"
done

# Large schema (complex project management) - depths 1, 2, 3 in SVG and PNG
echo ""
echo "=== Large Schema (Project Management) - Depths 1, 2, 3 ==="

# Core models
for depth in 1 2 3; do
  echo "  --- Depth $depth ---"
  
  $CLI -s "$EXAMPLES_DIR/large.schema" -m User -d $depth -o "$OUTPUT_DIR/large-user-d${depth}.svg"
  $CLI -s "$EXAMPLES_DIR/large.schema" -m User -d $depth -o "$OUTPUT_DIR/large-user-d${depth}.png"
  echo "  ✓ User model (depth $depth) - SVG + PNG"

  $CLI -s "$EXAMPLES_DIR/large.schema" -m Organization -d $depth -o "$OUTPUT_DIR/large-organization-d${depth}.svg"
  $CLI -s "$EXAMPLES_DIR/large.schema" -m Organization -d $depth -o "$OUTPUT_DIR/large-organization-d${depth}.png"
  echo "  ✓ Organization model (depth $depth) - SVG + PNG"

  $CLI -s "$EXAMPLES_DIR/large.schema" -m Project -d $depth -o "$OUTPUT_DIR/large-project-d${depth}.svg"
  $CLI -s "$EXAMPLES_DIR/large.schema" -m Project -d $depth -o "$OUTPUT_DIR/large-project-d${depth}.png"
  echo "  ✓ Project model (depth $depth) - SVG + PNG"

  $CLI -s "$EXAMPLES_DIR/large.schema" -m Task -d $depth -o "$OUTPUT_DIR/large-task-d${depth}.svg"
  $CLI -s "$EXAMPLES_DIR/large.schema" -m Task -d $depth -o "$OUTPUT_DIR/large-task-d${depth}.png"
  echo "  ✓ Task model (depth $depth) - SVG + PNG"

  $CLI -s "$EXAMPLES_DIR/large.schema" -m Invoice -d $depth -o "$OUTPUT_DIR/large-invoice-d${depth}.svg"
  $CLI -s "$EXAMPLES_DIR/large.schema" -m Invoice -d $depth -o "$OUTPUT_DIR/large-invoice-d${depth}.png"
  echo "  ✓ Invoice model (depth $depth) - SVG + PNG"

  $CLI -s "$EXAMPLES_DIR/large.schema" -m Payment -d $depth -o "$OUTPUT_DIR/large-payment-d${depth}.svg"
  $CLI -s "$EXAMPLES_DIR/large.schema" -m Payment -d $depth -o "$OUTPUT_DIR/large-payment-d${depth}.png"
  echo "  ✓ Payment model (depth $depth) - SVG + PNG"

  # Enums
  $CLI -s "$EXAMPLES_DIR/large.schema" -m Role -d $depth -o "$OUTPUT_DIR/large-role-enum-d${depth}.svg"
  $CLI -s "$EXAMPLES_DIR/large.schema" -m Role -d $depth -o "$OUTPUT_DIR/large-role-enum-d${depth}.png"
  echo "  ✓ Role enum (depth $depth) - SVG + PNG"

  $CLI -s "$EXAMPLES_DIR/large.schema" -m TaskStatus -d $depth -o "$OUTPUT_DIR/large-taskstatus-enum-d${depth}.svg"
  $CLI -s "$EXAMPLES_DIR/large.schema" -m TaskStatus -d $depth -o "$OUTPUT_DIR/large-taskstatus-enum-d${depth}.png"
  echo "  ✓ TaskStatus enum (depth $depth) - SVG + PNG"

  $CLI -s "$EXAMPLES_DIR/large.schema" -m BillingStatus -d $depth -o "$OUTPUT_DIR/large-billingstatus-enum-d${depth}.svg"
  $CLI -s "$EXAMPLES_DIR/large.schema" -m BillingStatus -d $depth -o "$OUTPUT_DIR/large-billingstatus-enum-d${depth}.png"
  echo "  ✓ BillingStatus enum (depth $depth) - SVG + PNG"

  $CLI -s "$EXAMPLES_DIR/large.schema" -m PaymentStatus -d $depth -o "$OUTPUT_DIR/large-paymentstatus-enum-d${depth}.svg"
  $CLI -s "$EXAMPLES_DIR/large.schema" -m PaymentStatus -d $depth -o "$OUTPUT_DIR/large-paymentstatus-enum-d${depth}.png"
  echo "  ✓ PaymentStatus enum (depth $depth) - SVG + PNG"

  # Views
  $CLI -s "$EXAMPLES_DIR/large.schema" -m ProjectTaskCounts -d $depth -o "$OUTPUT_DIR/large-projecttaskcounts-view-d${depth}.svg"
  $CLI -s "$EXAMPLES_DIR/large.schema" -m ProjectTaskCounts -d $depth -o "$OUTPUT_DIR/large-projecttaskcounts-view-d${depth}.png"
  echo "  ✓ ProjectTaskCounts view (depth $depth) - SVG + PNG"

  $CLI -s "$EXAMPLES_DIR/large.schema" -m UserWorkload -d $depth -o "$OUTPUT_DIR/large-userworkload-view-d${depth}.svg"
  $CLI -s "$EXAMPLES_DIR/large.schema" -m UserWorkload -d $depth -o "$OUTPUT_DIR/large-userworkload-view-d${depth}.png"
  echo "  ✓ UserWorkload view (depth $depth) - SVG + PNG"
done

# Blog schema
echo ""
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
echo "Done! Generated:"
echo "  - $(ls -1 "$OUTPUT_DIR"/*.svg 2>/dev/null | wc -l | tr -d ' ') SVG files"
echo "  - $(ls -1 "$OUTPUT_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ') PNG files"
echo ""
ls -la "$OUTPUT_DIR"
