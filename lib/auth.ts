import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const COOKIE_SECRET = process.env.COOKIE_SECRET ?? "dev-secret";

export async function verifyAdminPassphrase(passphrase: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSPHRASE_HASH;
  if (!hash) return false;
  return bcrypt.compare(passphrase, hash);
}

export async function setAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, COOKIE_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const val = cookieStore.get(COOKIE_NAME)?.value;
  return val === COOKIE_SECRET;
}

export async function clearAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
