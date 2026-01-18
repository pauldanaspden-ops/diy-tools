import { z } from "zod";
import type { UnitSystem } from "./types";

export type PaintFormState = {
  mode: "simple" | "walls";

  // Simple mode dims
  lengthM: number;
  widthM: number;

  // Wall-by-wall mode
  walls: { lengthM: number }[];
  excludedAreas: { label?: string; areaM2: number }[];

  // Shared
  heightM: number;
  doorsCount: number;
  windowsCount: number;
  coats: 1 | 2 | 3;
  coverageM2PerL: number;
  wastePct: number;
  includeCeiling: boolean;
  pricePerL?: number;
};

export const paintDefaults: PaintFormState = {
  mode: "simple",

  lengthM: 4,
  widthM: 3,

  walls: [{ lengthM: 4 }],
  excludedAreas: [],

  heightM: 2.4,
  doorsCount: 1,
  windowsCount: 1,
  coats: 2,
  coverageM2PerL: 12,
  wastePct: 10,
  includeCeiling: false,
  pricePerL: undefined,
};

export const imperialDefaults: PaintFormState = {
  unitSystem: 'imperial',
  lengthM: 13,     // ~4m in feet
  widthM: 10,      // ~3m in feet
  heightM: 8,      // ~2.4m in feet
  doorsCount: 1,
  windowsCount: 1,
  coats: 2,
  coverageM2PerL: 400, // ~12 m²/L in ft²/gal
  wastePct: 10,
  includeCeiling: false,
  pricePerL: undefined,
};

export const PaintProjectSchema = z.object({
  mode: z.union([z.literal("simple"), z.literal("walls")]),

  lengthM: z.number().min(0).max(50),
  widthM: z.number().min(0).max(50),

  walls: z
    .array(
      z.object({
        lengthM: z.number().min(0).max(200),
      })
    )
    .default([]),

  excludedAreas: z
    .array(
      z.object({
        label: z.string().optional(),
        areaM2: z.number().min(0).max(500),
      })
    )
    .default([]),

  heightM: z.number().min(1.8).max(10),
  doorsCount: z.number().int().min(0).max(20),
  windowsCount: z.number().int().min(0).max(40),
  coats: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  coverageM2PerL: z.number().min(5).max(20),
  wastePct: z.number().min(0).max(30),
  includeCeiling: z.boolean(),
  pricePerL: z.number().min(0).max(500).optional(),
});
