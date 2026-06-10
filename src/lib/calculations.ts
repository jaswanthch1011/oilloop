import { CO2_PER_LITER, BIODIESEL_PER_LITER, BASE_POINTS_PER_LITER } from './constants';

export function calculateCO2Saved(liters: number): number {
  return Math.round(liters * CO2_PER_LITER * 100) / 100;
}

export function calculateBiodiesel(liters: number): number {
  return Math.round(liters * BIODIESEL_PER_LITER * 100) / 100;
}

export function calculatePoints(volume: number, oilType: string, multiplier: number = 1): number {
  const gradePoints: Record<string, number> = {
    // Grade 1 (150 pts/L)
    'Canola Oil': 150,
    'Sunflower Oil': 150,
    'Canola-dominant Generic Vegetable Oil': 150,
    
    // Grade 2 (125 pts/L)
    'Soybean Oil': 125,
    'Soy-dominant Generic Vegetable Oil': 125,
    'Refined Rice Bran Oil': 125,
    
    // Grade 3 (100 pts/L)
    'Palm Oil': 100,
    'Coconut Oil': 100,
    
    // Grade 4 (75 pts/L)
    'Crude Rice Bran Oil': 75,
    'Animal Fats (Tallow, Lard)': 75,
    'Heavily Degraded Restaurant Grease': 75,
  };

  const base = gradePoints[oilType] || 100;
  return Math.round(base * volume * multiplier);
}
