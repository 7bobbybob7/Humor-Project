import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/auth";

/**
 * OAuth landing route. Supabase redirects here with a `code` which is
 * exchanged for a session cookie.
 *
 * The provider redirect is registered as exactly `/auth/callback` with no
 * query string, so the post-login destination is decided here rather than
 * being passed in.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // Behind Vercel's proxy the request origin is an internal host, so prefer
  // the forwarded host when building absolute redirects.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const base = forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin;

  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");
  if (providerError) {
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent(providerError)}`,
    );
  }

  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent("No authorization code returned.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // New users have a profile row (created by the auth.users trigger) with no
  // name yet, so send them to fill it in before anything else.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url, updated_at")
      .eq("id", user.id)
      .maybeSingle();

    if (!isProfileComplete(profile)) {
      return NextResponse.redirect(`${base}/onboarding`);
    }
  }

  return NextResponse.redirect(`${base}/`);
}
