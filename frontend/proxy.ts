import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  const hasToken = request.cookies.has("mentorat_access");
  const protectedPath = pathname.startsWith("/admin") || pathname.startsWith("/mentor");

  if (protectedPath && !isLogin && !hasToken) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isLogin && hasToken) {
    const homePath = request.cookies.get("mentorat_home")?.value || "/admin/dashboard";
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = homePath;
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/mentor/:path*"],
};
