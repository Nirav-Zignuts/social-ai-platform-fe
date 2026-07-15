"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/shared/tag-input";
import { cn } from "@/lib/utils";
import type { BusinessProfile, BusinessProfileUpsert } from "@/lib/types";

interface BusinessProfileFormProps {
  initialData?: BusinessProfile | BusinessProfileUpsert | null;
  onSubmit: (data: BusinessProfileUpsert) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  /** Field keys to visually flag for review (from synthesis_notes). */
  highlightedFields?: Set<string>;
  /** Fields auto-filled from onboarding chat. */
  fromChatFields?: Set<string>;
  /** Called when the user clears a chat-filled field. */
  onDismissFromChatField?: (fieldKey: string) => void;
  synthesisNotes?: string | null;
  className?: string;
}

function useStateField(initial: string) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    setValue(initial);
  }, [initial]);
  return [value, setValue] as const;
}

function FieldLabel({
  htmlFor,
  children,
  fromChat,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  fromChat?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label htmlFor={htmlFor}>{children}</Label>
      {fromChat && (
        <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-accent">
          ✨ from chat
        </span>
      )}
    </div>
  );
}

function FieldShell({
  fieldKey,
  highlighted,
  fromChat,
  children,
}: {
  fieldKey: string;
  highlighted?: Set<string>;
  fromChat?: Set<string>;
  children: React.ReactNode;
}) {
  const needsReview = highlighted?.has(fieldKey);
  const filledFromChat = fromChat?.has(fieldKey);
  return (
    <div
      className={cn(
        "space-y-2 rounded-lg transition-colors",
        filledFromChat && "border-l-2 border-accent pl-3",
        needsReview &&
          "border border-status-pending/40 bg-status-pending/5 p-3",
        needsReview && filledFromChat && "border-l-2 border-l-accent",
      )}
    >
      {children}
      {needsReview && (
        <p className="text-[11px] text-status-pending">Needs a quick review</p>
      )}
    </div>
  );
}

export function BusinessProfileForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel = "Save",
  highlightedFields,
  fromChatFields,
  onDismissFromChatField,
  synthesisNotes,
  className,
}: BusinessProfileFormProps) {
  const [businessName, setBusinessName] = useStateField(
    initialData?.business_name ?? "",
  );
  const [industry, setIndustry] = useStateField(initialData?.industry ?? "");
  const [description, setDescription] = useStateField(
    initialData?.description ?? "",
  );
  const [targetAudience, setTargetAudience] = useStateField(
    initialData?.target_audience ?? "",
  );
  const [brandVoice, setBrandVoice] = useStateField(
    initialData?.brand_voice ?? "",
  );
  const [websiteUrl, setWebsiteUrl] = useStateField(
    initialData?.website_url ?? "",
  );
  const [prohibitedWords, setProhibitedWords] = useState(
    initialData?.prohibited_words ?? [],
  );
  const [requiredKeywords, setRequiredKeywords] = useState(
    initialData?.required_keywords ?? [],
  );

  useEffect(() => {
    setProhibitedWords(initialData?.prohibited_words ?? []);
    setRequiredKeywords(initialData?.required_keywords ?? []);
  }, [initialData]);

  const handleTextChange = (
    fieldKey: string,
    value: string,
    setter: (value: string) => void,
  ) => {
    setter(value);
    if (!value.trim()) {
      onDismissFromChatField?.(fieldKey);
    }
  };

  const handleTagsChange = (
    fieldKey: string,
    value: string[],
    setter: (value: string[]) => void,
  ) => {
    setter(value);
    if (value.length === 0) {
      onDismissFromChatField?.(fieldKey);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      business_name: businessName || undefined,
      industry: industry || undefined,
      description: description || undefined,
      target_audience: targetAudience || undefined,
      brand_voice: brandVoice || undefined,
      website_url: websiteUrl || undefined,
      prohibited_words: prohibitedWords.length ? prohibitedWords : undefined,
      required_keywords: requiredKeywords.length ? requiredKeywords : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {synthesisNotes && (
        <div className="rounded-xl border border-status-pending/35 bg-status-pending/10 px-4 py-3 text-sm text-text-secondary">
          <p className="font-medium text-status-pending">Review before saving</p>
          <p className="mt-1 leading-relaxed">{synthesisNotes}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <FieldShell
          fieldKey="business_name"
          highlighted={highlightedFields}
          fromChat={fromChatFields}
        >
          <FieldLabel
            htmlFor="business_name"
            fromChat={fromChatFields?.has("business_name")}
          >
            Business Name
          </FieldLabel>
          <Input
            id="business_name"
            value={businessName}
            onChange={(e) =>
              handleTextChange(
                "business_name",
                e.target.value,
                setBusinessName,
              )
            }
            required
          />
        </FieldShell>
        <FieldShell
          fieldKey="industry"
          highlighted={highlightedFields}
          fromChat={fromChatFields}
        >
          <FieldLabel
            htmlFor="industry"
            fromChat={fromChatFields?.has("industry")}
          >
            Industry
          </FieldLabel>
          <Input
            id="industry"
            value={industry}
            onChange={(e) =>
              handleTextChange("industry", e.target.value, setIndustry)
            }
          />
        </FieldShell>
      </div>
      <FieldShell
        fieldKey="description"
        highlighted={highlightedFields}
        fromChat={fromChatFields}
      >
        <FieldLabel
          htmlFor="description"
          fromChat={fromChatFields?.has("description")}
        >
          Description
        </FieldLabel>
        <Textarea
          id="description"
          value={description}
          onChange={(e) =>
            handleTextChange("description", e.target.value, setDescription)
          }
          rows={3}
        />
      </FieldShell>
      <FieldShell
        fieldKey="target_audience"
        highlighted={highlightedFields}
        fromChat={fromChatFields}
      >
        <FieldLabel
          htmlFor="target_audience"
          fromChat={fromChatFields?.has("target_audience")}
        >
          Target Audience
        </FieldLabel>
        <Textarea
          id="target_audience"
          value={targetAudience}
          onChange={(e) =>
            handleTextChange(
              "target_audience",
              e.target.value,
              setTargetAudience,
            )
          }
          rows={2}
        />
      </FieldShell>
      <FieldShell
        fieldKey="brand_voice"
        highlighted={highlightedFields}
        fromChat={fromChatFields}
      >
        <FieldLabel
          htmlFor="brand_voice"
          fromChat={fromChatFields?.has("brand_voice")}
        >
          Brand Voice
        </FieldLabel>
        <Textarea
          id="brand_voice"
          value={brandVoice}
          onChange={(e) =>
            handleTextChange("brand_voice", e.target.value, setBrandVoice)
          }
          rows={2}
        />
      </FieldShell>
      <FieldShell
        fieldKey="website_url"
        highlighted={highlightedFields}
        fromChat={fromChatFields}
      >
        <FieldLabel
          htmlFor="website_url"
          fromChat={fromChatFields?.has("website_url")}
        >
          Website URL
        </FieldLabel>
        <Input
          id="website_url"
          type="url"
          value={websiteUrl}
          onChange={(e) =>
            handleTextChange("website_url", e.target.value, setWebsiteUrl)
          }
          placeholder="https://"
        />
      </FieldShell>
      <FieldShell
        fieldKey="prohibited_words"
        highlighted={highlightedFields}
        fromChat={fromChatFields}
      >
        <FieldLabel fromChat={fromChatFields?.has("prohibited_words")}>
          Prohibited Words
        </FieldLabel>
        <TagInput
          value={prohibitedWords}
          onChange={(value) =>
            handleTagsChange("prohibited_words", value, setProhibitedWords)
          }
          placeholder="Add word and press Enter"
        />
      </FieldShell>
      <FieldShell
        fieldKey="required_keywords"
        highlighted={highlightedFields}
        fromChat={fromChatFields}
      >
        <FieldLabel fromChat={fromChatFields?.has("required_keywords")}>
          Required Keywords
        </FieldLabel>
        <TagInput
          value={requiredKeywords}
          onChange={(value) =>
            handleTagsChange("required_keywords", value, setRequiredKeywords)
          }
          placeholder="Add keyword and press Enter"
        />
      </FieldShell>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
