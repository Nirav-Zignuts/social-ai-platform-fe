"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";

export function useConnectInstagram(workspaceId: string) {
  return useMutation({
    mutationFn: () => api.instagram.connect(workspaceId),
    onError: (error: Error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to start Instagram connect",
      );
    },
  });
}
