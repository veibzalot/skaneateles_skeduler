"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitReservation } from "@/app/actions";
import { formatDisplayDate, nightCount } from "@/lib/dates";

interface Props {
  startDate: string;
  endDate: string;
  onClose: () => void;
}

export default function ReservationModal({ startDate, endDate, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const nights = nightCount(startDate, endDate);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await submitReservation(startDate, endDate, name, partySize, email || undefined);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {success ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🛶</div>
            <DialogHeader>
              <DialogTitle className="text-sky-700">Request Received!</DialogTitle>
              <DialogDescription className="mt-2">
                Your request for{" "}
                <strong>
                  {nights} night{nights !== 1 ? "s" : ""}
                </strong>{" "}
                ({formatDisplayDate(startDate)} → {formatDisplayDate(endDate)}) has been sent. Your
                host will confirm your dates.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={onClose} className="mt-6 bg-sky-600 hover:bg-sky-700 text-white">
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Request a Stay</DialogTitle>
              <DialogDescription>
                {formatDisplayDate(startDate)} → {formatDisplayDate(endDate)} &nbsp;·&nbsp;{" "}
                {nights} night{nights !== 1 ? "s" : ""}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-stone-700 block mb-1">Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 block mb-1">
                  Email <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 block mb-1">Party size *</label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !name}
                  className="flex-1 bg-sky-600 hover:bg-sky-700 text-white"
                >
                  {loading ? "Sending…" : "Request Stay"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
