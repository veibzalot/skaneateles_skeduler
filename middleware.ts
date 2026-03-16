import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "admin_session";

export function middleware(request: NextRequest) {
  const cookieSecret = process.env.COOKIE_SECRET ?? "dev-secret";
  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;

  if (sessionCookie !== cookieSecret) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*"],
};
