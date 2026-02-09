# Media System (Product / Variant / Global)

## Goals
- Product media and variant media must be **separate** concepts, but implemented in a single unified system.
- Ikas-like UX:
  - 200x200 thumbnails
  - Drag & drop reorder
  - Upload via file picker and drag/drop
  - Hover actions: preview + delete
  - Delete requires confirmation
- Central Admin screen: **Media Library**
  - Grid/List toggle
  - Search + filters
  - Used/Orphan view
  - Bulk delete
  - “Where used” links to product/variant (phase-1)

## Decision: A Scenario (No upload before save)
- Product / Variant media can be uploaded only when the target record exists in DB.
- If product is not saved yet:
  - Only `scope=global` upload is allowed.

## Data Model
Single table: `media`

### Columns
- `id`
- `disk` (optional; e.g. public, s3)
- `type` enum: `image | video | file`
- `path` (original)
- `thumb_path` (optional)
- `mime`
- `size` (bytes)
- `width`, `height` (optional)
- `sha1` (optional; can be used later for duplicate detection)
- `alt` nullable
- `scope` enum:
  - `product` (product gallery)
  - `variant` (variant gallery)
  - `global` (library/general assets)
- `product_id` nullable
- `product_variant_id` nullable
- `position` int default 0
- `created_by` (user_id)
- timestamps

### Rules
- Product media:
  - `scope=product`
  - `product_id` is required
  - `product_variant_id` is null
- Variant media:
  - `scope=variant`
  - `product_variant_id` is required
  - `product_id` optional (recommended to set for easier queries)
- Global media:
  - `scope=global`
  - `product_id` and `product_variant_id` are null

### Indexing
- `(scope, type)`
- `(product_id, position)`
- `(product_variant_id, position)`
- `created_by`
- `sha1` (optional)

## Backend API
All routes are under `auth:sanctum`.

### Upload
`POST /api/media/upload` (multipart)

- Body:
  - `scope` (global|product|variant)
  - `type` (image|video|file) (optional; can be inferred from mime in phase-1)
  - `product_id` (required if scope=product)
  - `product_variant_id` (required if scope=variant)
  - `file` (required)

- A-scenario rule:
  - If `scope != global`, target id must exist.

- Response:
  - created media item (JSON)

### Media Library list (pagination required)
`GET /api/media?scope=&type=&q=&used=&page=`

- `q` search in: `path`, `alt`, `mime`
- `used`:
  - `1` => attached (simple phase-1: product_id/product_variant_id not null)
  - `0` => orphan

### Delete
`DELETE /api/media/{id}`

- Default behavior:
  - Delete physical file from storage
  - Delete DB record
- If media is attached to product/variant:
  - Delete should still succeed (detach implicitly by deleting record)

### Reorder
- `PUT /api/products/{id}/media/reorder`
- `PUT /api/variants/{id}/media/reorder`

Body:
```json
{ "ids": [1,2,3] }
```

Rules:
- Validate all ids belong to that owner and scope.
- Set `position = index`.

## Backend Implementation Notes
- Store files on `public` disk (phase-1).
- Path proposal: `media/{Y}/{m}/{uuid}.{ext}`.
- Add `Media` model with relations:
  - `product()`
  - `variant()`
  - `creator()`

## Frontend UX

### 1) MediaManager (Product/Variant gallery)
Used inside product edit page and variant drawer.

Features:
- 200x200 thumbnail grid
- Add card at the end
- Drag & drop reorder (grid sorting)
- Upload from:
  - click file picker
  - drag/drop into the grid area
- Hover overlay actions:
  - Preview (modal)
  - Delete (Popconfirm)

### 2) MediaLibrary (/admin/media)
Central library.

Features:
- Grid/List toggle
- Search (path/alt/mime)
- Filters:
  - scope (global/product/variant)
  - type (image/video/file)
  - used (used/orphan)
- Sorting:
  - newest
  - size
  - (phase-2) most used
- Actions:
  - Preview
  - Copy URL
  - Delete (single/bulk)
  - Where used links:
    - product edit page
    - variant edit context (phase-1: product link + highlight variant later)

### 3) MediaPickerModal (phase-2)
For selecting from library when attaching logo/banner or selecting existing assets.

## Settings integration (future)
Phase-1 (fast): store `media_id` directly in settings keys.

Phase-2 (more robust): add `media_usages` table to track references from:
- Settings
- Theme sections
- Pages

## Development Order
1) Backend: migration `media`
2) Backend: `Media` model + relations
3) Backend: `MediaController` (upload/list/delete)
4) Backend: reorder endpoints
5) Backend: extend ProductController `show/index` to include media (product + variant)
6) Frontend: `MediaManager` component (grid + upload + preview + delete + reorder)
7) Frontend: integrate into product edit page
8) Frontend: integrate into variant drawer (only when variant has DB id)
9) Frontend: `/admin/media` MediaLibrary page
10) Smoke tests
