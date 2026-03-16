"use server";

import { db } from "@/db";
import { dates, signups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

async function assertAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) redirect("/admin");
}

export async function createDate(
  dateStr: string,
  capacity: number,
  label?: string
): Promise<{ success: boolean; error?: string }> {
  await assertAdmin();
  if (!dateStr) return { success: false, error: "Date is required." };
  if (capacity < 1) return { success: false, error: "Capacity must be at least 1." };

  try {
    await db.insert(dates).values({ date: dateStr, capacity, label: label?.trim() || null });
    revalidatePath("/");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("unique")) return { success: false, error: "That date already exists." };
    return { success: false, error: "Failed to create date." };
  }
}

export async function updateDate(
  id: string,
  capacity: number,
  label?: string
): Promise<{ success: boolean; error?: string }> {
  await assertAdmin();
  try {
    await db.update(dates).set({ capacity, label: label?.trim() || null }).where(eq(dates.id, id));
    revalidatePath("/");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update date." };
  }
}

export async function toggleDateVisibility(id: string, isVisible: boolean): Promise<{ success: boolean }> {
  await assertAdmin();
  await db.update(dates).set({ isVisible }).where(eq(dates.id, id));
  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function deleteDate(id: string): Promise<{ success: boolean }> {
  await assertAdmin();
  await db.delete(dates).where(eq(dates.id, id));
  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function removeSignup(signupId: string): Promise<{ success: boolean }> {
  await assertAdmin();
  // Re-use the public cancel logic (which handles waitlist promotion)
  const { cancelSignup } = await import("@/app/actions");
  return cancelSignup(signupId);
}
