export type UnitSystem = 'metric' | 'imperial';

export type { SavedCalculation } from './storage';

export type PaintProjectInput = {
  lengthM: number;
  widthM: number;
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
