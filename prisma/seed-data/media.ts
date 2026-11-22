type Feature = { category: string; title: string; body: string; status?: string };
type MediaSeed = {
  slug: string; name: string; nameJp?: string; kind: string; year?: number; endYear?: number;
  platform?: string; color: string; description: string; stages?: string[]; features?: Feature[];
};

const RAISING = ["digiovo", "em-treinamento-1", "em-treinamento-2", "novato", "campeao", "perfeito", "mega"];

export const media: MediaSeed[] = [
  { slug: "digimon-adventure", name: "Digimon Adventure", nameJp: "デジモンアドベンチャー", kind: "anime", year: 1999, endYear: 2000, color: "#f97316",
    description: "Primeira série de anime. Oito crianças são levadas ao Mundo Digital, onde conhecem seus parceiros Digimon.",
    features: [
      { category: "evolution-system", title: "Digivices e Brasões", body: "Os Digivices permitem que os parceiros digievoluam. Para alcançar o estágio Perfeito, cada criança precisa de seu Brasão (Crest) e da Etiqueta (Tag).", status: "media" },
      { category: "exclusive-system", title: "Warp Digivolution", body: "Na reta final da série, Agumon e Gabumon digievoluem diretamente para WarGreymon e MetalGarurumon, saltando estágios intermediários.", status: "media" },
      { category: "exclusive-system", title: "Evolução sombria", body: "Quando a evolução é forçada de forma errada, o resultado pode ser um Digimon descontrolado — como SkullGreymon no lugar de MetalGreymon.", status: "media" },
    ] },
  { slug: "digimon-adventure-02", name: "Digimon Adventure 02", nameJp: "デジモンアドベンチャー02", kind: "anime", year: 2000, endYear: 2001, color: "#3b82f6",
    description: "Sequência de Digimon Adventure com uma nova geração de DigiEscolhidos.",
    features: [
      { category: "exclusive-system", title: "Armor Digivolution", body: "Os parceiros usam Digiovos (Digi-Eggs) como o da Coragem e o da Amizade para assumir formas Armor.", status: "media" },
      { category: "exclusive-system", title: "DNA Digivolution", body: "Pares de parceiros se fundem em um único Digimon, como XV-mon e Stingmon formando Paildramon.", status: "media" },
      { category: "particularity", title: "Torres Negras", body: "No início da série, as Torres Negras impedem a digievolução normal, o que torna a Armor Digivolution essencial.", status: "media" },
    ] },
  { slug: "digimon-tamers", name: "Digimon Tamers", nameJp: "デジモンテイマーズ", kind: "anime", year: 2001, endYear: 2002, color: "#ef4444",
    description: "Série ambientada em um mundo onde Digimon é uma franquia de cartas e jogos, até que Digimon reais aparecem.",
    features: [
      { category: "exclusive-system", title: "Card Slash", body: "Os Tamers passam cartas pelo D-Power para dar habilidades e potencializar os parceiros.", status: "media" },
      { category: "exclusive-system", title: "Biomerge (Matrix Evolution)", body: "Tamer e parceiro se fundem fisicamente em um Digimon de estágio Mega, como Takato e Guilmon formando Dukemon.", status: "media" },
    ] },
  { slug: "digimon-frontier", name: "Digimon Frontier", nameJp: "デジモンフロンティア", kind: "anime", year: 2002, endYear: 2003, color: "#dc2626",
    description: "As crianças se transformam elas mesmas em Digimon usando os Espíritos dos Guerreiros Lendários.",
    features: [
      { category: "evolution-system", title: "Spirit Evolution", body: "Cada criança usa Espíritos Humanos e Bestiais para se transformar em Digimon Híbridos. Os dois Espíritos podem ser unificados (Fusion/Unified Spirit Evolution) e, depois, combinados em formas ancestrais.", status: "media" },
    ] },
  { slug: "digimon-savers", name: "Digimon Savers", nameJp: "デジモンセイバーズ", kind: "anime", year: 2006, endYear: 2007, color: "#f59e0b",
    description: "Lançado no Ocidente como Digimon Data Squad. Acompanha a organização DATS e Masaru Daimon com seu parceiro Agumon.",
    features: [
      { category: "evolution-system", title: "DNA Charge", body: "Os parceiros digievoluem a partir da energia emocional (DNA Charge) liberada pelo humano.", status: "media" },
      { category: "exclusive-system", title: "Burst Mode", body: "Forma de poder máximo alcançada além do Mega, como ShineGreymon: Burst Mode.", status: "media" },
    ] },
  { slug: "digimon-xros-wars", name: "Digimon Xros Wars", nameJp: "デジモンクロスウォーズ", kind: "anime", year: 2010, endYear: 2012, color: "#10b981",
    description: "Lançado no Ocidente como Digimon Fusion. Introduz a DigiFusão (Digi-Xros) de múltiplos Digimon.",
    features: [
      { category: "exclusive-system", title: "DigiFusão (Digi-Xros)", body: "Vários Digimon se combinam usando o Xros Loader, formando novas configurações.", status: "media" },
    ] },
  { slug: "digimon-adventure-2020", name: "Digimon Adventure: (2020)", nameJp: "デジモンアドベンチャー：", kind: "anime", year: 2020, endYear: 2021, color: "#fb923c",
    description: "Releitura de Digimon Adventure com uma nova história.", features: [] },
  { slug: "digimon-ghost-game", name: "Digimon Ghost Game", nameJp: "デジモンゴーストゲーム", kind: "anime", year: 2021, endYear: 2023, color: "#6366f1",
    description: "Série com temática de terror e mistério.", features: [] },
  { slug: "bokura-no-war-game", name: "Digimon Adventure: Bokura no War Game!", nameJp: "デジモンアドベンチャー ぼくらのウォーゲーム!", kind: "movie", year: 2000, color: "#f97316",
    description: "Filme de Digimon Adventure em que os DigiEscolhidos enfrentam um Digimon que se espalha pela internet.",
    features: [
      { category: "particularity", title: "Estreia de Omegamon", body: "WarGreymon e MetalGarurumon se fundem pela primeira vez para formar Omegamon.", status: "media" },
    ] },
  { slug: "last-evolution-kizuna", name: "Digimon Adventure: Last Evolution Kizuna", nameJp: "デジモンアドベンチャー LAST EVOLUTION 絆", kind: "movie", year: 2020, color: "#f97316",
    description: "Filme que encerra a história dos DigiEscolhidos originais como adultos jovens.", features: [] },
  { slug: "digimon-world", name: "Digimon World", nameJp: "デジモンワールド", kind: "game", year: 1999, platform: "PlayStation", color: "#22c55e",
    description: "Jogo de criação (raising sim) em que o jogador cuida de um parceiro e reconstrói a File City.",
    stages: ["digiovo", "em-treinamento-1", "em-treinamento-2", "novato", "campeao", "perfeito"],
    features: [
      { category: "evolution-system", title: "Evolução por criação", body: "O parceiro evolui automaticamente quando cumpre condições acumuladas durante a criação. Cada Digimon tem um tempo de vida; ao final, volta a ser um Digiovo e o ciclo recomeça.", status: "media" },
      { category: "requirements", title: "Condições de evolução", body: "As condições combinam parâmetros como atributos (HP, MP, Ataque, Defesa, Velocidade e Cérebro), peso, erros de cuidado e condições bônus. Os valores exatos variam por espécie.", status: "media" },
      { category: "particularity", title: "Sem parceiros Mega", body: "A criação de parceiros vai até o estágio Perfeito.", status: "media" },
      { category: "exclusive-system", title: "Evoluções de \"falha\"", body: "Quando nenhum critério adequado é atingido, o parceiro pode se tornar Digimon como Numemon ou Sukamon.", status: "media" },
    ] },
  { slug: "digimon-story-sunburst-moonlight", name: "Digimon Story: Sunburst & Moonlight", nameJp: "デジモンストーリー サンバースト / ムーンライト", kind: "game", year: 2007, platform: "Nintendo DS", color: "#eab308",
    description: "RPG em turnos lançado em duas versões. Lançado no Ocidente como Digimon World Dawn / Dusk.",
    stages: RAISING,
    features: [
      { category: "particularity", title: "Duas versões", body: "Sunburst e Moonlight possuem Digimon exclusivos de cada versão.", status: "media" },
      { category: "evolution-system", title: "Evolução por requisitos", body: "Digievoluções exigem que o Digimon atinja requisitos próprios. A presença e o funcionamento de DNA Digivolution ainda precisam ser verificados nesta wiki.", status: "unconfirmed" },
    ] },
  { slug: "digimon-masters-online", name: "Digimon Masters Online", nameJp: "デジモンマスターズ", kind: "game", year: 2009, platform: "PC", color: "#0ea5e9",
    description: "MMORPG em que o jogador atua como Tamer e treina parceiros Digimon.",
    features: [
      { category: "evolution-system", title: "Slots de evolução", body: "A evolução dos parceiros é organizada em etapas que precisam ser desbloqueadas.", status: "unconfirmed" },
      { category: "particularity", title: "Parceiros iniciais", body: "Os parceiros iniciais são inspirados em Digimon Savers (Agumon, Gaomon, Lalamon e Falcomon).", status: "unconfirmed" },
    ] },
  { slug: "digimon-world-re-digitize", name: "Digimon World Re:Digitize", nameJp: "デジモンワールド リ:デジタイズ", kind: "game", year: 2012, platform: "PSP", color: "#14b8a6",
    description: "Jogo de criação no estilo do Digimon World original. A versão expandida Re:Digitize Decode saiu para Nintendo 3DS em 2013.",
    stages: RAISING,
    features: [
      { category: "evolution-system", title: "Evolução por criação", body: "Assim como no Digimon World original, o parceiro evolui ao cumprir condições durante a criação.", status: "media" },
    ] },
  { slug: "digimon-story-cyber-sleuth", name: "Digimon Story: Cyber Sleuth", nameJp: "デジモンストーリー サイバースルゥース", kind: "game", year: 2015, platform: "PS Vita / PS4 / Switch / PC", color: "#06b6d4",
    description: "RPG em turnos ambientado em Tóquio e no espaço virtual EDEN.",
    stages: ["em-treinamento-1", "em-treinamento-2", "novato", "campeao", "armor", "perfeito", "mega"],
    features: [
      { category: "evolution-system", title: "Digievolução e de-digievolução livres", body: "No DigiLab, o jogador pode digievoluir e de-digievoluir seus Digimon livremente, desde que cumpra os requisitos. De-digievoluir aumenta o ABI e permite que o Digimon cresça mais.", status: "media" },
      { category: "requirements", title: "Requisitos", body: "Requisitos podem envolver nível, estatísticas (HP, SP, ATK, DEF, INT, SPD), ABI, CAM e, em alguns casos, itens específicos.", status: "media" },
      { category: "exclusive-system", title: "DNA Digivolution", body: "Dois Digimon específicos se fundem em outro — por exemplo, WarGreymon e MetalGarurumon formam Omegamon.", status: "media" },
      { category: "exclusive-system", title: "Mode Change", body: "Algumas formas podem alternar entre modos, como Imperialdramon: Dragon Mode e Fighter Mode.", status: "media" },
      { category: "particularity", title: "Ciclo de atributos", body: "Vacina tem vantagem sobre Vírus, Vírus sobre Dados e Dados sobre Vacina. Essa é uma regra deste jogo, não da franquia como um todo.", status: "media" },
      { category: "particularity", title: "Linhas diferentes do anime", body: "Evoluções que no anime acontecem por Biomerge (como Dukemon) aparecem aqui como digievoluções comuns com requisitos.", status: "media" },
    ] },
  { slug: "digimon-world-next-order", name: "Digimon World: Next Order", nameJp: "デジモンワールド -next 0rder-", kind: "game", year: 2016, platform: "PS Vita / PS4 / Switch / PC", color: "#84cc16",
    description: "Jogo de criação em que o jogador cuida de dois parceiros ao mesmo tempo.",
    stages: RAISING,
    features: [
      { category: "evolution-system", title: "Dois parceiros", body: "O jogador cria dois parceiros simultaneamente; cada um evolui ao cumprir condições durante a vida.", status: "media" },
      { category: "requirements", title: "Condições de evolução", body: "As condições combinam estatísticas, peso, erros de cuidado e outros fatores que variam por espécie.", status: "media" },
      { category: "exclusive-system", title: "ExE (Extra Evolution)", body: "Os dois parceiros podem se fundir temporariamente durante a batalha em um Digimon mais forte.", status: "media" },
    ] },
  { slug: "digimon-story-hackers-memory", name: "Digimon Story: Cyber Sleuth – Hacker's Memory", nameJp: "デジモンストーリー サイバースルゥース ハッカーズメモリー", kind: "game", year: 2017, platform: "PS Vita / PS4 / Switch / PC", color: "#0891b2",
    description: "História paralela a Cyber Sleuth, com elenco de Digimon ampliado.",
    stages: ["em-treinamento-1", "em-treinamento-2", "novato", "campeao", "armor", "perfeito", "mega"],
    features: [
      { category: "evolution-system", title: "Sistema de Cyber Sleuth", body: "Usa o mesmo sistema de digievolução e de-digievolução de Cyber Sleuth.", status: "media" },
      { category: "exclusive-system", title: "Domination Battles", body: "Batalhas territoriais em tabuleiro, exclusivas deste título.", status: "media" },
    ] },
  { slug: "digimon-survive", name: "Digimon Survive", nameJp: "デジモンサヴァイブ", kind: "game", year: 2022, platform: "PS4 / Switch / Xbox / PC", color: "#a855f7",
    description: "RPG tático com narrativa em formato de visual novel.",
    features: [
      { category: "evolution-system", title: "Evolução em batalha", body: "Os parceiros digievoluem durante as batalhas táticas.", status: "media" },
      { category: "exclusive-system", title: "Karma (afinidade)", body: "As escolhas do jogador acumulam afinidades (Moral, Harmonia e Ira) que influenciam as formas evolutivas disponíveis para os parceiros.", status: "media" },
    ] },
  { slug: "digimon-story-time-stranger", name: "Digimon Story: Time Stranger", nameJp: "デジモンストーリー タイムストレンジャー", kind: "game", year: 2025, color: "#8b5cf6",
    description: "RPG da série Digimon Story.",
    features: [
      { category: "particularity", title: "Dados pendentes", body: "Informações detalhadas sobre o sistema de evolução deste jogo ainda não foram cadastradas nesta wiki. Contribua pelo painel administrativo com fontes.", status: "unconfirmed" },
    ] },
  { slug: "digital-monster-ver-1", name: "Digital Monster Ver.1", nameJp: "デジタルモンスター", kind: "vpet", year: 1997, color: "#64748b",
    description: "O bichinho virtual original que deu início à franquia Digimon.",
    stages: ["digiovo", "em-treinamento-1", "em-treinamento-2", "novato", "campeao", "perfeito"],
    features: [
      { category: "evolution-system", title: "Evolução por cuidados", body: "O Digimon evolui com o tempo; a forma resultante depende da qualidade dos cuidados (alimentação, treino e erros de cuidado).", status: "media" },
      { category: "particularity", title: "MetalGreymon Vírus", body: "Neste V-Pet, MetalGreymon é a variante de atributo Vírus.", status: "media" },
      { category: "exclusive-system", title: "Batalhas por conexão", body: "Dois aparelhos podem ser conectados para batalhas entre Digimon.", status: "media" },
    ] },
  { slug: "v-tamer-01", name: "Digimon Adventure V-Tamer 01", nameJp: "デジモンアドベンチャーVテイマー01", kind: "manga", year: 1998, endYear: 2003, color: "#2563eb",
    description: "Mangá em que Taichi Yagami tem como parceiro o V-mon Zero.", features: [] },
  { slug: "digimon-card-game", name: "Digimon Card Game", nameJp: "デジモンカードゲーム", kind: "card", year: 2020, color: "#ec4899",
    description: "Card game oficial lançado em 2020.",
    features: [
      { category: "evolution-system", title: "Digievolução por empilhamento", body: "Cartas de Digimon evoluem sendo colocadas sobre uma carta de estágio anterior, pagando o custo de digievolução indicado.", status: "media" },
    ] },
];
