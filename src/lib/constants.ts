export const STATUSES = {
  official: {
    label: "Oficial",
    long: "Informação oficial (perfis oficiais / Digimon Reference Book)",
    color: "#22c55e",
  },
  media: {
    label: "Específica da mídia",
    long: "Válida apenas dentro da obra indicada (jogo, anime, V-Pet...)",
    color: "#38bdf8",
  },
  community: {
    label: "Comunidade",
    long: "Interpretação ou criação da comunidade — não é oficial",
    color: "#f472b6",
  },
  unconfirmed: {
    label: "Não confirmada",
    long: "Informação ainda não verificada em fonte confiável",
    color: "#f59e0b",
  },
} as const;
export type Status = keyof typeof STATUSES;
export const STATUS_KEYS = Object.keys(STATUSES) as Status[];

export const MEDIA_KINDS = {
  anime: { label: "Anime", plural: "Animes", icon: "Tv" },
  movie: { label: "Filme", plural: "Filmes", icon: "Clapperboard" },
  manga: { label: "Mangá", plural: "Mangás", icon: "BookOpen" },
  game: { label: "Jogo", plural: "Jogos", icon: "Gamepad2" },
  vpet: { label: "V-Pet", plural: "V-Pets", icon: "Egg" },
  card: { label: "Card Game", plural: "Card Game", icon: "Layers" },
  other: { label: "Outra mídia", plural: "Outras mídias", icon: "Sparkles" },
} as const;
export type MediaKind = keyof typeof MEDIA_KINDS;
export const MEDIA_KIND_KEYS = Object.keys(MEDIA_KINDS) as MediaKind[];

export const EVOLUTION_KINDS = {
  normal: { label: "Evolução", short: "Normal", color: "#94a3b8", special: false, description: "Digievolução comum entre estágios." },
  dna: { label: "DNA / Jogress", short: "DNA", color: "#f97316", special: true, description: "Dois ou mais Digimon se fundem em um novo Digimon (DNA Digivolution / Jogress)." },
  armor: { label: "Armor Digivolution", short: "Armor", color: "#eab308", special: true, description: "Evolução por meio de um Digiovo (Digi-Egg) específico." },
  spirit: { label: "Spirit Evolution", short: "Spirit", color: "#ef4444", special: true, description: "Evolução com Espíritos dos Guerreiros Lendários (Digimon Frontier)." },
  burst: { label: "Burst Mode", short: "Burst", color: "#facc15", special: true, description: "Forma de poder máximo alcançada além do Mega (Digimon Savers)." },
  "x-antibody": { label: "X-Antibody", short: "X", color: "#a855f7", special: true, description: "Forma resultante da ação do X-Antibody (Digimon X-Evolution / Chronicle X)." },
  "mode-change": { label: "Mudança de modo", short: "Modo", color: "#14b8a6", special: true, description: "Troca de forma/modo sem mudança de estágio." },
  biomerge: { label: "Biomerge / Matrix", short: "Biomerge", color: "#ec4899", special: true, description: "Fusão do Tamer com seu parceiro Digimon (Digimon Tamers)." },
  dark: { label: "Evolução sombria", short: "Sombria", color: "#64748b", special: true, description: "Evolução forçada, corrompida ou fora de controle." },
  warp: { label: "Warp Digivolution", short: "Warp", color: "#06b6d4", special: true, description: "Evolução que salta estágios intermediários." },
  special: { label: "Evolução especial", short: "Especial", color: "#8b5cf6", special: true, description: "Outras formas de evolução especial." },
} as const;
export type EvolutionKind = keyof typeof EVOLUTION_KINDS;
export const EVOLUTION_KIND_KEYS = Object.keys(EVOLUTION_KINDS) as EvolutionKind[];

export const SOURCE_KINDS = {
  "reference-book": "Digimon Reference Book",
  official: "Material oficial",
  wikimon: "Wikimon",
  fandom: "Digimon Wiki (Fandom)",
  game: "Jogo",
  anime: "Anime",
  community: "Comunidade",
  other: "Outra",
} as const;
export type SourceKind = keyof typeof SOURCE_KINDS;

export const FEATURE_CATEGORIES = {
  "evolution-system": "Sistema de evolução",
  requirements: "Requisitos de evolução",
  "exclusive-system": "Sistemas exclusivos",
  particularity: "Particularidades do universo",
} as const;
export type FeatureCategory = keyof typeof FEATURE_CATEGORIES;

export function statusOf(v: string | null | undefined): Status {
  return (v && v in STATUSES ? v : "unconfirmed") as Status;
}
export function evoKindOf(v: string | null | undefined): EvolutionKind {
  return (v && v in EVOLUTION_KINDS ? v : "normal") as EvolutionKind;
}
export function mediaKindOf(v: string | null | undefined): MediaKind {
  return (v && v in MEDIA_KINDS ? v : "other") as MediaKind;
}

export const PAGE_SIZE = 24;

export const REVIEW_STATUSES = {
  verified: { label: "Verificado", long: "Registro revisado por um editor com fontes.", color: "#22c55e" },
  review: { label: "Em revisão", long: "Registro criado a partir dos dados iniciais e aguardando conferência editorial com o Digimon Reference Book/Wikimon.", color: "#f59e0b" },
  draft: { label: "Rascunho", long: "Registro incompleto, ainda em elaboração.", color: "#94a3b8" },
} as const;
export type ReviewStatus = keyof typeof REVIEW_STATUSES;
export function reviewOf(v: string | null | undefined): ReviewStatus {
  return (v && v in REVIEW_STATUSES ? v : "draft") as ReviewStatus;
}
