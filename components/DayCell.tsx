import { cn } from "@/lib/utils";
import type { DayData } from "@/lib/types";

type Highlight = "start" | "end" | "in-range" | null;

interface Props {
  day: DayData;
  highlight: Highlight;
  onClick: () => void;
  onMouseEnter: () => void;
}

export default function DayCell({ day, highlight, onClick, onMouseEnter }: Props) {
  const { dateStr, effectiveCapacity, confirmedCount, names, isPast } = day;
  const dayNum = Number(dateStr.slice(8));
  const remaining = effectiveCapacity - confirmedCount;
  const isClosed = effectiveCapacity === 0;

  const confirmedNames = names.filter((n) => n.status === "confirmed");
  const pendingNames = names.filter((n) => n.status === "pending");

  return (
    <div
      onClick={!isPast && !isClosed ? onClick : undefined}
      onMouseEnter={!isPast ? onMouseEnter : undefined}
      className={cn(
        "min-h-[90px] p-1.5 rounded-lg border text-left text-xs transition-colors select-none",
        isPast && "opacity-40 cursor-default bg-white border-stone-100",
        isClosed && !isPast && "bg-red-50 border-red-200 cursor-default",
        !isPast && !isClosed && "cursor-pointer border-stone-200 bg-white hover:border-sky-300",
        highlight === "start" && "bg-sky-600 border-sky-600 text-white",
        highlight === "end" && "bg-sky-600 border-sky-600 text-white",
        highlight === "in-range" && "bg-sky-100 border-sky-200"
      )}
    >
      {/* Date number + capacity */}
      <div className="flex items-start justify-between mb-1">
        <span
          className={cn(
            "font-semibold text-sm leading-none",
            highlight === "start" || highlight === "end" ? "text-white" : "text-stone-700"
          )}
        >
          {dayNum}
        </span>
        {!isClosed && !isPast && (
          <span
            className={cn(
              "text-[10px] leading-none font-medium",
              highlight ? "text-sky-100" : remaining <= 2 ? "text-amber-600" : "text-stone-400"
            )}
          >
            {remaining}/{effectiveCapacity}
          </span>
        )}
        {isClosed && !isPast && (
          <span className="text-[10px] leading-none font-medium text-red-400">closed</span>
        )}
      </div>

      {/* Names */}
      <div className="space-y-0.5">
        {confirmedNames.map((n, i) => (
          <div
            key={i}
            className={cn(
              "truncate rounded px-1 py-0.5 font-medium",
              highlight ? "bg-sky-500 text-white" : "bg-sky-100 text-sky-800"
            )}
          >
            {n.name} {n.partySize > 1 ? `(${n.partySize})` : ""}
          </div>
        ))}
        {pendingNames.map((n, i) => (
          <div
            key={i}
            className={cn(
              "truncate rounded px-1 py-0.5",
              highlight ? "bg-sky-400/50 text-white" : "bg-stone-100 text-stone-500"
            )}
          >
            {n.name} {n.partySize > 1 ? `(${n.partySize})` : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
