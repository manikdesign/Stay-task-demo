"use client";

import { useActionState, useTransition } from "react";
import { createEvent } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";

type State = { error?: string; eventId?: string } | undefined;

export default function NewEventPage() {
  const router = useRouter();
  const [state, action, isPending] = useActionState<State, FormData>(
    async (prev, formData) => {
      const result = await createEvent(formData);
      if (result?.eventId) {
        router.push(`/events/${result.eventId}`);
      }
      return result as State;
    },
    undefined
  );

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-card">
        <Link
          href="/events"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="w-3 h-3" />
          Back to events
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">Create new event</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Set up the basic details for your event
        </p>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-xl">
          {state?.error && (
            <div className="flex items-start gap-2.5 rounded-lg bg-destructive/8 border border-destructive/20 px-3.5 py-3 text-sm text-destructive mb-6">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={action} className="space-y-5">
            {/* Event name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Event name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                name="name"
                placeholder="Sharma-Patel Wedding"
                required
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                e.g. Wedding, Corporate offsite, Conference
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Optional notes about this event…"
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Venue */}
            <div className="space-y-1.5">
              <Label htmlFor="venue">Venue / Location</Label>
              <Input
                id="venue"
                name="venue"
                placeholder="The Leela Palace, Mumbai"
                className="h-10"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="checkInDate">
                  Check-in date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="checkInDate"
                  name="checkInDate"
                  type="date"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="checkOutDate">
                  Check-out date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="checkOutDate"
                  name="checkOutDate"
                  type="date"
                  required
                  className="h-10"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isPending ? "Creating…" : "Create event"}
              </Button>
              <ButtonLink variant="ghost" href="/events">Cancel</ButtonLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
