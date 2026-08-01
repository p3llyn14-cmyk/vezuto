"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDictionary } from "@/i18n";
import { formatDateTime } from "@/lib/format";
import type { Database } from "@/types/database.types";
import { sendMessageAction, type ChatActionState } from "../actions";

type Message = Database["public"]["Tables"]["messages"]["Row"];

interface Props {
  orderId: string;
  messages: Message[];
  currentProfileId: string;
  participantNames: Record<string, string>;
}

export function OrderChat({
  orderId,
  messages,
  currentProfileId,
  participantNames,
}: Props) {
  const dict = getDictionary().chat;
  const [state, action, pending] = useActionState<ChatActionState, FormData>(
    sendMessageAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{dict.title}</h3>

      {messages.length === 0 ? (
        <p className="text-muted-foreground text-sm">{dict.empty}</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {messages.map((msg) => {
            const isMine = msg.sender_profile_id === currentProfileId;
            const isSystem = msg.message_type === "system";
            const senderName = participantNames[msg.sender_profile_id] ?? "";

            if (isSystem) {
              return (
                <li key={msg.id} className="text-muted-foreground text-center text-xs">
                  {msg.content}
                </li>
              );
            }

            return (
              <li
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {!isMine && (
                    <p className="mb-0.5 text-xs font-medium opacity-70">{senderName}</p>
                  )}
                  <p>{msg.content}</p>
                  <p className="mt-1 text-[10px] tabular-nums opacity-60">
                    {formatDateTime(msg.created_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form
        ref={formRef}
        action={async (formData) => {
          await action(formData);
          formRef.current?.reset();
        }}
        className="flex gap-2"
      >
        <input type="hidden" name="orderId" value={orderId} />
        <Input name="content" placeholder={dict.placeholder} maxLength={2000} required />
        <Button type="submit" size="sm" disabled={pending}>
          {dict.send}
        </Button>
      </form>
      {state?.message && <p className="text-destructive text-xs">{state.message}</p>}
    </div>
  );
}
