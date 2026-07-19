# Thana Admin Panel Implementation Plan

> **For agentic workers:** Implement task-by-task with test-first cycles. Do not commit automatically; this repository requires explicit user approval before any commit.

**Goal:** Add a secure Thai-language `/admin` application for managing the existing bilingual catalog and content models on a single-VPS Next.js deployment.

**Architecture:** Keep the admin inside the existing App Router application. Server Components read through server-only data modules; thin Server Actions validate input, verify an opaque database session, mutate through Prisma transactions, record activity, and revalidate affected routes. Uploaded media remains on the VPS persistent `UPLOAD_DIR` and is indexed in MySQL.

**Tech Stack:** Next.js 16.2 App Router, React 19, Prisma 7/MariaDB, Zod, Argon2, sanitize-html, file-type, Tiptap, shadcn/ui, Lucide, Vitest, Testing Library.

## Global Constraints

- Admin UI is Thai; managed content remains bilingual Thai/English.
- Use shadcn/ui and Lucide before custom primitives; never use emoji icons.
- Follow `DESIGN.md`; never use raw Tailwind font-size utilities in UI.
- Preserve public upload URLs and all existing content records.
- One full-access administrator account; no revision restore or homepage CMS.
- Never commit without explicit user approval.

---

### Task 1: Test harness and security-domain primitives

**Files:** `package.json`, `vitest.config.ts`, `tests/setup.ts`, `lib/admin/security/*`, `lib/admin/validation/*`

**Interfaces:** Produce `slugifyAdminTitle`, `sanitizeRichHtml`, upload validation helpers, password helpers, opaque session token helpers, and shared `ActionResult` types.

- [ ] Add Vitest/Testing Library scripts and configuration.
- [ ] Write failing unit tests for slug creation, HTML allowlisting, password policy, token hashing, upload MIME/size checks, variant invariants, and safe upload path resolution.
- [ ] Run each focused test and confirm it fails because its production function is absent.
- [ ] Implement the minimal helpers and rerun focused tests to green.
- [ ] Run the complete unit suite before continuing.

### Task 2: Additive database schema and administrator bootstrap

**Files:** `prisma/schema.prisma`, `scripts/create-admin.ts`, `lib/prisma.ts`

**Interfaces:** Add `AdminUser`, `AdminSession`, `AdminLoginAttempt`, `ActivityLog`, and `MediaAsset`; expose a lazy `getPrisma()` while retaining `prisma` compatibility for existing public pages.

- [ ] Extend Prisma schema with indexed relations and non-destructive delete behavior.
- [ ] Generate the client and validate the schema without applying a production migration.
- [ ] Add a bootstrap command that validates `ADMIN_EMAIL`/`ADMIN_PASSWORD`, hashes the password, and upserts the single administrator.
- [ ] Document required environment variables and VPS migration/bootstrap commands.

### Task 3: Authentication, authorization, and audit boundary

**Files:** `lib/admin/auth.ts`, `lib/admin/audit.ts`, `app/admin/login/*`, `proxy.ts`

**Interfaces:** Produce `createAdminSession`, `getAdminSession`, `requireAdmin`, `destroyAdminSession`, `loginAction`, `logoutAction`, `changePasswordAction`, and `recordActivity`.

- [ ] Write failing tests around session expiry, invalid tokens, generic login failures, throttling decisions, and password-change session revocation.
- [ ] Implement opaque token cookies (`HttpOnly`, production `Secure`, `SameSite=Lax`, eight-hour expiry) with only token hashes stored in MySQL.
- [ ] Add persistent per-IP/email login attempts and generic Thai error responses.
- [ ] Route `/admin/login` around the authenticated shell and combine the admin optimistic cookie check with existing next-intl Proxy behavior.
- [ ] Re-authorize inside every mutation boundary; Proxy is never authoritative.

### Task 4: Admin shell and dashboard

**Files:** `app/admin/(panel)/layout.tsx`, `app/admin/(panel)/page.tsx`, `components/admin/admin-shell.tsx`, `components/ui/*`

**Interfaces:** A responsive sidebar/header shell and dashboard DTO containing totals, draft counts, active promotions, and recent activity.

- [ ] Add the necessary shadcn Card, Table, Badge, Input, Label, Select, Tabs, DropdownMenu, AlertDialog, Sheet, Textarea, and toast primitives.
- [ ] Build the approved fixed-sidebar desktop layout and Sheet navigation on mobile using design tokens and typography utilities.
- [ ] Add dashboard cards, recent activity, empty/error states, and quick-create links.
- [ ] Confirm keyboard navigation, active route state, and responsive overflow behavior.

### Task 5: Shared list/form/action infrastructure

**Files:** `lib/admin/content-config.ts`, `lib/admin/content-data.ts`, `app/admin/(panel)/content/*`, `components/admin/content-*`

**Interfaces:** Typed configurations and actions for Work, Article, ArticleCategory, News, and Promotion with `{ success, message, fieldErrors?, conflict? }` results.

- [ ] Write failing validation and optimistic-concurrency tests for bilingual draft/publish rules.
- [ ] Implement server-side search, status filters, ordering, and pagination.
- [ ] Build reusable bilingual forms with slug generation, cover media selection, Tiptap HTML editing, draft/publish actions, unsaved-change warning, and field errors.
- [ ] Add guarded permanent deletion requiring the exact display name and record all mutations in `ActivityLog`.
- [ ] Revalidate admin and affected public localized routes after successful mutations.

### Task 6: Catalog reference management

**Files:** `lib/admin/catalog-data.ts`, `app/admin/(panel)/catalog/*`, `components/admin/catalog-*`

**Interfaces:** CRUD for Category, SubCategory, Brand, ProductUnit, PricingUnit, Attribute, AttributeValue, and CategoryAttribute mappings.

- [ ] Write failing tests for unique slugs/codes, parent-child consistency, and reference-aware delete guards.
- [ ] Implement searchable paginated lists and focused forms for each reference type.
- [ ] Block deletion while products or mappings reference a record and present the reason in Thai.
- [ ] Support category attribute ordering plus filter/required flags.

### Task 7: Full product editor

**Files:** `lib/admin/product-data.ts`, `app/admin/(panel)/products/*`, `components/admin/product-*`

**Interfaces:** Product editor DTO plus transactional create/update actions covering core fields, media, category, units, attribute links, variants, and optimistic concurrency.

- [ ] Write failing tests for duplicate SKU, duplicate attribute combinations, negative prices, multiple defaults, and category/subcategory/attribute mismatch.
- [ ] Build sectioned bilingual product form with media, pricing, classification, attribute, and variant-table sections.
- [ ] Replace product child collections atomically inside one Prisma transaction after validation.
- [ ] Add preview, draft/publish/unpublish, guarded delete, and public-route revalidation.

### Task 8: Media library and hardened file serving

**Files:** `app/api/admin/media/route.ts`, `app/api/uploads/[...path]/route.ts`, `app/admin/(panel)/media/page.tsx`, `scripts/import-media.ts`

**Interfaces:** Authenticated multipart upload/delete API, media picker/list DTO, and idempotent existing-file import command.

- [ ] Write failing tests for magic-byte validation, maximum sizes, unique filenames, traversal attempts, and referenced-file delete guards.
- [ ] Accept JPG/PNG/WebP up to 10 MB and PDF up to 25 MB; reject SVG and mismatched content.
- [ ] Store files below `UPLOAD_DIR`, index metadata, and retain `/api/uploads/...` URLs.
- [ ] Harden public path containment using `path.relative`; use immutable caching only for generated unique names.
- [ ] Add media list/search/upload/delete UI and importer for existing files.

### Task 9: Preview, activity, and profile workflows

**Files:** `app/admin/(panel)/preview/[resource]/[id]/page.tsx`, `app/admin/(panel)/activity/page.tsx`, `app/admin/(panel)/profile/page.tsx`

**Interfaces:** Authenticated bilingual preview resolver, paginated activity log, and password-change form.

- [ ] Resolve only allowlisted resources and validate IDs/locales.
- [ ] Render draft previews with sanitized HTML and the public content visual language.
- [ ] Show searchable activity metadata without password or full rich-content values.
- [ ] Change password after current-password verification and revoke every other session.

### Task 10: Full verification and deployment handoff

**Files:** `README.md`, `.env.example`, end-to-end test files

- [ ] Add end-to-end coverage for login, draft, bilingual preview, publish, public visibility, unpublish, upload, and unauthorized access.
- [ ] Run unit/integration tests, ESLint, TypeScript/Next build, and responsive browser checks.
- [ ] Document backup, Prisma migration, admin bootstrap, media import, HTTPS, persistent directory permissions, reverse-proxy 25 MB body limit, and `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`.
- [ ] Review the working tree with the user; do not commit until they explicitly approve.
