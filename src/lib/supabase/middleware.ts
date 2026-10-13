import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:8000"
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy"

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes and assets that don't require auth
  const publicRoutes = ["/login", "/forgot-password", "/manifest.webmanifest", "/manifest.json", "/favicon.ico", "/logo.jpeg"]
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route)
  )

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirectTo", request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  const isAuthPage = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/forgot-password"
  if (user && isAuthPage) {
    const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/dashboard"
    const target = redirectTo.startsWith("/login") ? "/dashboard" : redirectTo
    return NextResponse.redirect(new URL(target, request.url))
  }

  // RBAC: Check role-based access
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    const role = profile?.role || "commercial"
    const pathname = request.nextUrl.pathname

    const roleRestrictions: Record<string, string[]> = {
      commercial: ["/settings", "/salaries"],
      magasinier: ["/settings", "/salaries", "/pos", "/vente/devis", "/achat/bon-commande"],
    }

    const restricted = roleRestrictions[role] || []
    const isRestricted = restricted.some((route) => pathname.startsWith(route))

    if (isRestricted) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
