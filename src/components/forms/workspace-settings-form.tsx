"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Workspace, WorkspaceUpdate } from "@/lib/types";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
];

interface WorkspaceSettingsFormProps {
  initialData?: Workspace | null;
  onSubmit: (data: WorkspaceUpdate) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  showName?: boolean;
}

export function WorkspaceSettingsForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel = "Save",
  showName = true,
}: WorkspaceSettingsFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [timezone, setTimezone] = useState(initialData?.timezone ?? "UTC");
  const [preferredPostTime, setPreferredPostTime] = useState(
    initialData?.preferred_post_time?.slice(0, 5) ?? "09:00",
  );
  const [requireHumanApproval, setRequireHumanApproval] = useState(
    initialData?.require_human_approval ?? true,
  );

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setTimezone(initialData.timezone);
      setPreferredPostTime(
        initialData.preferred_post_time?.slice(0, 5) ?? "09:00",
      );
      setRequireHumanApproval(initialData.require_human_approval);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...(showName ? { name } : {}),
      timezone,
      preferred_post_time: `${preferredPostTime}:00`,
      require_human_approval: requireHumanApproval,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showName && (
        <div className="space-y-2">
          <Label htmlFor="name">Workspace Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Leafling NYC"
            required
          />
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Timezone</Label>
          <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferred_post_time">Preferred Post Time</Label>
          <Input
            id="preferred_post_time"
            type="time"
            value={preferredPostTime}
            onChange={(e) => setPreferredPostTime(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="require_human_approval"
          type="checkbox"
          checked={requireHumanApproval}
          onChange={(e) => setRequireHumanApproval(e.target.checked)}
          className="h-4 w-4 rounded border"
        />
        <Label htmlFor="require_human_approval">
          Require human approval before publishing
        </Label>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
