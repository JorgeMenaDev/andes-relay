import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const hasClerkConfig =
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
  Boolean(process.env.CLERK_SECRET_KEY);

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/favicon.ico",
]);

export default clerkMiddleware(async (auth, request) => {
  if (hasClerkConfig && !isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"],
};
