"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { BillingStatus } from "@/lib/types";

export function useBillingStatus(
  enabled = true,
): UseQueryResult<BillingStatus> {
  return useQuery({
    queryKey: ["billing", "status"],
    queryFn: () => api.billing.status(),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
