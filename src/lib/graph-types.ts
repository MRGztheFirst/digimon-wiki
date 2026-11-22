export type GSource = { title: string; url: string | null } | null;

export type GNode = {
  id: number;
  slug: string;
  name: string;
  nameJp: string | null;
  imageUrl: string | null;
  stageName: string;
  stageNameEn: string | null;
  stageOrder: number;
  stageColor: string;
  stageSpecial: boolean;
  attrName: string | null;
  attrSlug: string | null;
  attrColor: string | null;
};

export type GContext = {
  mediaId: number;
  mediaSlug: string;
  mediaName: string;
  mediaKind: string;
  requirements: string | null;
  notes: string | null;
  status: string;
  source: GSource;
};

export type GEdge = {
  id: number;
  from: number;
  to: number;
  kind: string;
  status: string;
  partners: number[];
  requirements: string | null;
  notes: string | null;
  source: GSource;
  contexts: GContext[];
};

export type GraphData = { rootId: number; nodes: GNode[]; edges: GEdge[] };

export type GraphFilters = {
  mediaKinds: Set<string>;
  statuses: Set<string>;
  kinds: Set<string>;
  mediaId: number | null;
};
