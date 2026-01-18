import type { PaintProjectInput, PaintProjectResult } from "./types";

const DOOR_M2 = 1.8;
const WINDOW_M2 = 1.2;
const CAN_SIZES_L = [10, 4, 2, 1];

function roundUp(value: number, step: number) {
  return Math.ceil(value / step) * step;
}

function recommendCans(litres: number) {
  let remaining = litres;
  const cans: { sizeL: number; qty: number }[] = [];

  for (const size of CAN_SIZES_L) {
    const qty = Math.floor(remaining / size);
    if (qty > 0) {
      cans.push({ sizeL: size, qty });
      remaining -= qty * size;
    }
  }

  if (remaining > 0) {
    cans.push({ sizeL: 1, qty: 1 });
  }

  // Merge duplicates (in case we add the same size twice later)
  const merged = new Map<number, number>();
  for (const c of cans) merged.set(c.sizeL, (merged.get(c.sizeL) ?? 0) + c.qty);

  return [...merged.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([sizeL, qty]) => ({ sizeL, qty }));
}

export function calcPaint(input: PaintProjectInput): PaintProjectResult {
  // --- 1) Compute total wall area depending on measurement mode ---
  let wallAreaM2 = 0;

  if (input.mode === "simple") {
    const lengthM = input.lengthM ?? 0;
    const widthM = input.widthM ?? 0;

    const perimeter = 2 * (lengthM + widthM);
    wallAreaM2 = perimeter * input.heightM;
  } else if (input.mode === "walls") {
    const totalWallLength = (input.walls ?? []).reduce(
      (sum, wall) => sum + (wall.lengthM ?? 0),
      0
    );
    wallAreaM2 = totalWallLength * input.heightM;
  }

  // --- 2) Areas to subtract ---
  const openingsAreaM2 =
    input.doorsCount * DOOR_M2 + input.windowsCount * WINDOW_M2;

  const excludedAreaM2 = (input.excludedAreas ?? []).reduce(
    (sum, ex) => sum + (ex.areaM2 ?? 0),
    0
  );

  // Wall area after subtracting openings + excluded areas (cabinets/tiles/etc.)
  const netWallAreaM2 = Math.max(0, wallAreaM2 - openingsAreaM2 - excludedAreaM2);

  // --- 3) Optional ceiling ---
  const ceilingAreaM2 =
    input.includeCeiling && input.mode === "simple"
      ? (input.lengthM ?? 0) * (input.widthM ?? 0)
      : input.includeCeiling
      ? 0
      : 0;

  // If in wall-by-wall mode, we don't know ceiling area unless user provides length/width.
  // We keep it at 0 unless you decide to add a ceiling area input later.
  const paintableAreaM2 = netWallAreaM2 + ceilingAreaM2;

  // --- 4) Convert area -> litres ---
  const litresRaw = (paintableAreaM2 * input.coats) / input.coverageM2PerL;
  const litresWithWaste = litresRaw * (1 + input.wastePct / 100);
  const litresRounded = roundUp(litresWithWaste, 0.5);

  const estimatedCost =
    typeof input.pricePerL === "number"
      ? Math.round(litresRounded * input.pricePerL)
      : undefined;

  return {
    wallAreaM2,
    ceilingAreaM2,
    openingsAreaM2,
    paintableAreaM2,
    litresRaw,
    litresWithWaste,
    litresRounded,
    recommendedCans: recommendCans(litresRounded),
    estimatedCost,
  };
}
