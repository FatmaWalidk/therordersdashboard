# SheetFlow Orders

# Order Management Dashboard (Google Sheets-backed, No Backend) — Project Description

## 1. Problem Statement

A small business currently manages 100% of its custom-product sales through Telegram chat: client requirements, customization details, payment status, and delivery info are all buried in scrolling conversations. As order volume grows, this becomes unsearchable, error-prone, and hard to hand off to any second person (e.g. an assistant/employee). There is no single source of truth for "what did this customer order, have they paid, and what's the status."

## 2. Goal

Build a lightweight, backend-free dashboard that:

- Keeps Telegram (or any channel) as the customer-facing sales conversation — no disruption to what already works

- Uses a Google Sheet, owned by the business, as the database — no server-side storage of customer data, no hosting cost

- Lets the business owner sign in with Google, auto-create the sheet with the right structure, and manage orders from a proper UI instead of raw spreadsheet editing

- Gives customers a branded, Arabic/RTL intake form (instead of a raw Google Form) that writes directly into the owner's sheet

- Is deployable as a static site (e.g. GitHub Pages) — free to host, free to run at small scale

- Has a real path to become a SaaS: any business owner with a Gmail account can connect their own sheet and get their own dashboard

## 3. Architecture (No Backend)

| Piece | How it works | Why |

|---|---|---|

| Frontend | React (Vite) + Tailwind CSS, RTL layout, Arabic UI | Static site, deployable to GitHub Pages / Vercel / Netlify for free |

| Auth | Google Identity Services (client-side OAuth), scoped to Sheets + Drive | No password system to build; sign-in IS the database connection |

| Database | Google Sheets (one spreadsheet per business, created by the dashboard on first login) | Free, owned by the business, no server-side data storage/liability |

| Dashboard ↔ Sheet | Google Sheets API, called directly from the browser using the owner's OAuth token | No server needed — the browser talks to Google directly |

| Customer intake form | A public page (same static site) that writes rows into the sheet via a small **Google Apps Script Web App** deployed on the sheet | Apps Script runs "as the owner," so it can accept public writes without exposing the owner's own OAuth token |

| Session persistence | Silent token refresh via Google Identity Services (`prompt: ''`) after first login | Avoids hourly re-login; owner re-authenticates rarely, not never |

| Large data / scaling | Sharding: an index sheet tracks shard sheets (e.g. "Orders 2026-Q1"); a new shard is created automatically once a row threshold is hit | Keeps each sheet fast and under Sheets' size/performance limits |

| Backup | Scheduled/triggered duplication of the spreadsheet via the Drive API (e.g. on shard rollover, or periodically on login) | Protects against accidental data loss without needing server-side backups |

**Language note:** the entire UI — dashboard and customer intake form — is in Arabic with a right-to-left (RTL) layout. Internal sheet column names can stay in English/neutral for simplicity; only user-facing text needs to be Arabic.

**Trade-offs to keep in mind (from earlier discussion):**

- No backend means the owner may occasionally need to re-approve a Google popup login if their browser session lapses (silent refresh handles most cases, not all).

- The public intake form is only possible via an Apps Script Web App per business — each business needs this deployed once (ideally the dashboard automates/guides this step).

- Going from "one business" to "any Gmail user" as a SaaS requires Google's OAuth app verification process before public launch.

- Sheets API has rate limits and slows down at large row counts — sharding addresses this but adds complexity.

- No server means no server-side spam/rate-limiting on the public form; anything there is handled client-side or by Apps Script itself.

## 4. MVP Scope (Phase 1)

- **Owner onboarding:** "Sign in with Google" → dashboard checks if a linked spreadsheet exists (e.g. via a small marker file in the owner's Drive) → if not, creates one with the correct tabs/columns (Customers, Orders, Index) and an Apps Script Web App deployment for public form submissions.

- **Customers:** name, contact (Telegram handle/phone), notes — stored as sheet rows.

- **Orders:** linked to a customer, product description, customization details, price, payment status (unpaid/partial/paid), order status (new/in progress/ready/shipped/delivered), created date, due date.

- **Order list view:** filter/search by status, customer, date range (read via Sheets API, filtered client-side or via Sheets query params).

- **Order detail view:** full info + edit + status update (writes back to the sheet).

- **Basic dashboard:** order counts by status, revenue this month.

- **Public intake form:** Arabic/RTL branded form (product type, requirements, contact info) that POSTs to the business's Apps Script Web App URL, landing as a new row in their sheet.

## 5. Phase 2 (later, optional)

- Sharding + auto-rollover once a sheet crosses a configurable row threshold.

- Automated spreadsheet backups (Drive API copy) on a schedule or on shard rollover.

- Telegram bot intake as an alternative/additional channel, also writing into the same sheet via the Apps Script Web App.

- Notifications/reminders (e.g. "order due in 2 days").

- Multi-business SaaS onboarding flow + Google OAuth app verification for public launch.

## 6. Data Model (as Sheet columns)

- **Customers sheet:** id, name, contact, notes

- **Orders sheet:** id, customer_id, product_description, customization_details, image_url (optional), price, payment_status, order_status, created_at, due_date

- **Index sheet** (Phase 2, once sharding is needed): shard_name, date_range_start, date_range_end, sheet_id

---

# Step-by-Step Build Prompts

Use these prompts one at a time, in order, with an AI coding assistant (e.g. Claude Code, or Claude in a chat). Each step builds on the previous one — don't skip ahead. Review and test each step before moving to the next.

### Step 1 — Project setup

> Set up a new React project with Vite and Tailwind CSS named `order-dashboard`. Configure it for Arabic with a right-to-left (RTL) layout: set `dir="rtl"` and `lang="ar"` on the root HTML element, enable Tailwind's RTL support (or use logical properties so spacing/alignment flips correctly), and load an Arabic-friendly font (e.g. Cairo, Tajawal, or IBM Plex Sans Arabic) via Google Fonts. Set up routing (react-router) with two top-level areas: a protected `/dashboard` section and a public `/order` (intake form) route.

### Step 2 — Google sign-in (client-side OAuth)

> Integrate Google Identity Services for client-side OAuth in this React app. Request scopes for Google Sheets and Google Drive (file-level, not full Drive access). On successful login, store the access token in memory (not localStorage) and implement silent token refresh (calling the token client with an empty prompt) so the user isn't asked to log in again on every visit within the same browser session. Show a clear "Google بحساب الدخول تسجيل" (Sign in with Google) button in Arabic.

### Step 3 — Auto-create the spreadsheet

> After a successful Google login, check the user's Drive (via the Drive API) for a marker file/spreadsheet named something like `OrderDashboard-Data`. If it doesn't exist, use the Sheets API to create a new spreadsheet with three tabs: `Customers`, `Orders`, and `Index`, each with the correct header row matching this data model: [paste Data Model section]. Store the resulting spreadsheet ID in Drive's app-data-like storage or as a property on the file so it can be found again on future logins.

### Step 4 — Sheets read/write helper layer

> Build a small API helper module that wraps the Google Sheets API (using the stored OAuth token) with functions: `getCustomers()`, `addCustomer(customer)`, `getOrders(filters)`, `addOrder(order)`, `updateOrder(id, changes)`. Handle Sheets API pagination/row-range logic and basic error handling (expired token → trigger re-auth).

### Step 5 — Orders list page

> Build an Orders list page (Arabic/RTL) that calls `getOrders()` and displays a table: customer name, product description, payment status, order status, due date — with status values shown as Arabic labels (e.g. "جديد", "قيد التنفيذ", "تم الدفع", "تم الشحن"). Add client-side filter controls (status dropdown, search box, date range) and pagination.

### Step 6 — Order detail / edit page

> Build an Order detail page (Arabic/RTL) showing all order fields, with an edit form that calls `updateOrder()` to update customization details, price, payment status, and order status. Include an image URL preview if one is attached.

### Step 7 — New order + customer forms (internal, for the owner)

> Build a "New Order" form inside the dashboard (Arabic/RTL) that lets the owner pick an existing customer (via `getCustomers()`) or add a new one inline (`addCustomer()`), then fill in product/customization details and call `addOrder()`.

### Step 8 — Dashboard home / summary page

> Build a dashboard home page (Arabic/RTL) that fetches all orders, computes counts by status and this month's revenue on the client side, and displays them as cards or a small chart.

### Step 9 — Apps Script Web App for public intake

> Write a Google Apps Script (bound to the generated spreadsheet) that exposes a `doPost(e)` function: it accepts JSON with customer + order fields, appends a new row to the `Customers` sheet (if the customer is new) and a new row to the `Orders` sheet, and returns a JSON success response. Include basic input validation and a shared secret/token check in the request to reduce spam. Document how this script is deployed as a Web App (execute as "Me", accessible to "Anyone") — ideally scripted so it can eventually be automated from Step 3's onboarding flow.

### Step 10 — Public customer intake form

> Build a public-facing intake page (Arabic/RTL, no login required) at the `/order` route: a branded form asking for product type, customization details, contact info, and optional reference image (upload as a Drive file link if feasible, or skip images for v1). On submit, POST the data to the business's Apps Script Web App URL (configurable per deployment) and show an Arabic success/error message.

### Step 11 — Deploy as a static site

> Prepare this React app for deployment on GitHub Pages (or Vercel/Netlify): configure the correct base path for GitHub Pages, set up a build + deploy GitHub Action, and document any environment-specific config (e.g. Google OAuth client ID, Apps Script Web App URL) as build-time environment variables.

### Step 12 (Phase 2) — Sharding

> Extend the Sheets helper layer to check row counts on the active `Orders` sheet against a configurable threshold (e.g. 5,000 rows). When exceeded, create a new shard spreadsheet/tab, record it in the `Index` sheet with its date range, and route new writes to the current shard while reads merge data across relevant shards for a given date range.

### Step 13 (Phase 2) — Backups

> Add a backup routine using the Drive API's file-copy capability: trigger a full spreadsheet duplication into a "Backups" folder in the owner's Drive whenever a shard rolls over, and/or once per session if the last backup is older than a configurable number of days. Store the last-backup timestamp in the `Index` sheet.

### Step 14 (Phase 2) — Telegram bot intake (alternative channel)

> Build a Telegram bot (using the Telegram Bot API) that walks a customer through the same structured intake flow as the web form and, on completion, POSTs to the same Apps Script Web App endpoint used in Step 9 — so both channels feed the same sheet.

### Step 15 (Phase 2, SaaS direction) — Multi-business onboarding + OAuth verification

> Generalize the onboarding flow (Steps 2–3, 9) so any Gmail user can connect their own spreadsheet and get their own isolated dashboard instance, and prepare the Google Cloud OAuth consent screen for verification (privacy policy page, scope justification) ahead of a public multi-tenant launch.

---

**Note:** Steps 1–11 are the MVP — a fully working, backend-free, single-business dashboard deployable as a static site. Steps 12–15 are optional next steps once real usage validates the approach and you're ready to scale it toward a multi-business SaaS.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://therordersdashboard.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7f6246da-6ba5-4ac9-ae94-09b028fcc014).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
