# Thana Admin Panel

Admin UI is available at `/admin`. It is intentionally outside the public locale routing and uses a single full-access administrator account.

## Required environment variables

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE
UPLOAD_DIR=/absolute/persistent/path/to/uploads
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-one-time-password
ADMIN_NAME=ผู้ดูแลระบบ
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=base64-encoded-32-byte-key
```

`ADMIN_PASSWORD` must contain at least 12 characters, lowercase and uppercase letters, a number, and a symbol. Remove `ADMIN_PASSWORD` from the VPS environment after the bootstrap command succeeds.

## First deployment

1. Back up the MySQL database and the complete `UPLOAD_DIR`.
2. Deploy the application and install dependencies with the lockfile.
3. Apply `prisma/migrations/20260719090000_add_admin_panel/migration.sql` through the normal Prisma deployment workflow:

   ```bash
   npx prisma migrate deploy
   ```

4. Create or rotate the single administrator account:

   ```bash
   npm run admin:create
   ```

5. Index supported existing files without changing their URLs:

   ```bash
   npm run media:import
   ```

6. Start the production application and open `/admin/login`.

## VPS requirements

- Serve the site through HTTPS. The production session cookie is `Secure`, `HttpOnly`, `SameSite=Lax`, and expires after eight hours.
- Mount `UPLOAD_DIR` on persistent storage and grant the Next.js process read/write access only to that directory.
- Configure the reverse proxy request-body limit to at least 25 MB. The application still enforces 10 MB for JPG/PNG/WebP and 25 MB for PDF after inspecting file magic bytes.
- Forward the real client address in `X-Forwarded-For` or `X-Real-IP` so login throttling works per IP.
- Keep `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` stable across deploys and instances.
- Back up MySQL and `UPLOAD_DIR` together so media records and files remain consistent.

## Operations

- Change the administrator password under **ตั้งค่าบัญชี**. This revokes all other sessions.
- Published records must be unpublished before permanent deletion.
- Catalog records and media cannot be deleted while referenced by content or products.
- Activity logs contain action metadata but never passwords or full rich-text bodies.
- Uploaded files retain their public URL under `/api/uploads/...`; generated names use immutable caching.

## Verification commands

```bash
npm test
npx eslint app/admin components/admin lib/admin app/api/admin app/api/uploads scripts proxy.ts lib/prisma.ts
npx tsc --noEmit
npm run build
```
