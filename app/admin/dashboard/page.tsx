import { db } from "@/db";
import { capacityOverrides, reservations, confirmedDays } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReservationList from "@/components/admin/ReservationList";
import CapacityOverrideForm from "@/components/admin/CapacityOverrideForm";
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
  const allReservations = await db.select().from(reservations);
  const allOverrides = await db.select().from(capacityOverrides);

  const resIds = allReservations.map((r) => r.id);
  const allConfirmedDays =
    resIds.length > 0
      ? await db.select().from(confirmedDays).where(inArray(confirmedDays.reservationId, resIds))
      : [];

  const pendingCount = allReservations.filter((r) => {
    const confirmed = new Set(allConfirmedDays.filter((cd) => cd.reservationId === r.id).map((cd) => cd.date));
    return confirmed.size === 0;
  }).length;

  return (
    <div className="min-h-screen bg-sky-50">
      <header className="bg-sky-700 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sky-200 text-sm mt-0.5">Skaneateles Lake House</p>
          </div>
          <div className="flex gap-4 items-center">
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

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-stone-200">
            <CardContent className="pt-5">
              <p className="text-sm text-stone-500">Total Requests</p>
              <p className="text-3xl font-bold text-stone-800 mt-1">{allReservations.length}</p>
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardContent className="pt-5">
              <p className="text-sm text-stone-500">Pending (unconfirmed)</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardContent className="pt-5">
              <p className="text-sm text-stone-500">Capacity Overrides</p>
              <p className="text-3xl font-bold text-sky-700 mt-1">{allOverrides.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Reservation requests */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-sky-800 text-lg">Reservation Requests</CardTitle>
            <p className="text-sm text-stone-500">
              Click individual night buttons to confirm or unconfirm them. Green = confirmed.
            </p>
          </CardHeader>
          <CardContent>
            <ReservationList reservations={allReservations} confirmedDays={allConfirmedDays} />
          </CardContent>
        </Card>

        {/* Capacity overrides */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-sky-800 text-lg">Capacity Overrides</CardTitle>
            <p className="text-sm text-stone-500">
              Reduce or close specific dates. All other dates default to 12 slots.
            </p>
          </CardHeader>
          <CardContent>
            <CapacityOverrideForm overrides={allOverrides} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
