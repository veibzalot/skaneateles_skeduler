"use client";

import { useState, useTransition } from "react";
import { toggleConfirmedDay, deleteReservation } from "@/app/admin/dashboard/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDisplayDate, nightCount, parseDate, formatDate } from "@/lib/dates";
import type { Reservation, ConfirmedDay } from "@/db/schema";

interface Props {
  reservations: Reservation[];
  confirmedDays: ConfirmedDay[];
}

function getNights(startDate: string, endDate: string): string[] {
  const nights: string[] = [];
  const cur = parseDate(startDate);
  const end = parseDate(endDate);
  while (cur < end) {
    nights.push(formatDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return nights;
}

function reservationStatus(nights: string[], confirmed: Set<string>): "confirmed" | "partial" | "pending" {
  const count = nights.filter((n) => confirmed.has(n)).length;
  if (count === 0) return "pending";
  if (count === nights.length) return "confirmed";
  return "partial";
}

export default function ReservationList({ reservations, confirmedDays }: Props) {
  // Local optimistic state: resId -> Set<dateStr>
  const [confirmedMap, setConfirmedMap] = useState<Map<string, Set<string>>>(() => {
    const m = new Map<string, Set<string>>();
    for (const cd of confirmedDays) {
      if (!m.has(cd.reservationId)) m.set(cd.reservationId, new Set());
      m.get(cd.reservationId)!.add(cd.date);
    }
    return m;
  });
  const [, startTransition] = useTransition();

  function toggle(reservationId: string, date: string) {
    // Optimistic update
    setConfirmedMap((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(reservationId) ?? []);
      if (set.has(date)) set.delete(date);
      else set.add(date);
      next.set(reservationId, set);
      return next;
    });
    startTransition(() => {
      toggleConfirmedDay(reservationId, date);
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this reservation request?")) return;
    await deleteReservation(id);
  }

  // Sort: pending first, then partial, then confirmed
  const statusOrder = { pending: 0, partial: 1, confirmed: 2 };
  const sorted = [...reservations].sort((a, b) => {
    const aNights = getNights(a.startDate, a.endDate);
    const bNights = getNights(b.startDate, b.endDate);
    const aStatus = reservationStatus(aNights, confirmedMap.get(a.id) ?? new Set());
    const bStatus = reservationStatus(bNights, confirmedMap.get(b.id) ?? new Set());
    return statusOrder[aStatus] - statusOrder[bStatus] || a.startDate.localeCompare(b.startDate);
  });

  if (sorted.length === 0) {
    return <p className="text-stone-400 text-sm py-4">No reservation requests yet.</p>;
  }

  return (
    <div className="space-y-4">
      {sorted.map((res) => {
        const nights = getNights(res.startDate, res.endDate);
        const confirmed = confirmedMap.get(res.id) ?? new Set<string>();
        const status = reservationStatus(nights, confirmed);

        return (
          <div key={res.id} className="bg-white border border-stone-200 rounded-lg p-4 shadow-sm">
            {/* Header row */}
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <span className="font-semibold text-stone-800">{res.name}</span>
                {res.email && (
                  <span className="text-stone-400 text-xs ml-2">{res.email}</span>
                )}
                <div className="text-xs text-stone-500 mt-0.5">
                  {formatDisplayDate(res.startDate)} → {formatDisplayDate(res.endDate)} &nbsp;·&nbsp;{" "}
                  {nightCount(res.startDate, res.endDate)} nights &nbsp;·&nbsp; party of {res.partySize}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "text-xs",
                    status === "confirmed" && "bg-green-100 text-green-800 border-green-200",
                    status === "partial" && "bg-amber-100 text-amber-800 border-amber-200",
                    status === "pending" && "bg-stone-100 text-stone-600 border-stone-200"
                  )}
                  variant="outline"
                >
                  {status === "confirmed" ? "Confirmed" : status === "partial" ? "Partial" : "Pending"}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 px-2"
                  onClick={() => handleDelete(res.id)}
                >
                  Remove
                </Button>
              </div>
            </div>

            {/* Night-by-night confirm toggles */}
            <div className="flex flex-wrap gap-1.5">
              {nights.map((night) => {
                const isConfirmed = confirmed.has(night);
                const dayNum = Number(night.slice(8));
                const month = parseDate(night).toLocaleDateString("en-US", { month: "short" });
                return (
                  <button
                    key={night}
                    onClick={() => toggle(res.id, night)}
                    className={cn(
                      "text-xs px-2 py-1 rounded border font-medium transition-colors",
                      isConfirmed
                        ? "bg-green-500 border-green-500 text-white hover:bg-green-600"
                        : "bg-white border-stone-300 text-stone-500 hover:border-sky-400 hover:text-sky-600"
                    )}
                  >
                    {month} {dayNum}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
