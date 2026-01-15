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

  return cans;
}

export function calcPaint(input: PaintProjectInput): PaintProjectResult {
  const perimeter = 2 * (input.lengthM + input.widthM);
  const wallAreaM2 = perimeter * input.heightM;

  const openingsAreaM2 =
    input.doorsCount * DOOR_M2 + input.windowsCount * WINDOW_M2;

  const netWallAreaM2 = Math.max(0, wallAreaM2 - openingsAreaM2);

  const ceilingAreaM2 = input.includeCeiling
    ? input.lengthM * input.widthM
    : 0;

  const paintableAreaM2 = netWallAreaM2 + ceilingAreaM2;

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
