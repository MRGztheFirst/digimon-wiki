export type StatKey = "hp" | "mp" | "atk" | "def" | "spi" | "spd" | "apt";
export type StatGame = { key: string; name: string; short: string; stats: [StatKey, string, string][] };
export type StatRow = { game: string } & Record<StatKey, number | null>;

export const STAT_GAMES: StatGame[] = [
  {
    key: "cyber-sleuth",
    name: "Digimon Story: Cyber Sleuth – Complete Edition",
    short: "Cyber Sleuth",
    stats: [["hp", "HP", "Vida"], ["mp", "SP", "Energia"], ["atk", "ATK", "Ataque"], ["def", "DEF", "Defesa"], ["spi", "INT", "Inteligência"], ["spd", "SPD", "Velocidade"]],
  },
  {
    key: "time-stranger",
    name: "Digimon Story: Time Stranger",
    short: "Time Stranger",
    stats: [["hp", "HP", "Vida"], ["mp", "SP", "Energia"], ["atk", "ATK", "Ataque"], ["def", "DEF", "Defesa"], ["spi", "INT", "Inteligência"], ["spd", "SPD", "Velocidade"]],
  },
  {
    key: "sunburst-moonlight",
    name: "Digimon Story: Sunburst & Moonlight",
    short: "Sunburst & Moonlight",
    stats: [["hp", "HP", "Vida"], ["mp", "MP", "Energia"], ["atk", "ATK", "Ataque"], ["def", "DEF", "Defesa"], ["spi", "SPI", "Espírito"], ["spd", "SPD", "Velocidade"], ["apt", "APT", "Aptidão"]],
  },
  {
    key: "super-xros-wars",
    name: "Digimon Story: Super Xros Wars",
    short: "Super Xros Wars",
    stats: [["hp", "HP", "Vida"], ["mp", "MP", "Energia"], ["atk", "STR", "Força"], ["def", "DEF", "Defesa"], ["spi", "INT", "Inteligência"], ["spd", "SPD", "Velocidade"]],
  },
];

export const GENERAL: StatGame = {
  key: "geral",
  name: "Geral",
  short: "Geral",
  stats: [["hp", "HP", "Vida"], ["mp", "MP", "Energia"], ["atk", "ATK", "Ataque"], ["def", "DEF", "Defesa"], ["spi", "INT", "Inteligência"], ["spd", "SPD", "Velocidade"]],
};

export const ELEMENTS: Record<string, [string, string]> = {
  Fire: ["Fogo", "#ef4444"],
  Water: ["Água", "#3b82f6"],
  Thunder: ["Trovão", "#eab308"],
  Electric: ["Elétrico", "#eab308"],
  Wind: ["Vento", "#22c55e"],
  Earth: ["Terra", "#a16207"],
  Ore: ["Minério", "#78716c"],
  Light: ["Luz", "#f59e0b"],
  Dark: ["Trevas", "#7c3aed"],
  Fighting: ["Luta", "#f97316"],
};

export const elementList = (v: string | null | undefined) => (v ? v.split(",").map((e) => e.trim()).filter(Boolean) : []);

export function statScorer(allStats: StatRow[]) {
  const pools = new Map<string, number[]>();
  const pool = (g: string, k: StatKey) => {
    const key = `${g}:${k}`;
    if (!pools.has(key)) pools.set(key, allStats.filter((s) => s.game === g && s[k] !== null).map((s) => s[k]!));
    return pools.get(key)!;
  };
  const percentile = (g: string, k: StatKey, v: number) => {
    const vals = pool(g, k);
    const below = vals.filter((x) => x < v).length;
    const equal = vals.filter((x) => x === v).length;
    return vals.length ? ((below + equal / 2) / vals.length) * 100 : 0;
  };
  const score = (own: StatRow[], k: StatKey) => {
    const parts = own.filter((s) => s[k] !== null).map((s) => percentile(s.game, k, s[k]!));
    return parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : null;
  };
  const max = (g: string, k: StatKey) => Math.max(0, ...pool(g, k));
  return { pool, percentile, score, max };
}
