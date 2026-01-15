import { z } from "zod";

export const paintDefaults = {
  lengthM: 4,
  widthM: 3,
  heightM: 2.4,
  doorsCount: 1,
  windowsCount: 1,
  coats: 2 as const,
  coverageM2PerL: 12,
  wastePct: 10,
  includeCeiling: false,
  pricePerL: undefined as number | undefined,
};

export const PaintProjectSchema = z.object({
  lengthM: z.number().min(1).max(50),
  widthM: z.number().min(1).max(50),
  heightM: z.number().min(1.8).max(10),
  doorsCount: z.number().int().min(0).max(20),
  windowsCount: z.number().int().min(0).max(40),
  coats: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  coverageM2PerL: z.number().min(5).max(20),
  wastePct: z.number().min(0).max(30),
  includeCeiling: z.boolean(),
  pricePerL: z.number().min(0).max(500).optional(),
});
