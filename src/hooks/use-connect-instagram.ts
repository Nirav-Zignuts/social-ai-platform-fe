"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import {
  setInstagramOAuthReturn,
  type InstagramOAuthReturnTarget,
} from "@/lib/instagram-oauth-return";

export function useConnectInstagram(
  workspaceId: string,
  returnTarget?: InstagramOAuthReturnTarget,
) {
  return useMutation({
    mutationFn: async () => {
      if (returnTarget) {
        setInstagramOAuthReturn(returnTarget);
      } else if (workspaceId) {
        setInstagramOAuthReturn({ type: "settings", workspaceId });
      }
      await api.instagram.connect(workspaceId);
    },
    onError: (error: Error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to start Instagram connect",
      );
    },
  });
}
