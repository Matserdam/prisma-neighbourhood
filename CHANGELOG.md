#CHANGELOG

DATE FORMAT: DD/MM/YYYY

## 0.3.0 10/01/2026
- Add support for views in ERD (displayed with `[view]` prefix)
- Add support for enums in ERD (displayed with `[enum]` prefix)
- Start traversing from any entity type: model, view, or enum
- Enum traversal finds all models/views using the enum
- View traversal follows relations and enum fields
- Unified traverser replaces model-only traversal

## v0.1.0 07/01/2026
- Added `.svg` export.
- Improved `.png` export quality for large schemas by using an SVG-first pipeline.