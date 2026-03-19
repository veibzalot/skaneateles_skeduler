"use server";

import { db } from "@/db";
import { capacityOverrides, reservations, confirmedDays } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

async function assertAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) redirect("/admin");
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/admin/dashboard");
}

// Toggle a single confirmed night for a reservation
export async function toggleConfirmedDay(
  reservationId: string,
  date: string
): Promise<{ success: boolean }> {
  await assertAdmin();
  const existing = await db
    .select()
    .from(confirmedDays)
    .where(and(eq(confirmedDays.reservationId, reservationId), eq(confirmedDays.date, date)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(confirmedDays).where(eq(confirmedDays.id, existing[0].id));
  } else {
    await db.insert(confirmedDays).values({ reservationId, date });
  }

  revalidateAll();
  return { success: true };
}

// Upsert a capacity override for a date (capacity=null removes the override)
export async function setCapacityOverride(
  date: string,
  capacity: number | null
): Promise<{ success: boolean; error?: string }> {
  await assertAdmin();
  try {
    if (capacity === null) {
      await db.delete(capacityOverrides).where(eq(capacityOverrides.date, date));
    } else {
      await db
        .insert(capacityOverrides)
        .values({ date, capacity })
        .onConflictDoUpdate({ target: capacityOverrides.date, set: { capacity } });
    }
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update capacity." };
  }
}

export async function deleteReservation(id: string): Promise<{ success: boolean }> {
  await assertAdmin();
  await db.delete(reservations).where(eq(reservations.id, id));
  revalidateAll();
  return { success: true };
}
