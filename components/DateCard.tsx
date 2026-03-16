"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SignupModal from "@/components/SignupModal";
import { DateRow, SignupRow } from "@/db/schema";

interface Props {
  date: DateRow;
  confirmed: SignupRow[];
  waitlisted: SignupRow[];
}

function formatDate(dateStr: string) {
  // dateStr is "YYYY-MM-DD"
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function DateCard({ date, confirmed, waitlisted }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const confirmedPeople = confirmed.reduce((sum, s) => sum + s.partySize, 0);
  const spotsLeft = Math.max(0, date.capacity - confirmedPeople);
  const isFull = spotsLeft === 0;
  const fillPct = Math.min(100, Math.round((confirmedPeople / date.capacity) * 100));

  const formattedDate = formatDate(date.date);

  return (
    <>
      <Card className="border-stone-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-lake-dark text-lg leading-tight">{formattedDate}</CardTitle>
              {date.label && <p className="text-sm text-stone-500 mt-0.5">{date.label}</p>}
            </div>
            {isFull ? (
              <Badge variant="secondary" className="shrink-0 bg-amber-100 text-amber-700 border-amber-200">
                Full
              </Badge>
            ) : (
              <Badge variant="secondary" className="shrink-0 bg-green-100 text-green-700 border-green-200">
                {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Capacity bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-stone-500">
              <span>{confirmedPeople} / {date.capacity} people</span>
              <span>{fillPct}% full</span>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${fillPct}%`,
                  backgroundColor: fillPct >= 100 ? "#d97706" : fillPct >= 75 ? "#f59e0b" : "#0ea5e9",
                }}
              />
            </div>
          </div>

          {/* Confirmed list */}
          {confirmed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Coming</p>
              <ul className="space-y-1">
                {confirmed.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-sm text-stone-700">
                    <span className="text-lake">✓</span>
                    <span>{s.name}</span>
                    {s.partySize > 1 && (
                      <span className="text-stone-400 text-xs">+{s.partySize - 1}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Waitlist */}
          {waitlisted.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                Waitlist ({waitlisted.length})
              </p>
              <ul className="space-y-1">
                {waitlisted.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-sm text-stone-400">
                    <span>#{s.position}</span>
                    <span>{s.name}</span>
                    {s.partySize > 1 && (
                      <span className="text-xs">+{s.partySize - 1}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            onClick={() => setModalOpen(true)}
            className="w-full bg-lake hover:bg-lake-dark text-white"
            variant="default"
          >
            {isFull ? "Join Waitlist" : "Sign Me Up!"}
          </Button>
        </CardContent>
      </Card>

      <SignupModal
        dateId={date.id}
        dateLabel={formattedDate}
        spotsLeft={spotsLeft}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
