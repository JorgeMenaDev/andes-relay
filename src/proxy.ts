import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

const hasClerkConfig =
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
  Boolean(process.env.CLERK_SECRET_KEY);

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/__clerk(.*)",
  "/favicon.ico",
]);

const clerkProtectedProxy = hasClerkConfig
  ? clerkMiddleware(async (auth, request) => {
      if (isPublicRoute(request)) {
        return NextResponse.next();
      }

      const { userId } = await auth();

      if (!userId) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }

      return NextResponse.next();
    })
  : null;

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!clerkProtectedProxy) {
    return NextResponse.next();
  }

  return clerkProtectedProxy(request, event);
}

export const config = {
  matcher: ["/__clerk(.*)", "/((?!_next|.*\\..*).*)", "/"],
};
