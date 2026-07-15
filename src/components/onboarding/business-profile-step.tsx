"use client";

import { useMemo, useRef, useState } from "react";
import { BusinessProfileForm } from "@/components/forms/business-profile-form";
import { OnboardingChatPanel } from "@/components/onboarding/onboarding-chat-panel";
import {
  collectedFieldsToUpsert,
  getFromChatFieldKeys,
  getHighlightedProfileFields,
  mergeProfileSources,
  omitDismissedChatFields,
  serializeChatFieldValue,
  synthesizedProfileToUpsert,
} from "@/lib/onboarding-chat";
import type {
  BusinessProfile,
  BusinessProfileUpsert,
  SynthesizedBusinessProfile,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface BusinessProfileStepProps {
  workspaceId: string;
  initialData?: BusinessProfile | null;
  onSubmit: (data: BusinessProfileUpsert) => Promise<void>;
  isSubmitting?: boolean;
}

function buildChatSource(
  collectedFields: Record<string, unknown>,
  draftProfile: SynthesizedBusinessProfile | null,
): Record<string, unknown> {
  if (draftProfile) {
    return synthesizedProfileToUpsert(draftProfile) as Record<string, unknown>;
  }
  return collectedFields;
}

export function BusinessProfileStep({
  workspaceId,
  initialData,
  onSubmit,
  isSubmitting,
}: BusinessProfileStepProps) {
  const [draftProfile, setDraftProfile] =
    useState<SynthesizedBusinessProfile | null>(null);
  const [forcedSynthesis, setForcedSynthesis] = useState(false);
  const [collectedFields, setCollectedFields] = useState<
    Record<string, unknown>
  >({});
  const [dismissedFromChat, setDismissedFromChat] = useState<Set<string>>(
    () => new Set(),
  );
  const chatValueFingerprintRef = useRef<Record<string, string>>({});

  const restoreDismissedForUpdatedChatValues = (
    nextSource: Record<string, unknown>,
  ) => {
    const toRestore: string[] = [];

    for (const [key, value] of Object.entries(nextSource)) {
      const fingerprint = serializeChatFieldValue(value);
      if (!fingerprint) continue;
      const previous = chatValueFingerprintRef.current[key];
      if (previous !== fingerprint) {
        chatValueFingerprintRef.current[key] = fingerprint;
        if (previous !== undefined) {
          toRestore.push(key);
        }
      }
    }

    if (toRestore.length === 0) return;
    setDismissedFromChat((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const key of toRestore) {
        if (next.delete(key)) changed = true;
      }
      return changed ? next : prev;
    });
  };

  const handleCollectedFieldsChange = (fields: Record<string, unknown>) => {
    setCollectedFields(fields);
    restoreDismissedForUpdatedChatValues(
      buildChatSource(fields, draftProfile),
    );
  };

  const chatSource = useMemo(
    () => buildChatSource(collectedFields, draftProfile),
    [collectedFields, draftProfile],
  );

  const highlightedFields = useMemo(
    () => getHighlightedProfileFields(draftProfile?.synthesis_notes),
    [draftProfile?.synthesis_notes],
  );

  const fromChatFields = useMemo(() => {
    const keys = getFromChatFieldKeys(chatSource);
    if (dismissedFromChat.size === 0) return keys;
    return new Set([...keys].filter((key) => !dismissedFromChat.has(key)));
  }, [chatSource, dismissedFromChat]);

  const formInitial = useMemo(() => {
    const fromChat = omitDismissedChatFields(
      draftProfile
        ? synthesizedProfileToUpsert(draftProfile)
        : collectedFieldsToUpsert(collectedFields),
      dismissedFromChat,
    );

    // For dismissed keys, force empty so useStateField clears the input.
    const cleared: BusinessProfileUpsert = { ...fromChat };
    for (const key of dismissedFromChat) {
      if (key === "prohibited_words" || key === "required_keywords") {
        cleared[key] = [];
      } else if (
        key === "business_name" ||
        key === "industry" ||
        key === "description" ||
        key === "target_audience" ||
        key === "brand_voice" ||
        key === "website_url"
      ) {
        cleared[key] = "";
      }
    }

    return mergeProfileSources(initialData, cleared);
  }, [collectedFields, dismissedFromChat, draftProfile, initialData]);

  const showReviewBanner = Boolean(draftProfile);

  const dismissFromChatField = (fieldKey: string) => {
    setDismissedFromChat((prev) => {
      if (prev.has(fieldKey)) return prev;
      const next = new Set(prev);
      next.add(fieldKey);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-text-primary">
          Build your business profile
        </p>
        <p className="mt-0.5 text-caption">
          Chat on the left — the form updates as answers are captured.
        </p>
      </div>

      {showReviewBanner && draftProfile && (
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 sm:px-5",
            forcedSynthesis
              ? "border-status-pending/40 bg-status-pending/10"
              : "border-status-approved/35 bg-status-approved/10",
          )}
        >
          <p
            className={cn(
              "text-sm font-medium",
              forcedSynthesis ? "text-status-pending" : "text-status-approved",
            )}
          >
            {forcedSynthesis
              ? "Draft ready — some fields need a pass"
              : "Draft profile ready — review the form, then save"}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Nothing is saved until you confirm on the form.
          </p>
        </div>
      )}

      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]">
        <OnboardingChatPanel
          workspaceId={workspaceId}
          className="h-[min(70vh,720px)] max-h-[min(70vh,720px)] w-full"
          onCollectedFieldsChange={handleCollectedFieldsChange}
          onComplete={(profile, forced) => {
            setDraftProfile(profile);
            setForcedSynthesis(forced);
            const nextFields = synthesizedProfileToUpsert(profile);
            setCollectedFields(nextFields);
            restoreDismissedForUpdatedChatValues(
              nextFields as Record<string, unknown>,
            );
          }}
        />

        <div className="flex h-[min(70vh,720px)] max-h-[min(70vh,720px)] min-h-0 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-base/30">
          <div className="shrink-0 border-b border-border-subtle px-4 py-3 sm:px-5">
            <p className="text-sm font-medium text-text-primary">
              {draftProfile ? "Review & save" : "Profile form"}
            </p>
            <p className="mt-0.5 text-caption">
              {draftProfile
                ? "Tweak the draft from chat, then continue."
                : "Fields marked ✨ from chat were filled by the conversation."}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <BusinessProfileForm
              initialData={formInitial}
              fromChatFields={fromChatFields}
              highlightedFields={
                draftProfile ? highlightedFields : undefined
              }
              synthesisNotes={draftProfile?.synthesis_notes}
              onDismissFromChatField={dismissFromChatField}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              submitLabel={
                draftProfile ? "Save profile & continue" : "Continue"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
