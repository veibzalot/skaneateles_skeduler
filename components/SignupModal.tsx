"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addSignup, SignupResult } from "@/app/actions";

interface Props {
  dateId: string;
  dateLabel: string;
  spotsLeft: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SignupModal({ dateId, dateLabel, spotsLeft, open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SignupResult | null>(null);

  const willBeWaitlisted = spotsLeft < partySize;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await addSignup(dateId, name, partySize, email || undefined);
    setResult(res);
    setLoading(false);
  }

  function handleClose(open: boolean) {
    if (!open) {
      setName("");
      setPartySize(1);
      setEmail("");
      setResult(null);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {result?.success ? (
          <div className="py-4 text-center space-y-3">
            <div className="text-4xl">{result.status === "confirmed" ? "🎉" : "📋"}</div>
            <DialogHeader>
              <DialogTitle className="text-lake-dark">
                {result.status === "confirmed" ? "You're in!" : "You're on the waitlist!"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-stone-600">
              {result.status === "confirmed"
                ? `See you at the lake on ${dateLabel}! We've got you down for ${partySize} ${partySize === 1 ? "person" : "people"}.`
                : `You're #${result.position} on the waitlist for ${dateLabel}. We'll fill you in if a spot opens up!`}
            </p>
            <Button className="mt-2 bg-lake hover:bg-lake-dark" onClick={() => handleClose(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lake-dark">Sign up for {dateLabel}</DialogTitle>
              <DialogDescription>
                {spotsLeft > 0
                  ? `${spotsLeft} ${spotsLeft === 1 ? "spot" : "spots"} remaining.`
                  : "This date is full — you'll be added to the waitlist."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">Your name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  maxLength={80}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">Party size *</label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={partySize}
                  onChange={(e) => setPartySize(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                />
                {willBeWaitlisted && spotsLeft > 0 && (
                  <p className="text-xs text-amber-600">
                    Only {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left — your group will be waitlisted.
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">Email <span className="text-stone-400">(optional)</span></label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  maxLength={120}
                />
              </div>
              {result && !result.success && (
                <p className="text-sm text-red-600">{result.error}</p>
              )}
              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleClose(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 bg-lake hover:bg-lake-dark"
                >
                  {loading ? "Saving…" : willBeWaitlisted || spotsLeft === 0 ? "Join Waitlist" : "Sign Me Up!"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
