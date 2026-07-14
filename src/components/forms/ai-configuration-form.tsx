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
import type { AIConfiguration, AIConfigurationUpsert } from "@/lib/types";

const CONTENT_STYLES = [
  "professional",
  "casual",
  "playful",
  "educational",
  "inspirational",
];
const CAPTION_LENGTHS = ["short", "medium", "long"];
const EMOJI_USAGE = ["none", "minimal", "moderate", "heavy"];
const CTA_STYLES = ["soft", "direct", "question", "link"];

interface AIConfigurationFormProps {
  initialData?: AIConfiguration | null;
  onSubmit: (data: AIConfigurationUpsert) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function AIConfigurationForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel = "Save",
}: AIConfigurationFormProps) {
  const [contentStyle, setContentStyle] = useState(
    initialData?.content_style ?? "professional",
  );
  const [captionLength, setCaptionLength] = useState(
    initialData?.caption_length ?? "medium",
  );
  const [hashtagCount, setHashtagCount] = useState(
    String(initialData?.hashtag_count ?? 8),
  );
  const [emojiUsage, setEmojiUsage] = useState(
    initialData?.emoji_usage ?? "moderate",
  );
  const [ctaStyle, setCtaStyle] = useState(initialData?.cta_style ?? "soft");
  const [customInstructions, setCustomInstructions] = useState(
    initialData?.custom_instructions ?? "",
  );

  useEffect(() => {
    if (initialData) {
      setContentStyle(initialData.content_style ?? "professional");
      setCaptionLength(initialData.caption_length ?? "medium");
      setHashtagCount(String(initialData.hashtag_count ?? 8));
      setEmojiUsage(initialData.emoji_usage ?? "moderate");
      setCtaStyle(initialData.cta_style ?? "soft");
      setCustomInstructions(initialData.custom_instructions ?? "");
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      content_style: contentStyle,
      caption_length: captionLength,
      hashtag_count: Number(hashtagCount),
      emoji_usage: emojiUsage,
      cta_style: ctaStyle,
      custom_instructions: customInstructions || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Content Style</Label>
          <Select
            value={contentStyle}
            onValueChange={(v) => v && setContentStyle(v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_STYLES.map((style) => (
                <SelectItem key={style} value={style}>
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Caption Length</Label>
          <Select
            value={captionLength}
            onValueChange={(v) => v && setCaptionLength(v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CAPTION_LENGTHS.map((length) => (
                <SelectItem key={length} value={length}>
                  {length.charAt(0).toUpperCase() + length.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hashtag_count">Hashtag Count</Label>
          <Input
            id="hashtag_count"
            type="number"
            min={0}
            max={30}
            value={hashtagCount}
            onChange={(e) => setHashtagCount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Emoji Usage</Label>
          <Select
            value={emojiUsage}
            onValueChange={(v) => v && setEmojiUsage(v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EMOJI_USAGE.map((usage) => (
                <SelectItem key={usage} value={usage}>
                  {usage.charAt(0).toUpperCase() + usage.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>CTA Style</Label>
          <Select value={ctaStyle} onValueChange={(v) => v && setCtaStyle(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CTA_STYLES.map((style) => (
                <SelectItem key={style} value={style}>
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="custom_instructions">Custom Instructions</Label>
        <Textarea
          id="custom_instructions"
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          rows={4}
          placeholder="Any additional instructions for the AI..."
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
