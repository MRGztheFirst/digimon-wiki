# Digimon Database

Enciclopédia de Digimon com **linhas evolutivas interativas**, páginas individuais, diferenças entre jogos e mídias ("Digimon por Universo"), pesquisa avançada e comparadores. Não há contas nem login: o público só lê, e só o dono do projeto edita.

## Rodando localmente

Requisitos: Node.js 20+.

```bash
npm install
cp .env.example .env
npm run setup             # cria o banco, carrega os dados iniciais e importa as imagens
npm run dev               # http://localhost:3000
```

- Editor da wiki: `http://localhost:3000/admin` — só existe onde `EDITOR_ENABLED="true"` (veja abaixo).
- Recriar o banco do zero: `npm run db:reset`.
- Reimportar imagens: `npm run db:images`.
- Importar todos os Digimon da Digi-API/Wikimon: `npm run db:import` (baixa para `prisma/.cache` só o que falta e completa o banco sem sobrescrever o que foi curado).
- Prévia de produção local (porta 3001, roda junto com o `dev`): `npm run preview`.

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions) + **React 19**
- **Prisma** + **SQLite** em desenvolvimento (troque para PostgreSQL em produção — veja abaixo)
- **Tailwind CSS 4**, ícones **lucide-react**
- Fontes self-hosted via **Fontsource**: Chakra Petch (títulos), IBM Plex Sans/Mono (texto e dados), Noto Sans JP (japonês)
- Tema escuro padrão, com tema claro

## O que existe

| Área | Rota |
| --- | --- |
| Página inicial (busca, destaques, populares, recentes, aleatórios, "Explore o Mundo Digital") | `/` |
| Enciclopédia + pesquisa avançada com filtros combináveis | `/digimon` |
| Página individual (básico, classificação, características, golpes, evoluções, aparições, curiosidades, relacionados, fontes) | `/digimon/[slug]` |
| Linhas evolutivas interativas (filtros por mídia, obra, confiabilidade e tipo de evolução) | `/linhas`, `/linhas/[slug]` |
| Digimon por Universo (sistemas, requisitos, estágios, evoluções exclusivas) | `/universos`, `/universos/[slug]` |
| Comparar um Digimon entre jogos/mídias | `/universos/comparar` |
| Comparador de Digimon (até 4) | `/comparar` |
| Estágios, atributos, tipos, famílias, grupos | `/estagios`, `/atributos`, `/tipos`, `/familias`, `/grupos` |
| Curiosidades, fusões, variantes, lendários, cronologia | `/curiosidades` |
| Legenda de confiabilidade e fontes | `/fontes` |
| API de busca (autocompletar) | `/api/search?q=` |
| Editor (somente local) | `/admin` |

### Árvore evolutiva

- Monta ancestrais e descendentes de qualquer Digimon (incluindo componentes de DNA) com consultas em lote por nível (`src/lib/evolution-graph.ts`).
- Layout em colunas por estágio, com evoluções dentro do mesmo estágio (Mode Change, Burst Mode, X-Antibody, Spirit) empurradas para a coluna seguinte; ordenação por baricentro para reduzir cruzamentos (`src/lib/graph-layout.ts`).
- Cada conexão é clicável e mostra tipo, confiabilidade, requisitos e **em quais obras** ela existe. Nenhuma evolução é tratada como obrigatória.
- Linhas da comunidade ficam **ocultas por padrão** e aparecem pontilhadas; não confirmadas aparecem tracejadas.
- Visualização alternativa em lista (acessível e boa no celular).

## Modelo de dados

Ver `prisma/schema.prisma`. Entidades principais: `Digimon`, `Stage`, `Attribute`, `DigimonType`, `Family`, `Group`, `Media` (anime, filme, mangá, jogo, V-Pet, card game), `Appearance`, `Attack`, `Ability`, `Trivia`, `Evolution`, `EvolutionPartner` (DNA/fusão), `EvolutionContext` (a mesma evolução em várias obras, cada uma com requisitos próprios), `MediaFeature` (sistemas de cada universo), `MediaStage`, `Source` e `Citation`.

Variantes e formas alternativas usam a auto-relação `Digimon.base` / `Digimon.variants`.

## Confiabilidade das informações

Toda evolução, contexto, aparição, golpe, curiosidade, família e sistema de jogo tem um status:

- `official` — material oficial (Digimon Reference Book, perfis oficiais)
- `media` — válida apenas na obra indicada
- `community` — interpretação/criação da comunidade
- `unconfirmed` — ainda não verificada

Além disso, cada Digimon tem um `reviewStatus` (`verified`, `review`, `draft`).

### Sobre os dados iniciais

O seed (`prisma/seed-data/`) traz ~100 Digimon, 22 obras e ~90 evoluções como ponto de partida. **Todos os registros entram como "Em revisão"**: foram escritos a partir de conhecimento geral e precisam ser conferidos com o Digimon Reference Book e a Wikimon antes de serem marcados como verificados. Campos sem certeza foram deixados em branco (aparecem como "Não documentado"), e itens duvidosos estão marcados como "Não confirmada". 

### Nomes

O nome principal de cada Digimon, golpe e obra é o **original japonês** (Omegamon, Tailmon, Dukemon, Digimon Savers…). Nomes de dublagens/localizações ficam apenas como nomes alternativos (e continuam funcionando na busca).

### Imagens

As artes oficiais (© Bandai) vêm da [Digi-API](https://digi-api.com), base pública cujos dados vêm da Wikimon, via `npm run db:images`. O script só preenche Digimon sem imagem ou com imagem da própria Digi-API — imagens enviadas pelo editor não são sobrescritas. Nomes que diferem entre esta wiki e a Digi-API ficam em `OVERRIDES` no `prisma/import-images.ts`.

### Catálogo completo

`npm run db:import` traz os ~1.490 Digimon da Digi-API (espelho da Wikimon): estágio, atributo, tipos, famílias, ano de estreia, golpes e o perfil oficial do Digimon Reference Book em japonês e inglês. Descrições marcadas como `fanmade` são descartadas. As evoluções vêm das listas da Wikimon, que não dizem em qual obra cada uma acontece, então entram como **Oficial** com uma nota de que a obra não está indicada, marcadas como importadas. Na árvore, elas mostram só um ou dois níveis.

## Editor (só o dono edita, sem login)

O editor em `/admin` permite cadastrar e editar Digimon, imagens, golpes, curiosidades, aparições, fontes, evoluções (com parceiros de DNA e contexto por obra), mídias e classificações.

Ele **só existe onde `EDITOR_ENABLED="true"`** no `.env`. No servidor público, deixe a variável ausente: lá `/admin` retorna 404 e toda tentativa de salvar é recusada no servidor. Para editar o site publicado, rode o projeto no seu computador com `DATABASE_URL` apontando para o banco de produção.

Imagens enviadas ficam em `./uploads` e são servidas por `/api/uploads/[arquivo]`. Em produção com vários servidores, mova para um armazenamento de objetos (S3 etc.).

## Escalando para milhares de registros

- Troque `provider = "sqlite"` por `"postgresql"` em `prisma/schema.prisma` e ajuste `DATABASE_URL`; rode `npx prisma migrate dev`.
- Listas são paginadas no servidor; a busca de autocompletar e os seletores do painel usam a API de busca (não carregam todos os Digimon).
- Índices em nome, estágio, atributo, destaque, visualizações e chaves estrangeiras das tabelas de relação.
- Para busca textual mais rica em PostgreSQL, adicione índices `pg_trgm` em `Digimon.name`.

## Estrutura

```
prisma/              esquema, seed e dados iniciais
src/app/             rotas (páginas públicas, /admin, /api)
src/components/      componentes reutilizáveis (árvore, cards, busca, badges, UI)
src/lib/             banco, consultas, grafo evolutivo, layout, constantes, editor
```

---

Projeto de fãs. Digimon e nomes relacionados são marcas de Bandai / Toei Animation; este projeto não é afiliado a elas.
