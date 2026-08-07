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

6. Fingerprint the media library so the duplicate-upload warning can see existing files:

   ```bash
   npm run media:checksum
   ```

7. Start the production application and open `/admin/login`.

## VPS requirements

- Serve the site through HTTPS. The production session cookie is `Secure`, `HttpOnly`, `SameSite=Lax`, and expires after eight hours.
- Mount `UPLOAD_DIR` on persistent storage and grant the Next.js process read/write access only to that directory.
- Configure the reverse proxy request-body limit to at least 25 MB. The application still enforces 10 MB for JPG/PNG/WebP and 25 MB for PDF after inspecting file magic bytes.
- Forward the real client address in `X-Forwarded-For` or `X-Real-IP` so login throttling works per IP.
- Keep `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` stable across deploys and instances.
- Back up MySQL and `UPLOAD_DIR` together so media records and files remain consistent.

## Scheduled maintenance

Nothing deletes data on a timer by itself. Two scripts do that work and the server's own cron has to call them — without them `UPLOAD_DIR` only ever grows and the site keeps personal data past the retention period it publishes on `/privacy`.

```cron
# Sunday 03:00 — delete data past its retention period
0 3 * * 0 cd /srv/thana-webapp && npm run retention:run >> /var/log/thana-retention.log 2>&1
# Daily 04:00 — remove orphaned uploads and crash leftovers
0 4 * * * cd /srv/thana-webapp && npm run uploads:sweep -- --delete >> /var/log/thana-sweep.log 2>&1
```

**`npm run retention:run`** — anonymizes quotation requests older than three years (deleting the BOQ file first, then overwriting every personal column and clearing the download token so old LINE links stop resolving), and prunes expired admin sessions, login attempts older than 30 days, and activity logs older than two years. The request code, dates and line items survive so historical reporting still works. The job is idempotent.

**`npm run uploads:sweep`** — deletes `.tmp` files left by a crash and BOQ files no request points at any more. Files under `media/` and anything outside the two managed trees are reported but never deleted automatically, because `media:import` exists precisely for files placed on disk before the `MediaAsset` table knows about them.

Before enabling either cron:

1. Back up MySQL and `UPLOAD_DIR`.
2. Run both scripts once without `--delete` (`npm run retention:run -- --dry-run`, `npm run uploads:sweep`) and read what they report.
3. Tell the sales team that a request which turned into a real order needs the **"ลูกค้ารายนี้สั่งซื้อจริง เก็บข้อมูลไว้ 10 ปี"** switch on `/admin/quotations/<id>` before it reaches three years. Nothing in the database marks a request as sold, so that switch is the only thing standing between an order record and automatic deletion.

Disk headroom, the size of both upload trees, and how many requests have already been anonymized are shown on `/admin/settings` under **พื้นที่จัดเก็บไฟล์**.

## Duplicate uploads

Every upload surface in the admin panel checks the media library before storing a file and asks the admin whether to reuse what is already there. Two checks run: an exact filename match before the bytes are sent, and a sha256 of the optimized bytes on the server, which returns `409` and stores nothing when an identical file already exists. Choosing **อัปโหลดเป็นไฟล์ใหม่** re-sends with `force=1` and creates a second copy on purpose.

**`npm run media:checksum`** fills `MediaAsset.checksum` for files uploaded before the column existed — without it the content check only sees files uploaded after this feature shipped. It is idempotent (it only reads rows where the checksum is still null), skips rows whose file is missing from disk, and prints the groups of byte-identical files already in the library at the end. Run it once after deploying, and again after `media:import`.

The checksum is taken from the bytes on disk, so it identifies a file exactly; two exports of the same photo differ byte-for-byte and are only caught by the filename check.

## LINE quotation notifications

Every quotation request is pushed to one of three sales LINE groups. Which group receives it is decided by the delivery address and the categories in the cart, not by anything the customer selects — see **[LINE-NOTIFICATION.md](LINE-NOTIFICATION.md) → กลุ่มไหนได้รับใบไหน** for the rules. The five `LINE_*` variables are optional: when they are missing the site still accepts quotations and only logs a warning.

The **criteria** those rules test — which districts headquarters covers, which categories the factory produces, and the per-product exceptions — are stored in the database and edited at **`/admin/settings/line-routing`** (reachable from the **กฎการส่งแจ้งเตือนกลุ่มไลน์ทีมขาย** card on `/admin/settings`). Changes apply to both automatic sends and the resend button immediately, with no restart. The **order** of the four rules stays in `lib/line/routing.ts`, and group ids stay in `.env`. Product exceptions are keyed by product id, so renaming a product in the admin panel can no longer misroute anything.

**[LINE-NOTIFICATION.md](LINE-NOTIFICATION.md) is the full Thai walkthrough** — creating the bot, every console toggle, obtaining group ids, and the failure table. The summary below is only a checklist for someone who has done it before.

1. Create a **Messaging API** channel in the LINE Developers Console, then in the LINE Official Account Manager disable auto-reply and greeting messages and enable **Allow bot to join group chats** — without it the bot cannot be invited to a group.
2. Issue a long-lived channel access token and copy the channel secret into `LINE_CHANNEL_ACCESS_TOKEN` / `LINE_CHANNEL_SECRET`.
3. Set the channel's Webhook URL to `https://<domain>/api/line/webhook`, enable **Use webhook**, and press **Verify** — it must report success.
4. Invite the bot into all three sales groups (headquarters, Thalang, factory). The application log then prints one line per event, e.g. `[line webhook] event=join source=group groupId=Cxxxx ...`. LINE never shows group ids in the app, so this log is the only way to obtain them.
5. Put each group id into `LINE_GROUP_ID_HEADQUARTERS` / `LINE_GROUP_ID_THALANG` / `LINE_GROUP_ID_FACTORY` and restart the application. Groups whose id is missing are skipped individually; the others still receive notifications.

Delivery status is stored on the request itself and shown under **แจ้งเตือนกลุ่มไลน์ทีมขาย** on `/admin/quotations/<id>`, together with the routed group, the reason it was chosen, and a resend button for requests that failed. The quotations list marks failed rows with a warning icon.

Remaining monthly message quota is shown on `/admin/settings` under **โควต้าข้อความ LINE**, read live from LINE on every page load with a refresh button. The card also reports how many quotation requests this site notified this month, counted in Thai time — that figure counts requests, not messages, so it will never match LINE's own total. See **[LINE-NOTIFICATION.md](LINE-NOTIFICATION.md) → ข้อควรรู้** for why.

## Promotions on product pages

A promotion edited under **โปรโมชั่น** (`/admin/content/promotions`) can be bound to the catalog, in which case it also appears as a card band on the detail page of every product it matches.

- The **ผูกกับสินค้า** card offers four independent rules: a **แสดงกับสินค้าทุกตัว** switch, plus lists of main categories, sub-categories, and individual products. A product shows the promotion if it matches **any one** of them, so a whole category and a stray product outside it can be covered by the same promotion.
- Turning the switch on only dims the three lists — they are still saved, so switching back restores the previous selection.
- Bindings are optional. A promotion with none behaves exactly as before: visible under `/news` and at `/promotions/<slug>`, absent from product pages. Promotions created before this feature start unbound.
- The product page enforces `startDate` / `endDate`: a promotion that has ended or has not started yet is hidden there, while the `/news` listing still shows it as an archive.
- Products can be bound while still drafts; the promotion appears once the product is published.
- Deleting a product, category, or sub-category clears its bindings automatically.

## Letting customers fill in their own values

Some products are made to order, so what the customer wants cannot be listed in advance. The **ช่องให้ลูกค้ากรอกเอง (สินค้าสั่งตัด)** card on a product's **คุณลักษณะและตัวเลือก** tab adds inputs that appear on the storefront only while a specific option value is selected.

Each field is either **ตัวเลข** (a measurement, with a min/max/step) or **ข้อความ** (free text, with a maximum length), and each can be marked **ต้องกรอก** or left optional. An optional field the customer leaves blank is still recorded on the quotation, as **ไม่ระบุ** / *Not specified* — so staff can tell "the customer declined it" from "this product never offered it".

To set one up:

1. Under **ตัวเลือกที่ลูกค้าเลือกได้**, make sure the option carries a value that means "made to order" (the shared dictionary already has **ขนาด → สั่งตัดตามขนาด**).
2. Make sure at least one variant row uses that value. A value no variant carries never reaches the storefront picker, so the inputs would never appear.
3. Add a field, choose that value under **แสดงช่องนี้เมื่อลูกค้าเลือก**, pick **ชนิดของช่อง**, then fill in the label in both languages and the limits for that type.

Things worth knowing before using this:

- **The limits are enforced, not suggested.** The cart lives in the customer's browser, so the quotation action re-checks every submitted value against these limits and drops any line that fails. Enter the range the factory can actually cut — it is the only thing stopping an impossible request from reaching the LINE group.
- **Two entries are two lines.** The same variant ordered at two different sizes, or with two different engraving texts, stays as two separate cart lines and two separate rows on the quotation.
- **Typed values are not filterable.** Only the trigger value (e.g. "สั่งตัดตามขนาด") appears in the product filters, and it means "this product can be made to order", not "this product comes that way".
- **Numeric fields need a unit; text fields do not.** "1200" alone does not say millimetres or centimetres, so a unit is required in both languages for **ตัวเลข**.
- **Length caps are hard.** One text answer can be at most 200 characters, and the fields sharing a trigger value must fit together into 255 characters. The editor refuses a configuration that would overflow, because the overflow would otherwise be silently cut off the LINE card and the quotation row.
- `AttributeInputType` **ตัวเลข** / **ข้อความ** under `/admin/catalog` is a different thing: it still means a list of values the admin defines up front, not a box the customer types into. Per-product limits are why this feature does not reuse it.

### Free text and personal data — read before enabling one

A text field lets the customer type anything, including their own name, phone number, or site address.

`QuotationItem` rows are deliberately **not** touched by the retention job: they are treated as non-identifying product statistics and kept after a request is anonymized (see `anonymizedQuotationFields` in `lib/admin/retention.ts`). That was decided when these fields were numeric only, and **it still applies to text**, so anything a customer types into one survives the 3-year anonymization indefinitely.

That is a deliberate choice, not an oversight. It means:

- Use text fields only for what the factory needs to make the product — engraving wording, a finish reference — and never as a second place to ask for contact details. The quotation form already collects those, in columns the retention job does clear.
- If the privacy policy later has to cover this, add `customFieldsTh` and `customFieldsEn` to `anonymizedQuotationFields`. That single change makes the retention job clear them, at the cost of losing the numeric measurements too.

Newlines, tabs, and control characters in a typed note are collapsed to single spaces on submit, so a pasted multi-line block cannot break the quotation row or the LINE card layout.

The values reach staff as their own line on `/admin/quotations/<id>` and in the LINE card, highlighted separately from the options picked from a list.

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
