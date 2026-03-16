import { db } from "@/db";
import { dates, signups } from "@/db/schema";
import { asc, inArray, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AddDateForm from "@/components/admin/AddDateForm";
import DateManager from "@/components/admin/DateManager";
import SignupTable from "@/components/admin/SignupTable";
import Link from "next/link";
import { clearAdminCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

export const revalidate = 0;

async function handleLogout() {
  "use server";
  await clearAdminCookie();
  redirect("/admin");
}

export default async function AdminDashboard() {
  const allDates = await db.select().from(dates).orderBy(asc(dates.date));

  const dateIds = allDates.map((d) => d.id);

  const allSignups = dateIds.length
    ? await db.select().from(signups).where(inArray(signups.dateId, dateIds)).orderBy(asc(signups.dateId), asc(signups.status), asc(signups.position))
    : [];

  // Count confirmed people and waitlist entries per date
  const confirmedCountByDate = new Map<string, number>();
  const waitlistCountByDate = new Map<string, number>();
  for (const s of allSignups) {
    if (s.status === "confirmed") {
      confirmedCountByDate.set(s.dateId, (confirmedCountByDate.get(s.dateId) ?? 0) + s.partySize);
    } else {
      waitlistCountByDate.set(s.dateId, (waitlistCountByDate.get(s.dateId) ?? 0) + 1);
    }
  }

  const datesWithCounts = allDates.map((d) => ({
    ...d,
    confirmedCount: confirmedCountByDate.get(d.id) ?? 0,
    waitlistCount: waitlistCountByDate.get(d.id) ?? 0,
  }));

  const totalConfirmed = allSignups.filter((s) => s.status === "confirmed").reduce((sum, s) => sum + s.partySize, 0);
  const totalWaitlisted = allSignups.filter((s) => s.status === "waitlisted").length;

  return (
    <div className="min-h-screen bg-sky-50">
      <header className="bg-lake text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sky-100 text-sm mt-0.5">Skaneateles Lake House</p>
          </div>
          <div className="flex gap-3 items-center">
            <Link
              href="/api/admin/export"
              className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md border border-white/20 transition-colors"
            >
              Export CSV
            </Link>
            <Link href="/" className="text-sm text-sky-200 hover:text-white transition-colors">
              View Public →
            </Link>
            <form action={handleLogout}>
              <button type="submit" className="text-sm text-sky-200 hover:text-white transition-colors">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-stone-200">
            <CardContent className="pt-5">
              <p className="text-sm text-stone-500">Available Dates</p>
              <p className="text-3xl font-bold text-lake-dark mt-1">{allDates.length}</p>
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardContent className="pt-5">
              <p className="text-sm text-stone-500">Confirmed People</p>
              <p className="text-3xl font-bold text-green-700 mt-1">{totalConfirmed}</p>
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardContent className="pt-5">
              <p className="text-sm text-stone-500">On Waitlist</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{totalWaitlisted}</p>
            </CardContent>
          </Card>
        </div>

        {/* Add date */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-lake-dark text-lg">Add a Date</CardTitle>
          </CardHeader>
          <CardContent>
            <AddDateForm />
          </CardContent>
        </Card>

        {/* Date list */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-lake-dark text-lg">Manage Dates</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <DateManager dates={datesWithCounts} />
          </CardContent>
        </Card>

        {/* All signups */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-lake-dark text-lg">All Signups</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <SignupTable dates={allDates} signups={allSignups} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
