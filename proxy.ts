import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Renamed from `middleware` in Next 16; the runtime is always nodejs.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Everything except static assets and image files, so the auth cookie is
    // refreshed on real page loads without touching CSS/JS/images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
