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
LINE_CHANNEL_ACCESS_TOKEN=long-lived-messaging-api-token
LINE_CHANNEL_SECRET=messaging-api-channel-secret
LINE_GROUP_ID_HEADQUARTERS=Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LINE_GROUP_ID_THALANG=Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LINE_GROUP_ID_FACTORY=Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
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

## LINE quotation notifications

Every quotation request is pushed to one of three sales LINE groups. Which group receives it is decided by the delivery address and the categories in the cart, not by anything the customer selects — see **[LINE-NOTIFICATION.md](LINE-NOTIFICATION.md) → กลุ่มไหนได้รับใบไหน** for the rules. The five `LINE_*` variables are optional: when they are missing the site still accepts quotations and only logs a warning.

**[LINE-NOTIFICATION.md](LINE-NOTIFICATION.md) is the full Thai walkthrough** — creating the bot, every console toggle, obtaining group ids, and the failure table. The summary below is only a checklist for someone who has done it before.

1. Create a **Messaging API** channel in the LINE Developers Console, then in the LINE Official Account Manager disable auto-reply and greeting messages and enable **Allow bot to join group chats** — without it the bot cannot be invited to a group.
2. Issue a long-lived channel access token and copy the channel secret into `LINE_CHANNEL_ACCESS_TOKEN` / `LINE_CHANNEL_SECRET`.
3. Set the channel's Webhook URL to `https://<domain>/api/line/webhook`, enable **Use webhook**, and press **Verify** — it must report success.
4. Invite the bot into all three sales groups (headquarters, Thalang, factory). The application log then prints one line per event, e.g. `[line webhook] event=join source=group groupId=Cxxxx ...`. LINE never shows group ids in the app, so this log is the only way to obtain them.
5. Put each group id into `LINE_GROUP_ID_HEADQUARTERS` / `LINE_GROUP_ID_THALANG` / `LINE_GROUP_ID_FACTORY` and restart the application. Groups whose id is missing are skipped individually; the others still receive notifications.

Delivery status is stored on the request itself and shown under **แจ้งเตือนกลุ่มไลน์ทีมขาย** on `/admin/quotations/<id>`, together with the routed group, the reason it was chosen, and a resend button for requests that failed. The quotations list marks failed rows with a warning icon.

## Promotions on product pages

A promotion edited under **โปรโมชั่น** (`/admin/content/promotions`) can be bound to the catalog, in which case it also appears as a card band on the detail page of every product it matches.

- The **ผูกกับสินค้า** card offers four independent rules: a **แสดงกับสินค้าทุกตัว** switch, plus lists of main categories, sub-categories, and individual products. A product shows the promotion if it matches **any one** of them, so a whole category and a stray product outside it can be covered by the same promotion.
- Turning the switch on only dims the three lists — they are still saved, so switching back restores the previous selection.
- Bindings are optional. A promotion with none behaves exactly as before: visible under `/news` and at `/promotions/<slug>`, absent from product pages. Promotions created before this feature start unbound.
- The product page enforces `startDate` / `endDate`: a promotion that has ended or has not started yet is hidden there, while the `/news` listing still shows it as an archive.
- Products can be bound while still drafts; the promotion appears once the product is published.
- Deleting a product, category, or sub-category clears its bindings automatically.

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
