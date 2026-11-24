import Link from "next/link";
import { Container } from "@/components/ui";
import { SearchBox } from "@/components/search-box";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <Container className="py-24 text-center">
      <div className="font-display text-7xl font-bold text-primary">404</div>
      <h1 className="mt-2 font-display text-2xl font-bold">{t("Esta página se perdeu no Mundo Digital")}</h1>
      <p className="mt-2 text-muted">{t("Tente pesquisar o Digimon que você procura.")}</p>
      <div className="mx-auto mt-6 max-w-md text-left">
        <SearchBox compact />
      </div>
      <Link href="/" className="btn btn-ghost mt-6">{t("Voltar ao início")}</Link>
    </Container>
  );
}
