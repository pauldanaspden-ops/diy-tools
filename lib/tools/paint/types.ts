export type PaintProjectInput = {
  mode: "simple" | "walls";

  // SIMPLE MODE
  lengthM?: number;
  widthM?: number;

  // ADVANCED MODE
  walls?: WallInput[];
  excludedAreas?: ExcludedAreaInput[];

  // SHARED
  heightM: number;
  doorsCount: number;
  windowsCount: number;
  coats: 1 | 2 | 3;
  coverageM2PerL: number;
  wastePct: number;
  includeCeiling: boolean;
  pricePerL?: number;
};


export type PaintProjectResult = {
  wallAreaM2: number;
  ceilingAreaM2: number;
  openingsAreaM2: number;
  paintableAreaM2: number;
  litresRaw: number;
  litresWithWaste: number;
  litresRounded: number;
  recommendedCans: { sizeL: number; qty: number }[];
  estimatedCost?: number;
};

export type WallInput = {
  lengthM: number;
};

export type ExcludedAreaInput = {
  label?: string;
  areaM2: number;
};

export type MeasurementMode = "simple" | "walls";

