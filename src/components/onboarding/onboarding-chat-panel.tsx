"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import {
  clearOnboardingChatSessionId,
  getStoredOnboardingChatSessionId,
  storeOnboardingChatSessionId,
} from "@/lib/onboarding-chat";
import type {
  OnboardingChatMessage,
  SynthesizedBusinessProfile,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LocalMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  quick_replies?: string[] | null;
};

interface OnboardingChatPanelProps {
  workspaceId: string;
  onComplete: (profile: SynthesizedBusinessProfile, forced: boolean) => void;
  onCollectedFieldsChange?: (fields: Record<string, unknown>) => void;
  className?: string;
}

function toLocalMessages(messages: OnboardingChatMessage[]): LocalMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role === "user" ? "user" : "assistant",
    content: m.content,
    quick_replies: m.quick_replies,
  }));
}

export function OnboardingChatPanel({
  workspaceId,
  onComplete,
  onCollectedFieldsChange,
  className,
}: OnboardingChatPanelProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [selectedReplies, setSelectedReplies] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [booting, setBooting] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const onCollectedRef = useRef(onCollectedFieldsChange);
  onCollectedRef.current = onCollectedFieldsChange;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, quickReplies, selectedReplies]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setBooting(true);
      try {
        const stored = getStoredOnboardingChatSessionId(workspaceId);
        if (stored) {
          try {
            const session = await api.onboardingChat.getSession(
              workspaceId,
              stored,
            );
            if (cancelled) return;
            if (session.status === "active") {
              setSessionId(session.session_id);
              setMessages(toLocalMessages(session.messages));
              onCollectedRef.current?.(session.collected_fields ?? {});
              const lastAssistant = [...session.messages]
                .reverse()
                .find((m) => m.role === "assistant");
              setQuickReplies(lastAssistant?.quick_replies ?? []);
              setSelectedReplies([]);
              setBooting(false);
              return;
            }
            clearOnboardingChatSessionId(workspaceId);
          } catch {
            clearOnboardingChatSessionId(workspaceId);
          }
        }

        const started = await api.onboardingChat.start(workspaceId);
        if (cancelled) return;
        storeOnboardingChatSessionId(workspaceId, started.session_id);
        setSessionId(started.session_id);
        setMessages([
          {
            id: `start-${started.session_id}`,
            role: "assistant",
            content: started.message,
            quick_replies: started.quick_replies,
          },
        ]);
        setQuickReplies(started.quick_replies ?? []);
        setSelectedReplies([]);
        onCollectedRef.current?.({});
      } catch (e) {
        if (!cancelled) {
          toast.error(
            e instanceof ApiError
              ? e.message
              : "Couldn’t start onboarding chat",
          );
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const toggleReply = (reply: string) => {
    setSelectedReplies((prev) =>
      prev.includes(reply)
        ? prev.filter((item) => item !== reply)
        : [...prev, reply],
    );
  };

  const composeOutgoing = () => {
    const typed = draft.trim();
    const fromChips = selectedReplies.join(", ");
    if (typed && fromChips) return `${fromChips}. ${typed}`;
    return typed || fromChips;
  };

  const sendContent = async (content?: string) => {
    const trimmed = (content ?? composeOutgoing()).trim();
    if (!trimmed || !sessionId || sending) return;

    setSending(true);
    setQuickReplies([]);
    setSelectedReplies([]);
    setDraft("");
    const userMsg: LocalMessage = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const turn = await api.onboardingChat.sendMessage(
        workspaceId,
        sessionId,
        trimmed,
      );
      setMessages((prev) => [
        ...prev,
        {
          id: `local-assistant-${Date.now()}`,
          role: "assistant",
          content: turn.message,
          quick_replies: turn.quick_replies,
        },
      ]);
      onCollectedRef.current?.(turn.collected_fields ?? {});
      setQuickReplies(turn.quick_replies ?? []);
      setSelectedReplies([]);

      if (turn.is_complete && turn.synthesized_profile) {
        onComplete(turn.synthesized_profile, turn.forced_synthesis);
      }
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      toast.error(
        e instanceof ApiError ? e.message : "Failed to send message",
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const canSend = Boolean(composeOutgoing()) && Boolean(sessionId) && !sending;

  if (booting) {
    return (
      <div
        className={cn(
          "flex h-full flex-col rounded-2xl border border-border-subtle bg-bg-base/40 p-4",
          className,
        )}
      >
        <Skeleton className="h-10 w-2/3 rounded-2xl" />
        <Skeleton className="mt-3 ml-auto h-10 w-1/2 rounded-2xl" />
        <Skeleton className="mt-3 h-10 w-3/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-base/40",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-border-subtle px-4 py-3 sm:px-5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">
            Profile setup chat
          </p>
          <p className="text-caption">
            Select one or more options, add text anytime, then send.
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-[85%]",
                message.role === "user"
                  ? "bg-accent text-white"
                  : "border border-border-subtle bg-bg-surface text-text-primary",
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-caption">
            <Loader2 className="size-3.5 animate-spin text-accent" />
            Drafting next question…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {quickReplies.length > 0 && (
        <div className="shrink-0 space-y-2 border-t border-border-subtle px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-text-secondary">
              Tap to select — you can pick several
            </p>
            {selectedReplies.length > 0 && (
              <p className="text-[11px] text-accent">
                {selectedReplies.length} selected
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply) => {
              const selected = selectedReplies.includes(reply);
              return (
                <button
                  key={reply}
                  type="button"
                  disabled={sending}
                  aria-pressed={selected}
                  onClick={() => toggleReply(reply)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-xs transition-colors disabled:opacity-50",
                    selected
                      ? "border-accent bg-accent/15 text-text-primary"
                      : "border-border-subtle bg-bg-surface text-text-primary hover:border-accent/50 hover:bg-bg-surface-hover",
                  )}
                >
                  {selected && <Check className="size-3 shrink-0" />}
                  {reply}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <form
        className="flex shrink-0 items-end gap-2 border-t border-border-subtle p-3 sm:p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void sendContent();
        }}
      >
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void sendContent();
            }
          }}
          rows={1}
          maxLength={4000}
          disabled={sending || !sessionId}
          placeholder={
            selectedReplies.length
              ? "Add a note (optional), then send…"
              : "Type your answer…"
          }
          className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-border-subtle bg-bg-surface px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-secondary focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-50"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          aria-label="Send message"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
