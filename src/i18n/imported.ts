import type { Locale } from "./config";

type Lang = "pt" | "ja";

const ATTRS: Record<string, Record<Lang, string>> = {
  Vaccine: { pt: "Vacina", ja: "ワクチン種" },
  Virus: { pt: "Vírus", ja: "ウィルス種" },
  Data: { pt: "Dados", ja: "データ種" },
  Free: { pt: "Livre", ja: "フリー" },
  Variable: { pt: "Variável", ja: "ヴァリアブル" },
  Unknown: { pt: "Desconhecido", ja: "不明" },
};

const LEVELS: Record<string, Record<Lang, string>> = {
  "Baby I": { pt: "Em Treinamento 1", ja: "幼年期I" },
  "Baby II": { pt: "Em Treinamento 2", ja: "幼年期II" },
  Child: { pt: "Novato", ja: "成長期" },
  Rookie: { pt: "Novato", ja: "成長期" },
  Adult: { pt: "Campeão", ja: "成熟期" },
  Champion: { pt: "Campeão", ja: "成熟期" },
  Perfect: { pt: "Perfeito", ja: "完全体" },
  Ultimate: { pt: "Mega", ja: "究極体" },
  Mega: { pt: "Mega", ja: "究極体" },
  Armor: { pt: "Armor", ja: "アーマー体" },
  Hybrid: { pt: "Híbrido", ja: "ハイブリッド体" },
};

const VIRTUES: Record<string, Record<Lang, string>> = {
  Courage: { pt: "da Coragem", ja: "勇気" },
  Friendship: { pt: "da Amizade", ja: "友情" },
  Love: { pt: "do Amor", ja: "愛情" },
  Knowledge: { pt: "do Conhecimento", ja: "知識" },
  Sincerity: { pt: "da Sinceridade", ja: "純真" },
  Purity: { pt: "da Pureza", ja: "純真" },
  Reliability: { pt: "da Confiança", ja: "誠実" },
  Hope: { pt: "da Esperança", ja: "希望" },
  Light: { pt: "da Luz", ja: "光" },
  Kindness: { pt: "da Bondade", ja: "優しさ" },
  Miracles: { pt: "dos Milagres", ja: "奇跡" },
  Destiny: { pt: "do Destino", ja: "運命" },
  Fate: { pt: "do Destino", ja: "運命" },
};

const ELEMENTS: Record<string, Record<Lang, string>> = {
  Fire: { pt: "do Fogo", ja: "炎" },
  Light: { pt: "da Luz", ja: "光" },
  Thunder: { pt: "do Trovão", ja: "雷" },
  Ice: { pt: "do Gelo", ja: "氷" },
  Wind: { pt: "do Vento", ja: "風" },
  Earth: { pt: "da Terra", ja: "土" },
  Water: { pt: "da Água", ja: "水" },
  Wood: { pt: "da Madeira", ja: "木" },
  Steel: { pt: "do Aço", ja: "鋼" },
  Darkness: { pt: "das Trevas", ja: "闇" },
};

const EVOLUTIONS: Record<string, string> = {
  Warp: "ワープ",
  Burst: "バースト",
  "Full Burst": "フルバースト",
  Blast: "ブラスト",
  Ancient: "エンシェント",
  Death: "デス",
  Mutant: "突然変異",
  Armor: "アーマー",
  Spirit: "スピリット",
  Slide: "スライド",
  "Reverse Slide": "リバーススライド",
};

const PHRASES: Record<string, Record<Lang, string>> = {
  "Mode Change": { pt: "Mudança de modo", ja: "モードチェンジ" },
  "Every Digimon from the Digital World": { pt: "qualquer Digimon do Mundo Digital", ja: "デジタルワールドのすべてのデジモン" },
  "Every Digimon from a different Digital World": { pt: "qualquer Digimon de outro Mundo Digital", ja: "別のデジタルワールドのすべてのデジモン" },
  "the Digimental": { pt: "o Digimental", ja: "デジメンタル" },
  "the X Eraser": { pt: "o X Eraser", ja: "X Eraser" },
  "the X-Eraser": { pt: "o X Eraser", ja: "X Eraser" },
};

const JOINS: Record<string, Record<Lang, string>> = {
  Jogress: { pt: "Jogress", ja: "ジョグレス" },
  Jogressed: { pt: "Jogress", ja: "ジョグレス" },
  DigiXros: { pt: "DigiXros", ja: "デジクロス" },
};

const ATTR = `(?:${Object.keys(ATTRS).join("|")})`;
const LEVEL = `(?:${Object.keys(LEVELS).sort((a, b) => b.length - a.length).join("|")})`;
const SEP = /(,\s+or\s+|,\s+and\s+|,\s+|\s+or\s+|\s+and\s+)/;
const GLUE = "\u0000";

const words = (list: string, dict: Record<string, Record<Lang, string>>, lang: Lang) => {
  const items = list.split(/,\s+or\s+|,\s+|\s+or\s+/).map((w) => dict[w.trim()]?.[lang] ?? w.trim());
  if (items.length < 2) return items[0];
  return lang === "pt" ? `${items.slice(0, -1).join(", ")} ou ${items.at(-1)}` : items.join("・");
};

function source(raw: string, lang: Lang) {
  const name = raw.replace(/^the\s+/, "");
  const series = name.match(/^(.+?)\s+series$/);
  if (lang === "ja") return series ? `${series[1]}シリーズの` : `${name}の`;
  return series ? ` da série ${series[1]}` : ` do ${name}`;
}

const ANY = new RegExp(`^(a|an|any|Any|certain)\\s+(?:(${ATTR}(?:(?:,\\s+or\\s+|,\\s+|\\s+or\\s+)${ATTR})*)\\s+(?:Attribute\\s+)?)?(?:(${LEVEL}(?:(?:,\\s+or\\s+|,\\s+|\\s+or\\s+)${LEVEL})*)\\s*(?:[Ll]evel\\s+)?)?(?:Digimon(?:\\s+(?:from|of)\\s+(.+))?)?$`);
const ANTIBODY = /^(?:the\s+)?X-Antibody$/;
const DIGIMENTAL = /^(?:the\s+)?Digimental\s+of\s+(\w+)$/;
const CREST = /^(?:the\s+)?Crest\s+of\s+(\w+)$/;
const SPIRIT = /^(?:the\s+)?(?:(Human|Beast)\s+)?Spirit\s+of\s+(\w+)$/;
const EVOLUTION = /^(.+?)\s+Evolution$/;
const LV = /^Any\s+(Lv\.\d+)\s+(.+?)\s+from\s+(.+)$/;
const FAMILY = new RegExp(`^(?:any\\s+)?Any\\s+(${LEVEL})\\s+Digimon\\s+belonging\\s+to\\s+either\\s+(.+)$`);

const DETERMINERS: Record<string, Record<Lang, string>> = {
  a: { pt: "um Digimon", ja: "" },
  an: { pt: "um Digimon", ja: "" },
  any: { pt: "qualquer Digimon", ja: "任意の" },
  Any: { pt: "qualquer Digimon", ja: "任意の" },
  certain: { pt: "certos Digimon", ja: "特定の" },
};

function item(text: string, lang: Lang): string {
  const phrase = PHRASES[text]?.[lang];
  if (phrase) return phrase;
  if (ANTIBODY.test(text)) return lang === "pt" ? "X-Antibody" : "X抗体";
  const evo = text.match(EVOLUTION);
  if (evo) return lang === "pt" ? `Evolução ${evo[1]}` : `${EVOLUTIONS[evo[1]] ?? evo[1]}進化`;
  const dm = text.match(DIGIMENTAL);
  if (dm && VIRTUES[dm[1]]) return lang === "pt" ? `o Digimental ${VIRTUES[dm[1]].pt}` : `${VIRTUES[dm[1]].ja}のデジメンタル`;
  const crest = text.match(CREST);
  if (crest && VIRTUES[crest[1]]) return lang === "pt" ? `o Brasão ${VIRTUES[crest[1]].pt}` : `${VIRTUES[crest[1]].ja}の紋章`;
  const spirit = text.match(SPIRIT);
  if (spirit && ELEMENTS[spirit[2]]) {
    const [, kind, el] = spirit;
    if (lang === "ja") return `${ELEMENTS[el].ja}の${kind === "Human" ? "ヒューマン" : kind === "Beast" ? "ビースト" : ""}スピリット`;
    return `o Espírito${kind === "Human" ? " Humano" : kind === "Beast" ? " Besta" : ""} ${ELEMENTS[el].pt}`;
  }
  const lv = text.match(LV);
  if (lv) return lang === "pt" ? `qualquer ${lv[2]} ${lv[1]}${source(lv[3], lang)}` : `${source(lv[3], lang)}任意の${lv[1]} ${lv[2]}`;
  const rare = text.match(/^the\s+rare\s+(.+)$/);
  if (rare) return lang === "pt" ? `o raro ${rare[1]}` : `レアな${rare[1]}`;
  const type = text.match(/^any\s+(.+?)\s+Type\s+Digimon$/);
  if (type) return lang === "pt" ? `qualquer Digimon do tipo ${type[1]}` : `任意の${type[1]}型デジモン`;
  if (text === "all the other Spirits") return lang === "pt" ? "todos os outros Espíritos" : "他のすべてのスピリット";
  if (text === "all of them") return lang === "pt" ? "todos eles" : "それらすべて";
  const either = text.match(/^either\s+(.+)$/);
  if (either) return item(either[1], lang);
  const any = text.match(ANY);
  if (any && (any[2] || any[3] || /Digimon/.test(text))) {
    const [, det, attrs, levels, from] = any;
    if (lang === "ja") {
      return `${from ? source(from, lang) : ""}${DETERMINERS[det].ja}${attrs ? words(attrs, ATTRS, lang) : ""}${levels ? words(levels, LEVELS, lang) : ""}デジモン`;
    }
    const lv = levels ? words(levels, LEVELS, lang) : "";
    return `${DETERMINERS[det].pt}${lv ? ` ${det === "certain" ? lv.replace(/\b(Novato|Perfeito|Híbrido|Mega)\b/g, "$1s").replace(/\bCampeão\b/g, "Campeões") : lv}` : ""}${attrs ? ` de atributo ${words(attrs, ATTRS, lang)}` : ""}${from ? source(from, lang) : ""}`;
  }
  const the = text.match(/^the\s+(.+)$/);
  if (the) return lang === "pt" ? `o ${the[1]}` : the[1];
  return text;
}

function list(text: string, lang: Lang): string {
  const family = text.match(FAMILY);
  if (family) {
    const fams = family[2].split(/,?\s+or\s+|,\s+/).map((f) => f.trim());
    const level = LEVELS[family[1]][lang];
    if (lang === "ja") return `${fams.join("・")}に属する任意の${level}デジモン`;
    return `qualquer Digimon ${level} das famílias ${fams.slice(0, -1).join(", ")} ou ${fams.at(-1)}`;
  }
  const but = text.match(/^(.+?)\s+except\s+(.+)$/);
  if (but) return lang === "pt" ? `${list(but[1], lang)}, exceto ${list(but[2], lang)}` : `${list(but[1], lang)}（${list(but[2], lang)}を除く）`;
  const except = text.match(/^(.+?)\s+without\s+(.+)$/);
  if (except) return lang === "pt" ? `${list(except[1], lang)} sem ${list(except[2], lang)}` : `${list(except[2], lang)}なしで${list(except[1], lang)}`;
  const guarded = text.replace(new RegExp(`\\b(${ATTR}|${LEVEL})(,\\s+or\\s+|,\\s+|\\s+or\\s+)(?=(?:${ATTR}|${LEVEL})\\b)`, "g"), (_, w, sep) => `${w}${sep.replace(/\s/g, GLUE)}`);
  const parts = guarded.split(SEP);
  let out = "";
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (i % 2 === 0) {
      out += item(p.replace(new RegExp(GLUE, "g"), " ").trim(), lang);
      continue;
    }
    const or = /or/.test(p);
    const and = /and/.test(p);
    if (lang === "pt") out += or ? " ou " : and ? " e " : ", ";
    else out += or ? "または" : and ? "と" : "、";
  }
  return out;
}

function part(text: string, lang: Lang): string {
  const t = text.trim().replace(/^With\b/, "with").replace(/^or\s+(?=with\b)/, "");
  const phrase = PHRASES[t]?.[lang];
  if (phrase) return phrase;
  const clauses = t.split(/,?\s+or\s+(?=(?:with|including)\b)/i);
  if (clauses.length > 1) return clauses.map((c) => part(c, lang)).join(lang === "pt" ? " ou " : "、または");
  const including = t.match(/^including\s+or\s+not\s+including\s+(.+)$/);
  if (including) return lang === "pt" ? `incluindo ou não ${list(including[1], lang)}` : `${list(including[1], lang)}の有無を問わず`;
  const lead = t.match(/^((?:[A-Z][\w-]*\s+)+Evolution|Jogressed|Jogress|DigiXros)\s+(with\s+.+)$/);
  if (lead) {
    const head = JOINS[lead[1]]?.[lang] ?? item(lead[1], lang);
    const rest = part(lead[2], lang);
    return lang === "pt" ? `${head} ${rest}` : `${rest}${head}`;
  }
  const either = t.match(/^with\s+or\s+without\s+(.+)$/);
  if (either) return lang === "pt" ? `com ou sem ${list(either[1], lang)}` : `${list(either[1], lang)}の有無を問わず`;
  const without = t.match(/^without\s+(.+)$/);
  if (without) return lang === "pt" ? `sem ${list(without[1], lang)}` : `${list(without[1], lang)}なしで`;
  const withs = t.match(/^with\s+(.+)$/);
  if (withs) return lang === "pt" ? `com ${list(withs[1], lang)}` : `${list(withs[1], lang)}と`;
  return EVOLUTION_LIST.test(t) ? list(t, lang) : t;
}

const EVOLUTION_LIST = /^(?:[A-Z][\w-]*\s+)+Evolution(?:,?\s+(?:or|and)\s+(?:[A-Z][\w-]*\s+)+Evolution)*$/;
const REQUIREMENT = /^(?:(?:with|With|without|including|Jogress|Jogressed|DigiXros)\b|(?:[A-Z][\w-]*\s+)+Evolution\b)/;

export function translateImported(text: string, locale: Locale): string {
  if (locale === "en") return text;
  const parts = text.split(" / ");
  if (!parts.every((p) => REQUIREMENT.test(p.trim()))) return text;
  const lang: Lang = locale === "ja" ? "ja" : "pt";
  return parts.map((p) => part(p, lang)).join(" / ");
}
