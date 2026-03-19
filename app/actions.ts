"use server";

import { db } from "@/db";
import { reservations } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { todayStr } from "@/lib/dates";

export type ReservationResult =
  | { success: true }
  | { success: false; error: string };

export async function submitReservation(
  startDate: string,
  endDate: string,
  name: string,
  partySize: number,
  email?: string
): Promise<ReservationResult> {
  const trimmedName = name.trim();
  if (!trimmedName) return { success: false, error: "Name is required." };
  if (partySize < 1 || partySize > 20) return { success: false, error: "Party size must be between 1 and 20." };
  if (startDate < todayStr()) return { success: false, error: "Check-in date must not be in the past." };
  if (endDate <= startDate) return { success: false, error: "Checkout must be after check-in." };

  try {
    await db.insert(reservations).values({
      name: trimmedName,
      email: email?.trim() || null,
      partySize,
      startDate,
      endDate,
    });
    revalidatePath("/");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err) {
    console.error("submitReservation error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
