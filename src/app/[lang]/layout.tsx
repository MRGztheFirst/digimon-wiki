import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { notFound } from "next/navigation";
import "@fontsource/chakra-petch/500.css";
import "@fontsource/chakra-petch/600.css";
import "@fontsource/chakra-petch/700.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/400-italic.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/noto-sans-jp/400.css";
import "@fontsource/noto-sans-jp/500.css";
import "../globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { I18nProvider } from "@/i18n/client";
import { LOCALES, LOCALE_INFO, isLocale } from "@/i18n/config";
import { uiMessages } from "@/i18n/messages";
import { getI18n, localeFromParams } from "@/i18n/server";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  await localeFromParams(params);
  const { t } = await getI18n();
  return {
    title: { default: t("Digimon Database — Enciclopédia de Digimon"), template: "%s · Digimon Database" },
    description: t("Enciclopédia de Digimon com linhas evolutivas interativas, diferenças entre jogos e mídias, pesquisa avançada e comparador."),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
    { media: "(prefers-color-scheme: light)", color: "#f2eee5" },
  ],
};

const themeScript = `try{if(localStorage.getItem('theme')==='light'){document.documentElement.classList.remove('dark')}}catch(e){}`;

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  if (!isLocale(await localeFromParams(params))) notFound();
  const { locale } = await getI18n();
  return (
    <html lang={LOCALE_INFO[locale].htmlLang} className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <I18nProvider locale={locale} messages={uiMessages[locale]}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
