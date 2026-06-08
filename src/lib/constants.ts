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

export const OIL_TYPES = [
  'Sunflower Oil',
  'Mustard Oil',
  'Coconut Oil',
  'Groundnut Oil',
  'Soybean Oil',
  'Palm Oil',
  'Olive Oil',
  'Rice Bran Oil',
  'Sesame Oil',
  'Canola Oil',
];

export const OIL_BRANDS = [
  { name: 'Fortune', types: ['Sunflower Oil', 'Mustard Oil', 'Soybean Oil', 'Rice Bran Oil'], volumes: [1, 2, 5], pointsMultiplier: 1.2 },
  { name: 'Saffola', types: ['Sunflower Oil', 'Rice Bran Oil', 'Olive Oil'], volumes: [1, 2, 5], pointsMultiplier: 1.3 },
  { name: 'Dhara', types: ['Mustard Oil', 'Sunflower Oil', 'Groundnut Oil'], volumes: [1, 2, 5], pointsMultiplier: 1.1 },
  { name: 'Sundrop', types: ['Sunflower Oil', 'Rice Bran Oil'], volumes: [1, 2, 5], pointsMultiplier: 1.15 },
  { name: 'Nature Fresh', types: ['Mustard Oil', 'Sunflower Oil', 'Soybean Oil'], volumes: [1, 2, 5], pointsMultiplier: 1.0 },
  { name: 'Patanjali', types: ['Mustard Oil', 'Coconut Oil', 'Groundnut Oil'], volumes: [1, 2, 5], pointsMultiplier: 1.1 },
  { name: 'KS Oils', types: ['Mustard Oil', 'Sunflower Oil'], volumes: [1, 2, 5, 15], pointsMultiplier: 1.0 },
  { name: 'Figaro', types: ['Olive Oil'], volumes: [0.5, 1, 2], pointsMultiplier: 1.5 },
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
