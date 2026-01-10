# Example Schemas

This folder contains example Prisma schemas to demonstrate the ERD generator.

## Schemas

| File | Description | Good starting models |
|------|-------------|---------------------|
| `blog.prisma` | Blog application with users, posts, comments | `User`, `Post` |
| `ecommerce.prisma` | E-commerce with products, orders, customers | `Order`, `Product`, `Customer` |
| `saas.prisma` | Multi-tenant SaaS with organizations, projects | `Organization`, `User`, `Project` |

## Example Commands

Run these from the `prisma-subgraph-cli` directory:

### Output to stdout

```bash
# Blog: User and related models (depth 2)
bun src/index.ts -s examples/blog.prisma -m User -d 2

# E-commerce: Order flow
bun src/index.ts -s examples/ecommerce.prisma -m Order -d 3

# SaaS: Organization structure
bun src/index.ts -s examples/saas.prisma -m Organization -d 2
```

### Output to Mermaid file

```bash
# Blog schema
bun src/index.ts -s examples/blog.prisma -m Post -o examples/blog-erd.mmd

# E-commerce schema
bun src/index.ts -s examples/ecommerce.prisma -m Product -o examples/ecommerce-erd.mmd
```

### Export to PNG

```bash
# Blog ERD as PNG
bun src/index.ts -s examples/blog.prisma -m User -d 3 -o examples/blog-erd.png

# E-commerce ERD as PNG
bun src/index.ts -s examples/ecommerce.prisma -m Order -o examples/ecommerce-erd.png

# SaaS ERD as PNG
bun src/index.ts -s examples/saas.prisma -m Project -d 2 -o examples/saas-erd.png
```

### Export to PDF

```bash
# Full blog ERD
bun src/index.ts -s examples/blog.prisma -m User -d 5 -o examples/blog-erd.pdf
```

## Tips

- Use `-d 1` to see only immediate relationships
- Use `-d 2` for a focused view of a model and its neighbors
- Use `-d 3` or higher for a broader view
- Start from different models to get different perspectives of the same schema

