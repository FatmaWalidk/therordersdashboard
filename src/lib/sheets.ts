import { SPREADSHEET_NAME } from "./config";

const DRIVE = "https://www.googleapis.com/drive/v3";
const SHEETS = "https://sheets.googleapis.com/v4/spreadsheets";

export class AuthExpiredError extends Error {
  constructor() {
    super("auth_expired");
  }
}

export type Customer = {
  id: string;
  name: string;
  contact: string;
  notes: string;
};

export type Order = {
  id: string;
  customer_id: string;
  product_description: string;
  customization_details: string;
  image_url: string;
  price: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  due_date: string;
};

export const CUSTOMER_HEADERS = ["id", "name", "contact", "notes"];
export const ORDER_HEADERS = [
  "id",
  "customer_id",
  "product_description",
  "customization_details",
  "image_url",
  "price",
  "payment_status",
  "order_status",
  "created_at",
  "due_date",
];
export const INDEX_HEADERS = ["shard_name", "date_range_start", "date_range_end", "sheet_id"];

async function api<T>(token: string, url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401 || res.status === 403) throw new AuthExpiredError();
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google API ${res.status}: ${body}`);
  }
  return (await res.json()) as T;
}

/** Find the dashboard spreadsheet in the owner's Drive, or create it with the right tabs. */
export async function findOrCreateSpreadsheet(token: string): Promise<string> {
  const cached = localStorage.getItem("juhd_spreadsheet_id");
  if (cached) return cached;

  const q = encodeURIComponent(
    `name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
  );
  const found = await api<{ files: { id: string }[] }>(
    token,
    `${DRIVE}/files?q=${q}&fields=files(id,name)&spaces=drive`,
  );
  if (found.files?.length) {
    localStorage.setItem("juhd_spreadsheet_id", found.files[0]!.id);
    return found.files[0]!.id;
  }

  const created = await api<{ spreadsheetId: string }>(token, SHEETS, {
    method: "POST",
    body: JSON.stringify({
      properties: { title: SPREADSHEET_NAME, locale: "ar_SA" },
      sheets: [
        { properties: { title: "Customers" } },
        { properties: { title: "Orders" } },
        { properties: { title: "Index" } },
      ],
    }),
  });
  const id = created.spreadsheetId;

  await api(token, `${SHEETS}/${id}/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "RAW",
      data: [
        { range: "Customers!A1", values: [CUSTOMER_HEADERS] },
        { range: "Orders!A1", values: [ORDER_HEADERS] },
        { range: "Index!A1", values: [INDEX_HEADERS] },
      ],
    }),
  });

  localStorage.setItem("juhd_spreadsheet_id", id);
  return id;
}

function rowsToObjects<T>(headers: string[], values: string[][]): T[] {
  return values.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = row[i] ?? ""));
    return obj as T;
  });
}

async function readRange(token: string, spreadsheetId: string, range: string) {
  const data = await api<{ values?: string[][] }>(
    token,
    `${SHEETS}/${spreadsheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`,
  );
  const values = (data.values ?? []).map((r) => r.map((c) => (c == null ? "" : String(c))));
  return values.slice(1); // drop header row
}

async function appendRow(token: string, spreadsheetId: string, tab: string, row: string[]) {
  await api(token, `${SHEETS}/${spreadsheetId}/values/${tab}!A:A:append?valueInputOption=USER_ENTERED`, {
    method: "POST",
    body: JSON.stringify({ values: [row] }),
  });
}

export function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function getCustomers(token: string, spreadsheetId: string): Promise<Customer[]> {
  const rows = await readRange(token, spreadsheetId, "Customers!A1:D100000");
  return rowsToObjects<Customer>(CUSTOMER_HEADERS, rows).filter((c) => c.id);
}

export async function addCustomer(
  token: string,
  spreadsheetId: string,
  customer: Omit<Customer, "id"> & { id?: string },
): Promise<Customer> {
  const full: Customer = { id: customer.id || newId("cus"), ...customer } as Customer;
  await appendRow(
    token,
    spreadsheetId,
    "Customers",
    CUSTOMER_HEADERS.map((h) => String((full as unknown as Record<string, string>)[h] ?? "")),
  );
  return full;
}

export type OrderFilters = {
  search?: string;
  orderStatus?: string;
  paymentStatus?: string;
  from?: string;
  to?: string;
};

export async function getOrders(
  token: string,
  spreadsheetId: string,
  filters: OrderFilters = {},
  customers: Customer[] = [],
): Promise<Order[]> {
  const rows = await readRange(token, spreadsheetId, "Orders!A1:J100000");
  let orders = rowsToObjects<Order>(ORDER_HEADERS, rows).filter((o) => o.id);

  const nameById = new Map(customers.map((c) => [c.id, c.name]));
  if (filters.orderStatus) orders = orders.filter((o) => o.order_status === filters.orderStatus);
  if (filters.paymentStatus) orders = orders.filter((o) => o.payment_status === filters.paymentStatus);
  if (filters.from) orders = orders.filter((o) => (o.created_at || "") >= filters.from!);
  if (filters.to) orders = orders.filter((o) => (o.created_at || "") <= `${filters.to!}\uffff`);
  if (filters.search) {
    const s = filters.search.trim().toLowerCase();
    orders = orders.filter((o) =>
      [o.product_description, o.customization_details, nameById.get(o.customer_id) ?? "", o.id]
        .join(" ")
        .toLowerCase()
        .includes(s),
    );
  }
  return orders.reverse();
}

export async function addOrder(
  token: string,
  spreadsheetId: string,
  order: Partial<Order>,
): Promise<Order> {
  const full: Order = {
    id: order.id || newId("ord"),
    customer_id: order.customer_id ?? "",
    product_description: order.product_description ?? "",
    customization_details: order.customization_details ?? "",
    image_url: order.image_url ?? "",
    price: order.price ?? "0",
    payment_status: order.payment_status ?? "unpaid",
    order_status: order.order_status ?? "new",
    created_at: order.created_at || new Date().toISOString().slice(0, 10),
    due_date: order.due_date ?? "",
  };
  await appendRow(
    token,
    spreadsheetId,
    "Orders",
    ORDER_HEADERS.map((h) => String((full as unknown as Record<string, string>)[h] ?? "")),
  );
  return full;
}

export async function updateOrder(
  token: string,
  spreadsheetId: string,
  id: string,
  changes: Partial<Order>,
): Promise<Order> {
  const rows = await readRange(token, spreadsheetId, "Orders!A1:J100000");
  const index = rows.findIndex((r) => r[0] === id);
  if (index === -1) throw new Error("order_not_found");
  const current = rowsToObjects<Order>(ORDER_HEADERS, [rows[index]!])[0]!;
  const updated = { ...current, ...changes } as Order;
  const rowNumber = index + 2; // +1 header, +1 one-based
  await api(
    token,
    `${SHEETS}/${spreadsheetId}/values/Orders!A${rowNumber}:J${rowNumber}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      body: JSON.stringify({
        values: [
          ORDER_HEADERS.map((h) => String((updated as unknown as Record<string, string>)[h] ?? "")),
        ],
      }),
    },
  );
  return updated;
}

export async function getOrder(
  token: string,
  spreadsheetId: string,
  id: string,
): Promise<Order | null> {
  const rows = await readRange(token, spreadsheetId, "Orders!A1:J100000");
  const row = rows.find((r) => r[0] === id);
  return row ? rowsToObjects<Order>(ORDER_HEADERS, [row])[0]! : null;
}

export function spreadsheetUrl(id: string) {
  return `https://docs.google.com/spreadsheets/d/${id}/edit`;
}
