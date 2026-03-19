"use client";

import { useState } from "react";
import DayCell from "./DayCell";
import ReservationModal from "./ReservationModal";
import type { MonthData, DayData } from "@/lib/types";

interface Props {
  months: MonthData[];
  today: string;
}

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarGrid({ months, today }: Props) {
  const [startDate, setStartDate] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function getHighlight(dateStr: string): "start" | "end" | "in-range" | null {
    if (!startDate) return null;
    // If modal is open, show the committed range
    const effectiveEnd = modalOpen ? endDate : hoverDate && hoverDate > startDate ? hoverDate : endDate;
    if (dateStr === startDate) return "start";
    if (effectiveEnd && dateStr === effectiveEnd) return "end";
    if (effectiveEnd && dateStr > startDate && dateStr < effectiveEnd) return "in-range";
    return null;
  }

  function handleDayClick(dateStr: string) {
    if (!startDate || dateStr <= startDate) {
      // First click (or clicking before/on existing start — reset)
      setStartDate(dateStr);
      setEndDate(null);
    } else {
      // Second click — set end and open modal
      setEndDate(dateStr);
      setModalOpen(true);
    }
  }

  function handleClose() {
    setModalOpen(false);
    setStartDate(null);
    setEndDate(null);
    setHoverDate(null);
  }

  const prompt = !startDate
    ? "Click a check-in date to begin."
    : `Check-in: ${startDate} — now click your checkout date.`;

  return (
    <div>
      <p className="text-center text-sm text-stone-500 mb-6 h-5">{prompt}</p>

      <div className="space-y-10">
        {months.map((month) => (
          <div key={month.key}>
            <h2 className="text-lg font-semibold text-sky-800 mb-3">{month.label}</h2>

            {/* Day-of-week header */}
            <div className="grid grid-cols-7 mb-1">
              {DOW_LABELS.map((d) => (
                <div key={d} className="text-center text-[11px] font-medium text-stone-400 uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1">
              {month.days.map((day, idx) =>
                day === null ? (
                  <div key={`pad-${idx}`} />
                ) : (
                  <DayCell
                    key={day.dateStr}
                    day={day}
                    highlight={getHighlight(day.dateStr)}
                    onClick={() => handleDayClick(day.dateStr)}
                    onMouseEnter={() => !day.isPast && setHoverDate(day.dateStr)}
                  />
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {modalOpen && startDate && endDate && (
        <ReservationModal startDate={startDate} endDate={endDate} onClose={handleClose} />
      )}
    </div>
  );
}
