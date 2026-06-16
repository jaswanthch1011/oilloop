import { CO2_PER_LITER, BIODIESEL_PER_LITER, OIL_GRADES } from './constants';

export function calculateCO2Saved(liters: number): number {
  return Math.round(liters * CO2_PER_LITER * 100) / 100;
}

export function calculateBiodiesel(liters: number): number {
  return Math.round(liters * BIODIESEL_PER_LITER * 100) / 100;
}

export function getPointsPerLiter(oilType: string): number {
  if (OIL_GRADES.GRADE_1.types.includes(oilType as any)) return OIL_GRADES.GRADE_1.points;
  if (OIL_GRADES.GRADE_2.types.includes(oilType as any)) return OIL_GRADES.GRADE_2.points;
  if (OIL_GRADES.GRADE_3.types.includes(oilType as any)) return OIL_GRADES.GRADE_3.points;
  if (OIL_GRADES.GRADE_4.types.includes(oilType as any)) return OIL_GRADES.GRADE_4.points;
  return 100; // Default
}

export function getOilGrade(oilType: string): string {
  if (OIL_GRADES.GRADE_1.types.includes(oilType as any)) return 'Grade 1 (Premium)';
  if (OIL_GRADES.GRADE_2.types.includes(oilType as any)) return 'Grade 2 (Standard)';
  if (OIL_GRADES.GRADE_3.types.includes(oilType as any)) return 'Grade 3 (Industrial/Heavy)';
  if (OIL_GRADES.GRADE_4.types.includes(oilType as any)) return 'Grade 4 (Degraded/Mixed)';
  return 'Standard';
}

export function calculatePoints(volume: number, oilType: string, multiplier: number = 1): number {
  const base = getPointsPerLiter(oilType);
  return Math.round(base * volume * multiplier);
}
