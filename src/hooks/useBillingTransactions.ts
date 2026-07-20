"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { BillingTransactionsQuery } from "@/lib/types";

export function useBillingTransactions(query: BillingTransactionsQuery) {
  return useQuery({
    queryKey: ["billing", "transactions", query],
    queryFn: () => api.billing.transactions(query),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
