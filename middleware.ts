import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Routes protégées
  const protectedRoutes = ["/dashboard", "/admin"];
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // /admin réservé aux admins
  if (pathname.startsWith("/admin")) {
    const role = user?.user_metadata?.role;
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Déjà connecté → redirect depuis /login
  if (pathname === "/login" && user) {
    const role = user?.user_metadata?.role;
    return NextResponse.redirect(
      new URL(role === "admin" ? "/admin" : "/dashboard", request.url)
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login"],
};
