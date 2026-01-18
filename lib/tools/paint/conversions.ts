// Conversion constants
const FEET_TO_METERS = 0.3048;
const METERS_TO_FEET = 3.28084;
const LITERS_TO_GALLONS = 0.264172;
const GALLONS_TO_LITERS = 3.78541;
const M2_PER_L_TO_FT2_PER_GAL = 10.764;

// Length conversions
export function feetToMeters(ft: number): number {
  return ft * FEET_TO_METERS;
}

export function metersToFeet(m: number): number {
  return m * METERS_TO_FEET;
}

// Volume conversions
export function litersToGallons(l: number): number {
  return l * LITERS_TO_GALLONS;
}

export function gallonsToLiters(gal: number): number {
  return gal * GALLONS_TO_LITERS;
}

// Coverage conversions
export function coverageM2PerLToFt2PerGal(m2PerL: number): number {
  return m2PerL * M2_PER_L_TO_FT2_PER_GAL;
}

export function coverageFt2PerGalToM2PerL(ft2PerGal: number): number {
  return ft2PerGal / M2_PER_L_TO_FT2_PER_GAL;
}

// Area conversions
export function m2ToFt2(m2: number): number {
  return m2 * (METERS_TO_FEET * METERS_TO_FEET);
}

export function ft2ToM2(ft2: number): number {
  return ft2 * (FEET_TO_METERS * FEET_TO_METERS);
}
