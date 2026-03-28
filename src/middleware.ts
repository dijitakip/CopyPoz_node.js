import { auth } from "@/src/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // 1. Master API Koruması (Authorization Header Kontrolü)
  // Sadece Master EA bu rotalara erişebilir
  if (pathname.startsWith("/api/master/")) {
     const authHeader = req.headers.get("authorization");
     
     // Token'ı al
     let token = authHeader;
     if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.split(" ")[1];
     }
     
     // Güvenlik: Token'ı .env'den al (MASTER_TOKEN)
     const validToken = process.env.MASTER_TOKEN || "master-local-123";

     if (token !== validToken) {
        return NextResponse.json({ error: "Unauthorized Master Access" }, { status: 401 });
     }
     return NextResponse.next();
  }

  // Not: /api/client/ rotaları Middleware'de token kontrolüne tabi tutulmamalıdır.
  // Çünkü her client'ın kendi auth_token'ı vardır ve bu veritabanında saklanır.
  // Middleware (Edge) veritabanına erişemediği için bu kontrol API Route içinde (Controller) yapılır.

  // 2. Korumasız Sayfalar (Login, Public API'ler, Webhooklar)
  if (
    pathname.startsWith("/login") || 
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/client") || // Client API'leri (Token tabanlı, session yok)
    pathname === "/" // Landing Page (Opsiyonel)
  ) {
    // Eğer login sayfasına gidiyorsa ve zaten giriş yapmışsa dashboard'a yönlendir
    if (isLoggedIn && pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.next()
  }

  // 2. Korumalı Sayfalar (Dashboard, Admin API'ler)
  // Not: API rotaları için redirect yerine 401 dönmeliyiz ki fetch istekleri CORS veya Redirect hatasına düşmesin.
  if (!isLoggedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 3. Rol Bazlı Koruma (Örnek: Sadece adminler /admin rotasına girebilsin)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const role = (req.auth?.user as any)?.role
    if (role !== "admin" && role !== "master_owner" && role !== "trader") {
       if (pathname.startsWith("/api/")) {
           return NextResponse.json({ error: "Forbidden" }, { status: 403 });
       }
       return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  return NextResponse.next()
})

// Hangi rotaların middleware'den geçeceğini belirtiyoruz
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
