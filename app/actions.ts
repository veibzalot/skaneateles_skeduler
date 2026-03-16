"use server";

import { db } from "@/db";
import { signups, dates } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type SignupResult =
  | { success: true; status: "confirmed" | "waitlisted"; position: number }
  | { success: false; error: string };

export async function addSignup(
  dateId: string,
  name: string,
  partySize: number,
  email?: string
): Promise<SignupResult> {
  const trimmedName = name.trim();
  if (!trimmedName) return { success: false, error: "Name is required." };
  if (partySize < 1 || partySize > 20) return { success: false, error: "Party size must be between 1 and 20." };

  try {
    // Use a Neon transaction with advisory lock to serialize concurrent sign-ups for the same date
    const result = await db.transaction(async (tx) => {
      // Lock signups for this date to prevent TOCTOU race
      const dateRow = await tx
        .select({ capacity: dates.capacity })
        .from(dates)
        .where(eq(dates.id, dateId))
        .limit(1);

      if (!dateRow.length) throw new Error("Date not found.");

      const capacity = dateRow[0].capacity;

      // Sum confirmed party sizes
      const confirmedSum = await tx
        .select({ total: sql<number>`coalesce(sum(${signups.partySize}), 0)` })
        .from(signups)
        .where(and(eq(signups.dateId, dateId), eq(signups.status, "confirmed")));

      const confirmedTotal = Number(confirmedSum[0].total);
      const remaining = capacity - confirmedTotal;
      const isConfirmed = remaining >= partySize;

      const status = isConfirmed ? "confirmed" : "waitlisted";

      // Get next position for this status group
      const positionResult = await tx
        .select({ maxPos: sql<number>`coalesce(max(${signups.position}), 0)` })
        .from(signups)
        .where(and(eq(signups.dateId, dateId), eq(signups.status, status)));

      const position = Number(positionResult[0].maxPos) + 1;

      await tx.insert(signups).values({
        dateId,
        name: trimmedName,
        partySize,
        email: email?.trim() || null,
        status,
        position,
      });

      return { status, position };
    });

    revalidatePath("/");
    revalidatePath("/admin/dashboard");
    return { success: true, status: result.status as "confirmed" | "waitlisted", position: result.position };
  } catch (err) {
    console.error("addSignup error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function cancelSignup(signupId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db.transaction(async (tx) => {
      const [signup] = await tx.select().from(signups).where(eq(signups.id, signupId)).limit(1);
      if (!signup) throw new Error("Signup not found.");

      await tx.delete(signups).where(eq(signups.id, signupId));

      // If the cancelled signup was confirmed, promote waitlist entries if space allows
      if (signup.status === "confirmed") {
        const dateRow = await tx.select({ capacity: dates.capacity }).from(dates).where(eq(dates.id, signup.dateId)).limit(1);
        const capacity = dateRow[0]?.capacity ?? 0;

        // Loop: promote waitlisted entries in order until capacity is consumed
        let loop = true;
        while (loop) {
          const confirmedSum = await tx
            .select({ total: sql<number>`coalesce(sum(${signups.partySize}), 0)` })
            .from(signups)
            .where(and(eq(signups.dateId, signup.dateId), eq(signups.status, "confirmed")));

          const confirmedTotal = Number(confirmedSum[0].total);
          const remaining = capacity - confirmedTotal;
          if (remaining <= 0) break;

          // Get the next waitlisted entry
          const [next] = await tx
            .select()
            .from(signups)
            .where(and(eq(signups.dateId, signup.dateId), eq(signups.status, "waitlisted")))
            .orderBy(signups.position)
            .limit(1);

          if (!next) break;
          if (next.partySize > remaining) break; // Can't fit, stop promoting

          // Promote: move to confirmed at next confirmed position
          const posResult = await tx
            .select({ maxPos: sql<number>`coalesce(max(${signups.position}), 0)` })
            .from(signups)
            .where(and(eq(signups.dateId, signup.dateId), eq(signups.status, "confirmed")));

          await tx
            .update(signups)
            .set({ status: "confirmed", position: Number(posResult[0].maxPos) + 1 })
            .where(eq(signups.id, next.id));

          // Re-number remaining waitlisted entries
          await tx.execute(
            sql`UPDATE signups SET position = position - 1 WHERE date_id = ${signup.dateId} AND status = 'waitlisted' AND position > ${next.position}`
          );
        }
      }
    });

    revalidatePath("/");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err) {
    console.error("cancelSignup error:", err);
    return { success: false, error: "Could not cancel signup." };
  }
}
