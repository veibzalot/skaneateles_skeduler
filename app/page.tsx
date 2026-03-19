import { db } from "@/db";
import { capacityOverrides, reservations, confirmedDays } from "@/db/schema";
import { and, lte, gt, inArray } from "drizzle-orm";
import { DEFAULT_CAPACITY, MONTHS_AHEAD } from "@/lib/constants";
import {
  formatDate,
  todayStr,
  startOfMonth,
  endOfMonth,
  addMonths,
  formatMonthLabel,
} from "@/lib/dates";
import CalendarGrid from "@/components/CalendarGrid";
import type { MonthData, DayData } from "@/lib/types";

export const revalidate = 0;

export default async function HomePage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = todayStr();

  const rangeStart = startOfMonth(today);
  const rangeEnd = endOfMonth(addMonths(today, MONTHS_AHEAD - 1));
  const rangeStartStr = formatDate(rangeStart);
  const rangeEndStr = formatDate(rangeEnd);

  // Fetch capacity overrides in range
  const overrides = await db
    .select()
    .from(capacityOverrides)
    .where(and(lte(capacityOverrides.date, rangeEndStr), gt(capacityOverrides.date, rangeStartStr)));
  const overrideMap = new Map(overrides.map((o) => [o.date, o.capacity]));

  // Fetch reservations overlapping the range: startDate <= rangeEnd AND endDate > rangeStart
  const allReservations = await db
    .select()
    .from(reservations)
    .where(and(lte(reservations.startDate, rangeEndStr), gt(reservations.endDate, rangeStartStr)));

  // Fetch confirmed days for those reservations
  const resIds = allReservations.map((r) => r.id);
  const allConfirmedDays =
    resIds.length > 0
      ? await db.select().from(confirmedDays).where(inArray(confirmedDays.reservationId, resIds))
      : [];

  // Build lookup: reservationId -> Set<dateStr>
  const confirmedByRes = new Map<string, Set<string>>();
  for (const cd of allConfirmedDays) {
    if (!confirmedByRes.has(cd.reservationId)) confirmedByRes.set(cd.reservationId, new Set());
    confirmedByRes.get(cd.reservationId)!.add(cd.date);
  }

  // Build month data
  const months: MonthData[] = [];
  for (let i = 0; i < MONTHS_AHEAD; i++) {
    const monthStart = addMonths(rangeStart, i);
    const monthEnd = endOfMonth(monthStart);
    const days: (DayData | null)[] = [];

    // Leading padding (Sunday = 0)
    const firstDOW = monthStart.getDay();
    for (let p = 0; p < firstDOW; p++) days.push(null);

    const cur = new Date(monthStart);
    while (cur <= monthEnd) {
      const dateStr = formatDate(cur);

      const dayReservations = allReservations.filter(
        (r) => r.startDate <= dateStr && r.endDate > dateStr
      );

      const names = dayReservations.map((r) => ({
        name: r.name,
        partySize: r.partySize,
        status: confirmedByRes.get(r.id)?.has(dateStr)
          ? ("confirmed" as const)
          : ("pending" as const),
      }));

      const confirmedCount = names
        .filter((n) => n.status === "confirmed")
        .reduce((sum, n) => sum + n.partySize, 0);

      days.push({
        dateStr,
        effectiveCapacity: overrideMap.get(dateStr) ?? DEFAULT_CAPACITY,
        confirmedCount,
        names,
        isPast: dateStr < todayString,
      });

      cur.setDate(cur.getDate() + 1);
    }

    months.push({
      key: formatDate(monthStart).slice(0, 7),
      label: formatMonthLabel(monthStart),
      days,
    });
  }

  return (
    <main className="min-h-screen bg-sky-50">
      <header className="bg-sky-700 text-white py-6 px-4 text-center shadow-md">
        <h1 className="text-3xl font-bold tracking-tight">Skaneateles Lake House</h1>
        <p className="mt-1 text-sky-200 text-sm">
          Click a check-in date, then a checkout date to request your stay.
        </p>
      </header>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <CalendarGrid months={months} today={todayString} />
      </div>
      <footer className="text-center text-xs text-stone-400 pb-8">
        Questions? Reach out to your host.
      </footer>
    </main>
  );
}
