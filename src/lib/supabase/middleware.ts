import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://api-khalid.elfakir.com"
  if (url.startsWith("http://api-khalid.elfakir.com")) {
    url = url.replace("http://", "https://")
  }
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc5MTc0NjM0MCwiZXhwIjo0OTQ3NDE5OTQwLCJyb2xlIjoiYW5vbiJ9.zTAuR28zgIjrnpt-IZDAa7i0G-tdgIspqwyAUHqBduY"

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
  const publicRoutes = ["/login", "/forgot-password", "/manifest.webmanifest", "/manifest.json", "/favicon.ico", "/logo.jpeg", "/icon-192.png", "/icon-512.png"]
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
