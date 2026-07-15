"use client";

import { useMemo, useRef, useState } from "react";
import { MessageSquareText, NotebookPen, Sparkles } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProfileSetupMode = "choose" | "manual" | "chat";

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
  const hasExistingProfile = Boolean(
    initialData?.business_name || initialData?.description,
  );
  const [mode, setMode] = useState<ProfileSetupMode>(
    hasExistingProfile ? "manual" : "choose",
  );
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
  const chatActive = mode === "chat";

  const dismissFromChatField = (fieldKey: string) => {
    setDismissedFromChat((prev) => {
      if (prev.has(fieldKey)) return prev;
      const next = new Set(prev);
      next.add(fieldKey);
      return next;
    });
  };

  if (mode === "choose") {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-text-primary">
            How do you want to build your profile?
          </p>
          <p className="mt-0.5 text-caption">
            Choose once — chat APIs only start if you pick the AI option.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("chat")}
            className="group rounded-2xl border border-border-subtle bg-bg-base/40 p-5 text-left transition-colors hover:border-accent/50 hover:bg-bg-surface"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <Sparkles className="size-5" />
            </span>
            <p className="mt-4 text-sm font-medium text-text-primary">
              Talk it through with AI
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
              Answer a short chat. We draft your business profile — you review
              before saving.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
              <MessageSquareText className="size-3.5" />
              Start AI chat
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode("manual")}
            className="group rounded-2xl border border-border-subtle bg-bg-base/40 p-5 text-left transition-colors hover:border-accent/50 hover:bg-bg-surface"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-bg-surface-hover text-text-secondary group-hover:text-text-primary">
              <NotebookPen className="size-5" />
            </span>
            <p className="mt-4 text-sm font-medium text-text-primary">
              Fill the form myself
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
              Enter business name, audience, voice, and keywords directly — no
              chat session started.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary group-hover:text-text-primary">
              Open profile form
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">
            Build your business profile
          </p>
          <p className="mt-0.5 text-caption">
            {chatActive
              ? "Chat on the left — the form updates as answers are captured."
              : "Fill the form, or switch to AI chat if you prefer."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === "manual" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setMode("chat")}
            >
              <Sparkles className="size-3.5" />
              Switch to AI chat
            </Button>
          )}
          {mode === "chat" && !draftProfile && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setMode("manual")}
            >
              <NotebookPen className="size-3.5" />
              Use form only
            </Button>
          )}
          {!draftProfile && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMode("choose")}
            >
              Change preference
            </Button>
          )}
        </div>
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

      <div
        className={cn(
          "grid items-stretch gap-5",
          chatActive &&
            "lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]",
        )}
      >
        {chatActive && (
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
        )}

        <div
          className={cn(
            "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-base/30",
            chatActive
              ? "h-[min(70vh,720px)] max-h-[min(70vh,720px)]"
              : "min-h-0",
          )}
        >
          <div className="shrink-0 border-b border-border-subtle px-4 py-3 sm:px-5">
            <p className="text-sm font-medium text-text-primary">
              {draftProfile ? "Review & save" : "Profile form"}
            </p>
            <p className="mt-0.5 text-caption">
              {draftProfile
                ? "Tweak the draft from chat, then continue."
                : chatActive
                  ? "Fields marked ✨ from chat were filled by the conversation."
                  : "Complete the fields below, then continue."}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <BusinessProfileForm
              initialData={formInitial}
              fromChatFields={chatActive ? fromChatFields : undefined}
              highlightedFields={
                draftProfile ? highlightedFields : undefined
              }
              synthesisNotes={draftProfile?.synthesis_notes}
              onDismissFromChatField={
                chatActive ? dismissFromChatField : undefined
              }
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
