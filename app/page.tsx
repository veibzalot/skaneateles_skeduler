import { db } from "@/db";
import { dates, signups } from "@/db/schema";
import { eq, inArray, asc } from "drizzle-orm";
import DateCard from "@/components/DateCard";

export const revalidate = 0; // always fresh

export default async function Home() {
  const allDates = await db
    .select()
    .from(dates)
    .where(eq(dates.isVisible, true))
    .orderBy(asc(dates.date));

  const allSignups = allDates.length
    ? await db
        .select()
        .from(signups)
        .where(inArray(signups.dateId, allDates.map((d) => d.id)))
        .orderBy(asc(signups.position))
    : [];

  // Group signups by dateId
  const signupsByDate = new Map<string, { confirmed: typeof allSignups; waitlisted: typeof allSignups }>();
  for (const d of allDates) {
    signupsByDate.set(d.id, { confirmed: [], waitlisted: [] });
  }
  for (const s of allSignups) {
    const group = signupsByDate.get(s.dateId);
    if (!group) continue;
    if (s.status === "confirmed") group.confirmed.push(s);
    else group.waitlisted.push(s);
  }

  return (
    <div className="min-h-screen bg-sky-50">
      {/* Header */}
      <header className="bg-lake text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold tracking-tight">Skaneateles Lake House</h1>
          <p className="mt-1 text-sky-100 text-sm">Pick your weekend and sign up below — spots are first-come, first-served.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {allDates.length === 0 ? (
          <div className="text-center py-24 text-stone-400">
            <p className="text-5xl mb-4">🚤</p>
            <p className="text-lg font-medium">No dates available yet.</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {allDates.map((d) => {
              const { confirmed, waitlisted } = signupsByDate.get(d.id) ?? { confirmed: [], waitlisted: [] };
              return (
                <DateCard key={d.id} date={d} confirmed={confirmed} waitlisted={waitlisted} />
              );
            })}
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-stone-400 py-8">
        Questions? Reach out to your host.
      </footer>
    </div>
  );
}
