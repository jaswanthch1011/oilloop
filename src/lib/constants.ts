import type { EcoLevel } from '../types';

export const ECO_LEVELS: EcoLevel[] = [
  { level: 1, name: 'Seedling', icon: '🌱', minPoints: 0, maxPoints: 100 },
  { level: 2, name: 'Sprout', icon: '🌿', minPoints: 101, maxPoints: 500 },
  { level: 3, name: 'Tree', icon: '🌳', minPoints: 501, maxPoints: 2000 },
  { level: 4, name: 'Forest', icon: '🏔️', minPoints: 2001, maxPoints: 5000 },
  { level: 5, name: 'Planet Saver', icon: '🌍', minPoints: 5001, maxPoints: 99999 },
];

export const CO2_PER_LITER = 2.5;       // kg CO₂ saved per liter UCO
export const BIODIESEL_PER_LITER = 0.85; // liters biodiesel per liter UCO
export const BASE_POINTS_PER_LITER = 50;

export const OIL_GRADES = {
  GRADE_1: { points: 150, types: ['Canola Oil', 'Sunflower Oil', 'Canola-dominant Generic Vegetable Oil'] },
  GRADE_2: { points: 125, types: ['Soybean Oil', 'Soy-dominant Generic Vegetable Oil', 'Refined Rice Bran Oil'] },
  GRADE_3: { points: 100, types: ['Palm Oil', 'Coconut Oil'] },
  GRADE_4: { points: 75, types: ['Crude Rice Bran Oil', 'Animal Fats (Tallow, Lard)', 'Heavily Degraded Restaurant Grease'] },
} as const;

export const OIL_TYPES = [
  ...OIL_GRADES.GRADE_1.types,
  ...OIL_GRADES.GRADE_2.types,
  ...OIL_GRADES.GRADE_3.types,
  ...OIL_GRADES.GRADE_4.types,
];

export const OIL_BRANDS = [
  { name: 'Fortune', types: ['Sunflower Oil', 'Soybean Oil', 'Refined Rice Bran Oil', 'Canola-dominant Generic Vegetable Oil'], volumes: [1, 2, 5], pointsMultiplier: 1.2 },
  { name: 'Saffola', types: ['Sunflower Oil', 'Refined Rice Bran Oil', 'Canola Oil'], volumes: [1, 2, 5], pointsMultiplier: 1.3 },
  { name: 'Dhara', types: ['Soybean Oil', 'Sunflower Oil', 'Palm Oil'], volumes: [1, 2, 5], pointsMultiplier: 1.1 },
  { name: 'Sundrop', types: ['Sunflower Oil', 'Refined Rice Bran Oil'], volumes: [1, 2, 5], pointsMultiplier: 1.15 },
  { name: 'Nature Fresh', types: ['Soybean Oil', 'Sunflower Oil', 'Canola-dominant Generic Vegetable Oil'], volumes: [1, 2, 5], pointsMultiplier: 1.0 },
  { name: 'Patanjali', types: ['Coconut Oil', 'Soybean Oil', 'Crude Rice Bran Oil'], volumes: [1, 2, 5], pointsMultiplier: 1.1 },
  { name: 'KS Oils', types: ['Soybean Oil', 'Sunflower Oil', 'Heavily Degraded Restaurant Grease'], volumes: [1, 2, 5, 15], pointsMultiplier: 1.0 },
  { name: 'Figaro', types: ['Canola Oil', 'Animal Fats (Tallow, Lard)'], volumes: [0.5, 1, 2], pointsMultiplier: 1.5 },
];

export const AVATAR_OPTIONS = [
  '🌱', '🌿', '🌳', '🌍', '🍃', '♻️', '🫧', '💧', '⚡', '🌻', '🦋', '🐝',
];

export const REWARD_CATEGORIES = [
  { id: 'groceries', name: 'Groceries', icon: '🛒' },
  { id: 'personal_care', name: 'Personal Care', icon: '🧴' },
  { id: 'home', name: 'Home', icon: '🏠' },
  { id: 'eco', name: 'Eco Products', icon: '🌿' },
] as const;
