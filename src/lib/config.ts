// Build-time configuration (set these in .env / GitHub Actions secrets)
export const GOOGLE_CLIENT_ID = import.meta.env['VITE_GOOGLE_CLIENT_ID'] ?? "";
export const APPS_SCRIPT_URL = import.meta.env['VITE_APPS_SCRIPT_URL'] ?? "";
export const INTAKE_TOKEN = import.meta.env['VITE_INTAKE_TOKEN'] ?? "";

export const SPREADSHEET_NAME = "OrderDashboard-Data";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");
