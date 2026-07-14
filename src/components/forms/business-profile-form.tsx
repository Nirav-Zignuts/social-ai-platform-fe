"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "@/components/shared/tag-input";
import type { BusinessProfile, BusinessProfileUpsert } from "@/lib/types";

interface BusinessProfileFormProps {
  initialData?: BusinessProfile | null;
  onSubmit: (data: BusinessProfileUpsert) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

function useStateField(initial: string) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    setValue(initial);
  }, [initial]);
  return [value, setValue] as const;
}

export function BusinessProfileForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel = "Save",
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name</Label>
          <Input
            id="business_name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="target_audience">Target Audience</Label>
        <Textarea
          id="target_audience"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="brand_voice">Brand Voice</Label>
        <Textarea
          id="brand_voice"
          value={brandVoice}
          onChange={(e) => setBrandVoice(e.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website_url">Website URL</Label>
        <Input
          id="website_url"
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://"
        />
      </div>
      <div className="space-y-2">
        <Label>Prohibited Words</Label>
        <TagInput
          value={prohibitedWords}
          onChange={setProhibitedWords}
          placeholder="Add word and press Enter"
        />
      </div>
      <div className="space-y-2">
        <Label>Required Keywords</Label>
        <TagInput
          value={requiredKeywords}
          onChange={setRequiredKeywords}
          placeholder="Add keyword and press Enter"
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
