/**
 * جُهد — Apps Script Web App for the public intake form.
 *
 * Deploy (once per business):
 *  1. Open the spreadsheet "OrderDashboard-Data" created by the dashboard.
 *  2. Extensions → Apps Script, paste this file, save.
 *  3. Set SHARED_SECRET below to the same value as VITE_INTAKE_TOKEN in the app.
 *  4. Deploy → New deployment → type "Web app":
 *       Execute as: Me
 *       Who has access: Anyone
 *  5. Copy the Web app URL into VITE_APPS_SCRIPT_URL in the app's .env.
 */

var SHARED_SECRET = "CHANGE_ME";

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents || "{}");

    if (SHARED_SECRET && payload.token !== SHARED_SECRET) {
      return json({ ok: false, error: "unauthorized" });
    }

    var name = String(payload.name || "").trim();
    var contact = String(payload.contact || "").trim();
    var product = String(payload.product_description || "").trim();
    if (!name || !contact || !product) {
      return json({ ok: false, error: "missing_fields" });
    }
    if (name.length > 120 || contact.length > 120 || product.length > 500) {
      return json({ ok: false, error: "too_long" });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var customers = ss.getSheetByName("Customers");
    var orders = ss.getSheetByName("Orders");

    // Find an existing customer by contact, otherwise create one.
    var customerId = "";
    var rows = customers.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][2]).trim() === contact) {
        customerId = String(rows[i][0]);
        break;
      }
    }
    if (!customerId) {
      customerId = "cus_" + Date.now().toString(36);
      customers.appendRow([customerId, name, contact, String(payload.notes || "")]);
    }

    var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    orders.appendRow([
      "ord_" + Date.now().toString(36),
      customerId,
      product,
      String(payload.customization_details || ""),
      String(payload.image_url || ""),
      "",
      "unpaid",
      "new",
      today,
      "",
    ]);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json({ ok: true, service: "juhd-intake" });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
