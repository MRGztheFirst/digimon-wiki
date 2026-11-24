import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, localeFromAcceptLanguage } from "@/i18n/config";

export function proxy(req: NextRequest) {
  const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookie) ? cookie : localeFromAcceptLanguage(req.headers.get("accept-language")) ?? DEFAULT_LOCALE;
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api/|_next/|_vercel/|.*\\.).*)"],
};
