import { CO2_PER_LITER, BIODIESEL_PER_LITER, BASE_POINTS_PER_LITER } from './constants';

export function calculateCO2Saved(liters: number): number {
  return Math.round(liters * CO2_PER_LITER * 100) / 100;
}

export function calculateBiodiesel(liters: number): number {
  return Math.round(liters * BIODIESEL_PER_LITER * 100) / 100;
}

export function calculatePoints(volume: number, multiplier: number = 1): number {
  return Math.round(BASE_POINTS_PER_LITER * volume * multiplier);
}
