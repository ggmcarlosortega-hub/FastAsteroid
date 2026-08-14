import { NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "./lib/auth";

const PUBLIC_API_PATHS = ["/api/auth/login", "/api/auth/logout"];

function roleHomePath(rol) {
  return rol === "Admin" ? "/admin" : "/domiciliario";
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (isApi && PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && session.rol !== "Admin") {
    return isApi
      ? NextResponse.json({ error: "No autorizado" }, { status: 403 })
      : NextResponse.redirect(new URL(roleHomePath(session.rol), request.url));
  }

  if (pathname.startsWith("/domiciliario") && session.rol !== "Domiciliario") {
    return isApi
      ? NextResponse.json({ error: "No autorizado" }, { status: 403 })
      : NextResponse.redirect(new URL(roleHomePath(session.rol), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/domiciliario/:path*",
    "/api/:path*",
  ],
};
