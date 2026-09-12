import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGoogleAuth } from "./google-auth";
import { findOrCreateSpreadsheet, getCustomers, getOrders, type OrderFilters } from "./sheets";

/** Resolves (or creates) the owner's spreadsheet once a token exists. */
export function useSpreadsheet() {
  const { token } = useGoogleAuth();
  return useQuery({
    queryKey: ["spreadsheet", Boolean(token)],
    enabled: Boolean(token),
    staleTime: Infinity,
    queryFn: () => findOrCreateSpreadsheet(token!),
  });
}

export function useCustomers() {
  const { token } = useGoogleAuth();
  const { data: spreadsheetId } = useSpreadsheet();
  return useQuery({
    queryKey: ["customers", spreadsheetId],
    enabled: Boolean(token && spreadsheetId),
    queryFn: () => getCustomers(token!, spreadsheetId!),
  });
}

export function useOrders(filters: OrderFilters = {}) {
  const { token } = useGoogleAuth();
  const { data: spreadsheetId } = useSpreadsheet();
  const { data: customers } = useCustomers();
  return useQuery({
    queryKey: ["orders", spreadsheetId, filters, customers?.length ?? 0],
    enabled: Boolean(token && spreadsheetId),
    queryFn: () => getOrders(token!, spreadsheetId!, filters, customers ?? []),
  });
}

export function useRefreshData() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["orders"] });
    void qc.invalidateQueries({ queryKey: ["customers"] });
  };
}
