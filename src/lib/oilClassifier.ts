/**
 * OilLoop AI Classifier Engine
 * ─────────────────────────────
 * Multi-stage classification pipeline:
 *   Stage 1 — COCO-SSD: Detect containers (bottle, cup, bowl, vase)
 *   Stage 2 — MobileNet: Classify image semantics to filter non-oil items
 *   Stage 3 — Color Analysis: Extract dominant color from detection region
 *   Stage 4 — Brand/Type Matching: Map visual signature to oil database
 *
 * STRICT rejection: Default stance is REJECT. Image must pass multiple
 * gates before being accepted as an oil container.
 */

import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { calculatePoints } from './calculations';

// ── Oil Visual Signatures ──

export interface OilSignature {
  brandName: string;
  oilType: string;
  volumes: number[];
  pointsMultiplier: number;
  colorProfile: {
    hueMin: number;
    hueMax: number;
    satMin: number;
    satMax: number;
    lightMin: number;
    lightMax: number;
  };
  weight: number;
}

export const OIL_SIGNATURES: OilSignature[] = [
  // ── Fortune ──
  { brandName: 'Fortune', oilType: 'Sunflower Oil', volumes: [1, 2, 5], pointsMultiplier: 1.2,
    colorProfile: { hueMin: 35, hueMax: 55, satMin: 60, satMax: 100, lightMin: 45, lightMax: 70 }, weight: 10 },
  { brandName: 'Fortune', oilType: 'Canola-dominant Generic Vegetable Oil', volumes: [1, 2, 5], pointsMultiplier: 1.2,
    colorProfile: { hueMin: 20, hueMax: 40, satMin: 70, satMax: 100, lightMin: 30, lightMax: 55 }, weight: 8 },
  { brandName: 'Fortune', oilType: 'Soybean Oil', volumes: [1, 2, 5], pointsMultiplier: 1.2,
    colorProfile: { hueMin: 40, hueMax: 60, satMin: 40, satMax: 80, lightMin: 50, lightMax: 75 }, weight: 7 },
  { brandName: 'Fortune', oilType: 'Refined Rice Bran Oil', volumes: [1, 2, 5], pointsMultiplier: 1.2,
    colorProfile: { hueMin: 35, hueMax: 50, satMin: 30, satMax: 70, lightMin: 55, lightMax: 80 }, weight: 6 },
  // ── Saffola ──
  { brandName: 'Saffola', oilType: 'Sunflower Oil', volumes: [1, 2, 5], pointsMultiplier: 1.3,
    colorProfile: { hueMin: 38, hueMax: 55, satMin: 55, satMax: 100, lightMin: 50, lightMax: 72 }, weight: 10 },
  { brandName: 'Saffola', oilType: 'Refined Rice Bran Oil', volumes: [1, 2, 5], pointsMultiplier: 1.3,
    colorProfile: { hueMin: 35, hueMax: 50, satMin: 30, satMax: 65, lightMin: 55, lightMax: 78 }, weight: 6 },
  { brandName: 'Saffola', oilType: 'Canola Oil', volumes: [0.5, 1, 2], pointsMultiplier: 1.3,
    colorProfile: { hueMin: 55, hueMax: 90, satMin: 40, satMax: 85, lightMin: 35, lightMax: 60 }, weight: 9 },
  // ── Dhara ──
  { brandName: 'Dhara', oilType: 'Canola-dominant Generic Vegetable Oil', volumes: [1, 2, 5], pointsMultiplier: 1.1,
    colorProfile: { hueMin: 18, hueMax: 38, satMin: 70, satMax: 100, lightMin: 30, lightMax: 52 }, weight: 9 },
  { brandName: 'Dhara', oilType: 'Sunflower Oil', volumes: [1, 2, 5], pointsMultiplier: 1.1,
    colorProfile: { hueMin: 38, hueMax: 55, satMin: 55, satMax: 95, lightMin: 48, lightMax: 70 }, weight: 8 },
  { brandName: 'Dhara', oilType: 'Soy-dominant Generic Vegetable Oil', volumes: [1, 2, 5], pointsMultiplier: 1.1,
    colorProfile: { hueMin: 25, hueMax: 45, satMin: 50, satMax: 90, lightMin: 40, lightMax: 65 }, weight: 7 },
  // ── Sundrop ──
  { brandName: 'Sundrop', oilType: 'Sunflower Oil', volumes: [1, 2, 5], pointsMultiplier: 1.15,
    colorProfile: { hueMin: 38, hueMax: 55, satMin: 60, satMax: 100, lightMin: 48, lightMax: 72 }, weight: 9 },
  { brandName: 'Sundrop', oilType: 'Refined Rice Bran Oil', volumes: [1, 2, 5], pointsMultiplier: 1.15,
    colorProfile: { hueMin: 35, hueMax: 50, satMin: 30, satMax: 65, lightMin: 55, lightMax: 78 }, weight: 5 },
  // ── Nature Fresh ──
  { brandName: 'Nature Fresh', oilType: 'Canola-dominant Generic Vegetable Oil', volumes: [1, 2, 5], pointsMultiplier: 1.0,
    colorProfile: { hueMin: 18, hueMax: 40, satMin: 65, satMax: 100, lightMin: 28, lightMax: 55 }, weight: 7 },
  { brandName: 'Nature Fresh', oilType: 'Sunflower Oil', volumes: [1, 2, 5], pointsMultiplier: 1.0,
    colorProfile: { hueMin: 38, hueMax: 55, satMin: 55, satMax: 95, lightMin: 48, lightMax: 70 }, weight: 6 },
  { brandName: 'Nature Fresh', oilType: 'Soybean Oil', volumes: [1, 2, 5], pointsMultiplier: 1.0,
    colorProfile: { hueMin: 40, hueMax: 58, satMin: 40, satMax: 80, lightMin: 50, lightMax: 72 }, weight: 5 },
  // ── Patanjali ──
  { brandName: 'Patanjali', oilType: 'Canola-dominant Generic Vegetable Oil', volumes: [1, 2, 5], pointsMultiplier: 1.1,
    colorProfile: { hueMin: 18, hueMax: 40, satMin: 70, satMax: 100, lightMin: 28, lightMax: 52 }, weight: 8 },
  { brandName: 'Patanjali', oilType: 'Coconut Oil', volumes: [0.5, 1, 2], pointsMultiplier: 1.1,
    colorProfile: { hueMin: 0, hueMax: 30, satMin: 0, satMax: 20, lightMin: 80, lightMax: 100 }, weight: 9 },
  { brandName: 'Patanjali', oilType: 'Soy-dominant Generic Vegetable Oil', volumes: [1, 2, 5], pointsMultiplier: 1.1,
    colorProfile: { hueMin: 25, hueMax: 45, satMin: 50, satMax: 85, lightMin: 40, lightMax: 65 }, weight: 6 },
  // ── KS Oils ──
  { brandName: 'KS Oils', oilType: 'Canola-dominant Generic Vegetable Oil', volumes: [1, 2, 5, 15], pointsMultiplier: 1.0,
    colorProfile: { hueMin: 18, hueMax: 40, satMin: 65, satMax: 100, lightMin: 28, lightMax: 52 }, weight: 6 },
  { brandName: 'KS Oils', oilType: 'Sunflower Oil', volumes: [1, 2, 5, 15], pointsMultiplier: 1.0,
    colorProfile: { hueMin: 38, hueMax: 55, satMin: 55, satMax: 95, lightMin: 48, lightMax: 70 }, weight: 5 },
  // ── Figaro ──
  { brandName: 'Figaro', oilType: 'Canola Oil', volumes: [0.5, 1, 2], pointsMultiplier: 1.5,
    colorProfile: { hueMin: 55, hueMax: 95, satMin: 40, satMax: 85, lightMin: 30, lightMax: 60 }, weight: 10 },
];

// ── STRICT: Only MobileNet classes that specifically indicate a CONTAINER ──
// These are the actual ImageNet class names that MobileNet v2 can return
const CONTAINER_MOBILENET_KEYWORDS = [
  'water bottle',
  'bottle',
  'whiskey jug',
  'jug',
  'water jug',
  'jar',
  'pitcher',
  'flask',
  'plastic bottle',
  'milk can',
  'canteen',
  'packet',
  'pouch',
  'sachet',
  'bag',
  'plastic bag',
  'envelope', // Packets are often classified as envelopes or bags
  'soap dispenser',
  'lotion',
  'shampoo',
  'plastic wrapping',
  'pillow',
  'sunscreen',
  'sachet',
  'bag',
  'pouch',
];

// MobileNet classes for cooking/food/oil context (secondary signal)
const FOOD_OIL_KEYWORDS = [
  'olive oil',
  'cooking oil',
  'vegetable oil',
  'canola oil',
  'corn oil',
  'sunflower',
  'safflower',
  'refined',
  'soybean',
  'palm oil',
  'coconut oil',
  'mustard oil',
  'frying pan',
  'wok',
  'spatula',
  'mixing bowl',
  'pot',
  'caldron',
  'soup bowl',
  'ladle',
];

// COCO-SSD classes for containers
const CONTAINER_COCO_CLASSES = new Set(['bottle', 'cup', 'bowl', 'vase', 'wine glass']);

// COCO-SSD classes that definitively mean NOT oil
const COCO_REJECTION_CLASSES = new Set([
  'person', 'dog', 'cat', 'bird', 'horse', 'sheep', 'cow',
  'elephant', 'bear', 'zebra', 'giraffe', 'car', 'truck', 'bus',
  'train', 'airplane', 'bicycle', 'motorcycle', 'boat', 'laptop',
  'keyboard', 'mouse', 'cell phone', 'tv', 'couch', 'bed',
  'toilet', 'clock', 'book', 'teddy bear', 'sports ball', 'kite',
  'skateboard', 'surfboard', 'tennis racket', 'frisbee', 'skis',
  'snowboard', 'baseball bat', 'baseball glove',
]);

// MobileNet classes that strongly indicate NOT oil
const MOBILENET_REJECTION_KEYWORDS = [
  'dog', 'cat', 'bird', 'fish', 'snake', 'lizard', 'spider',
  'person', 'face', 'man', 'woman', 'boy', 'girl',
  'car', 'truck', 'bus', 'train', 'airplane', 'bicycle', 'motorcycle',
  'laptop', 'computer', 'keyboard', 'monitor', 'screen', 'television',
  'phone', 'cell phone', 'smartphone',
  'shoe', 'sandal', 'boot', 'sneaker',
  'shirt', 'dress', 'suit', 'coat', 'jacket',
  'house', 'building', 'church', 'castle', 'tower',
  'tree', 'flower', 'mushroom', 'grass', 'mountain', 'cliff', 'valley',
  'beach', 'ocean', 'lake', 'river', 'waterfall',
  'clock', 'watch', 'compass',
  'book', 'newspaper',
  'piano', 'guitar', 'drum', 'violin',
  'chair', 'couch', 'sofa', 'bed', 'desk', 'table',
  'toilet', 'bathtub', 'shower',
  'teddy bear', 'toy', 'doll', 'ball',
  'wine bottle', 'beer bottle', 'pop bottle', 'soda bottle',
  'beer glass', 'goblet', 'wine glass',
  'coffee', 'tea', 'espresso', 'mug', 'cup', 'teacup',
  'bread', 'cake', 'cookie', 'biscuit', 'muffin', 'pastry', 'bun',
  'pizza', 'hamburger', 'burger', 'sandwich', 'hotdog',
  'apple', 'banana', 'orange', 'strawberry', 'grape', 'lemon',
  'broccoli', 'carrot', 'potato', 'tomato', 'cucumber',
  'meat', 'steak', 'chicken', 'fish', 'egg', 'omelet',
  'ice cream', 'chocolate', 'candy', 'honey', 'syrup', 'juice',
  'oil filter', 'engine', 'machine', 'tool',
];

export interface ClassificationResult {
  isOilImage: boolean;
  errorMessage: string;
  brand: string;
  oilType: string;
  volume: number;
  confidence: number;
  pointsAwarded: number;
  mlDetections: string[];
  colorAnalysis: { hue: number; saturation: number; lightness: number; dominantColor: string };
  classificationDetails: string[];
}

export interface ModelBundle {
  cocoModel: cocoSsd.ObjectDetection;
  mobileNetModel: mobilenet.MobileNet;
}

/**
 * Load both models
 */
export async function loadModels(): Promise<ModelBundle> {
  await tf.ready();
  const [cocoModel, mobileNetModel] = await Promise.all([
    cocoSsd.load({ base: 'lite_mobilenet_v2' }),
    mobilenet.load({ version: 2, alpha: 1.0 }),
  ]);
  return { cocoModel, mobileNetModel };
}

/**
 * Analyze image colors in a region (or full image)
 */
function analyzeColors(
  canvas: HTMLCanvasElement,
  region?: { x: number; y: number; w: number; h: number }
): { hue: number; saturation: number; lightness: number; dominantColor: string } {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { hue: 0, saturation: 0, lightness: 50, dominantColor: 'unknown' };

  const x = region ? Math.max(0, Math.floor(region.x)) : 0;
  const y = region ? Math.max(0, Math.floor(region.y)) : 0;
  const w = region ? Math.min(Math.floor(region.w), canvas.width - x) : canvas.width;
  const h = region ? Math.min(Math.floor(region.h), canvas.height - y) : canvas.height;

  if (w <= 0 || h <= 0) return { hue: 0, saturation: 0, lightness: 50, dominantColor: 'unknown' };

  const imageData = ctx.getImageData(x, y, w, h);
  const data = imageData.data;

  let totalH = 0, totalS = 0, totalL = 0, count = 0;

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    totalH += h * 360;
    totalS += s * 100;
    totalL += l * 100;
    count++;
  }

  if (count === 0) return { hue: 0, saturation: 0, lightness: 50, dominantColor: 'unknown' };

  const avgH = totalH / count;
  const avgS = totalS / count;
  const avgL = totalL / count;

  let dominantColor: string;
  if (avgS < 15) {
    dominantColor = avgL > 70 ? 'white/clear' : avgL > 40 ? 'gray' : 'dark';
  } else if (avgH >= 0 && avgH < 15) {
    dominantColor = 'red/amber';
  } else if (avgH >= 15 && avgH < 35) {
    dominantColor = 'dark golden/amber';
  } else if (avgH >= 35 && avgH < 55) {
    dominantColor = 'golden/yellow';
  } else if (avgH >= 55 && avgH < 90) {
    dominantColor = 'yellow-green/olive';
  } else if (avgH >= 90 && avgH < 150) {
    dominantColor = 'green';
  } else if (avgH >= 150 && avgH < 210) {
    dominantColor = 'cyan/blue';
  } else if (avgH >= 210 && avgH < 270) {
    dominantColor = 'blue';
  } else if (avgH >= 270 && avgH < 330) {
    dominantColor = 'purple';
  } else {
    dominantColor = 'red/pink';
  }

  return {
    hue: Math.round(avgH),
    saturation: Math.round(avgS),
    lightness: Math.round(avgL),
    dominantColor,
  };
}

function colorMatchScore(
  color: { hue: number; saturation: number; lightness: number },
  profile: OilSignature['colorProfile']
): number {
  let score = 0;

  if (color.hue >= profile.hueMin && color.hue <= profile.hueMax) {
    score += 40;
  } else {
    const hueDist = Math.min(
      Math.abs(color.hue - profile.hueMin),
      Math.abs(color.hue - profile.hueMax)
    );
    score += Math.max(0, 40 - hueDist * 2);
  }

  if (color.saturation >= profile.satMin && color.saturation <= profile.satMax) {
    score += 30;
  } else {
    const satDist = Math.min(
      Math.abs(color.saturation - profile.satMin),
      Math.abs(color.saturation - profile.satMax)
    );
    score += Math.max(0, 30 - satDist);
  }

  if (color.lightness >= profile.lightMin && color.lightness <= profile.lightMax) {
    score += 30;
  } else {
    const lightDist = Math.min(
      Math.abs(color.lightness - profile.lightMin),
      Math.abs(color.lightness - profile.lightMax)
    );
    score += Math.max(0, 30 - lightDist);
  }

  return score;
}

/**
 * Check if a MobileNet label string contains any keyword from a list.
 * MobileNet returns comma-separated labels like "water bottle, pop bottle, soda bottle"
 */
function labelContainsAny(label: string, keywords: string[]): boolean {
  const lower = label.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw)) return true;
  }
  return false;
}

/**
 * Main classification pipeline — STRICT rejection by default
 */
export async function classifyOilImage(
  source: HTMLVideoElement | HTMLImageElement,
  canvas: HTMLCanvasElement,
  models: ModelBundle
): Promise<ClassificationResult> {
  const details: string[] = [];

  // ── Stage 1: Draw frame to canvas ──
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return makeErrorResult('Canvas not available');
  }

  if (source instanceof HTMLVideoElement) {
    canvas.width = source.videoWidth || 640;
    canvas.height = source.videoHeight || 480;
  } else {
    canvas.width = source.naturalWidth || source.width;
    canvas.height = source.naturalHeight || source.height;
  }
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  details.push(`Frame captured: ${canvas.width}×${canvas.height}`);

  // ── Stage 2: COCO-SSD Object Detection ──
  const cocoPredictions = await models.cocoModel.detect(source);
  const cocoLabels = cocoPredictions
    .filter(p => p.score > 0.25)
    .map(p => ({ label: p.class, score: p.score, bbox: p.bbox }));

  details.push(`COCO-SSD: ${cocoLabels.length} objects detected`);
  cocoLabels.forEach(l => details.push(`  → ${l.label} (${(l.score * 100).toFixed(0)}%)`));

  // Check for containers in COCO
  const containerDetections = cocoLabels.filter(l =>
    CONTAINER_COCO_CLASSES.has(l.label.toLowerCase())
  );
  const hasContainer = containerDetections.length > 0;

  // Check for rejection objects in COCO
  const cocoRejections = cocoLabels.filter(l =>
    COCO_REJECTION_CLASSES.has(l.label.toLowerCase()) && l.score > 0.35
  );
  const hasCocoRejection = cocoRejections.length > 0;

  // Draw detection boxes
  cocoLabels.forEach(pred => {
    const [x, y, w, h] = pred.bbox;
    const isContainer = CONTAINER_COCO_CLASSES.has(pred.label.toLowerCase());
    ctx.strokeStyle = isContainer ? '#22c55e' : '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.font = 'bold 14px Inter, sans-serif';
    const textW = ctx.measureText(`${pred.label} ${(pred.score * 100).toFixed(0)}%`).width + 10;
    ctx.fillRect(x, y - 22, textW, 22);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${pred.label} ${(pred.score * 100).toFixed(0)}%`, x + 5, y - 5);
  });

  // ── Stage 3: MobileNet Classification ──
  const mobilenetPredictions = await models.mobileNetModel.classify(source, 10);
  const mnetLabels = mobilenetPredictions
    .filter(p => p.probability > 0.01)
    .map(p => ({ label: p.className.toLowerCase(), prob: p.probability }));

  details.push(`MobileNet: ${mnetLabels.length} classifications`);
  mnetLabels.forEach(l => details.push(`  → ${l.label} (${(l.prob * 100).toFixed(1)}%)`));

  // ═══════════════════════════════════════════════════
  // ── GATE 1: Check if MobileNet sees a container ──
  // ═══════════════════════════════════════════════════
  let mnetSeesContainer = false;
  let mnetContainerConfidence = 0;
  for (const pred of mnetLabels) {
    if (labelContainsAny(pred.label, CONTAINER_MOBILENET_KEYWORDS)) {
      mnetSeesContainer = true;
      mnetContainerConfidence = Math.max(mnetContainerConfidence, pred.prob);
    }
  }

  // Check if MobileNet sees food/oil context
  let mnetSeesFoodOil = false;
  for (const pred of mnetLabels) {
    if (labelContainsAny(pred.label, FOOD_OIL_KEYWORDS)) {
      mnetSeesFoodOil = true;
    }
  }

  // Check if MobileNet sees rejection objects
  let mnetSeesRejection = false;
  let mnetRejectionLabel = '';
  let mnetRejectionProb = 0;
  for (const pred of mnetLabels) {
    if (labelContainsAny(pred.label, MOBILENET_REJECTION_KEYWORDS) && pred.prob > 0.05) {
      // Only reject if it's the TOP prediction or very high confidence
      if (pred.prob > 0.1 || pred === mnetLabels[0]) {
        mnetSeesRejection = true;
        mnetRejectionLabel = pred.label;
        mnetRejectionProb = pred.prob;
      }
    }
  }

  details.push(`──── Validation Gates ────`);
  details.push(`COCO container detected: ${hasContainer} (${containerDetections.length} found)`);
  details.push(`COCO rejection detected: ${hasCocoRejection} (${cocoRejections.map(r => r.label).join(', ')})`);
  details.push(`MobileNet sees container: ${mnetSeesContainer} (conf: ${(mnetContainerConfidence * 100).toFixed(1)}%)`);
  details.push(`MobileNet sees food/oil: ${mnetSeesFoodOil}`);
  details.push(`MobileNet sees rejection: ${mnetSeesRejection} (${mnetRejectionLabel} @ ${(mnetRejectionProb * 100).toFixed(1)}%)`);

  const allDetectionLabels = [
    ...cocoLabels.map(l => `${l.label} (${(l.score * 100).toFixed(0)}%)`),
    ...mnetLabels.slice(0, 5).map(l => `${l.label.split(',')[0].trim()} (${(l.prob * 100).toFixed(1)}%)`),
  ];

  // ═══════════════════════════════════════════
  // ── GATE 2: REJECTION CHECKS (strict)    ──
  // ═══════════════════════════════════════════

  // Rule 1: If COCO detects a person/animal/vehicle and NO container → REJECT
  if (hasCocoRejection && !hasContainer) {
    details.push(`❌ REJECTED: COCO found non-oil object and no container`);
    return makeErrorResult(
      `❌ This is not a cooking oil image!\n\nThe AI detected: ${cocoRejections.map(r => r.label).join(', ')}\n\nPlease scan a used cooking oil bottle, packet, or container. The AI needs to see an actual oil container to identify the brand and award points.`,
      details, allDetectionLabels
    );
  }

  // Rule 2: If MobileNet's top predictions are rejection classes and no container is seen → REJECT
  if (mnetSeesRejection && !mnetSeesContainer && !hasContainer) {
    details.push(`❌ REJECTED: MobileNet top prediction is non-oil and no container detected`);
    return makeErrorResult(
      `❌ No cooking oil detected!\n\nThe AI classified this image as: "${mnetRejectionLabel}"\n\nThis does not appear to be a cooking oil container. Please upload or scan a clear photo of an oil bottle or packet.`,
      details, allDetectionLabels
    );
  }

  // Rule 3: MUST have either a COCO container OR MobileNet container detection
  // OR very strong oil classification
  const hasStrongOilSignal = mnetSeesFoodOil && mnetLabels[0].prob > 0.15;

  if (!hasContainer && !mnetSeesContainer && !hasStrongOilSignal) {
    details.push(`❌ REJECTED: Neither COCO nor MobileNet detected a container, and oil signal is weak`);
    return makeErrorResult(
      `❌ No oil container found!\n\nThe AI could not detect any bottle, packet, jar, or container in this image.\n\nFor a successful scan:\n• Place a cooking oil bottle/packet in clear view\n• Ensure good lighting with no glare\n• The container should fill most of the frame\n• Avoid background clutter`,
      details, allDetectionLabels
    );
  }

  // Rule 4: If MobileNet sees rejection AND it's stronger than container detection → REJECT
  if (mnetSeesRejection && mnetRejectionProb > mnetContainerConfidence && !hasContainer) {
    details.push(`❌ REJECTED: Rejection signal stronger than container signal`);
    return makeErrorResult(
      `❌ This doesn't look like cooking oil.\n\nThe AI sees "${mnetRejectionLabel}" more strongly than any oil container. Please scan a clear image of a cooking oil bottle or packet.`,
      details, allDetectionLabels
    );
  }

  // Rule 5: HIGH CONFIDENCE REJECTION — if the AI is very sure it's a non-oil object
  if (mnetSeesRejection && mnetRejectionProb > 0.45) {
    details.push(`❌ REJECTED: High-confidence non-oil object (${mnetRejectionLabel})`);
    return makeErrorResult(
      `❌ Object Identified: ${mnetRejectionLabel.split(',')[0].toUpperCase()}\n\nThis is not a cooking oil container. Please scan used cooking oil to earn points.`,
      details, allDetectionLabels
    );
  }

  details.push(`✅ Passed all validation gates`);

  // ── Stage 5: Color Analysis ──
  let colorRegion: { x: number; y: number; w: number; h: number } | undefined;
  if (containerDetections.length > 0) {
    const [x, y, w, h] = containerDetections[0].bbox;
    colorRegion = {
      x: x + w * 0.2,
      y: y + h * 0.3,
      w: w * 0.6,
      h: h * 0.4,
    };
  }

  const colorAnalysis = analyzeColors(canvas, colorRegion);
  details.push(`Color: H=${colorAnalysis.hue} S=${colorAnalysis.saturation} L=${colorAnalysis.lightness} (${colorAnalysis.dominantColor})`);

  // ── Stage 6: Match against oil signatures ──
  const MIN_OIL_MATCH_SCORE = 42; // Threshold for accepting as oil
  const scores: { sig: OilSignature; score: number; cScore: number }[] = [];

  for (const sig of OIL_SIGNATURES) {
    let matchScore = 0;

    // Color match (0-100, weighted 50%)
    const cScore = colorMatchScore(colorAnalysis, sig.colorProfile);
    matchScore += cScore * 0.5;

    // Base weight (up to 10 points)
    matchScore += sig.weight;

    // Container match bonus
    if (hasContainer || mnetSeesContainer) matchScore += 25;

    // Food/oil context bonus
    if (mnetSeesFoodOil) matchScore += 15;

    scores.push({ sig, score: matchScore, cScore });
  }

  scores.sort((a, b) => b.score - a.score);

  const bestMatch = scores[0];
  const sig = bestMatch.sig;

  details.push(`Final validation: best score ${bestMatch.score.toFixed(1)} (min required: ${MIN_OIL_MATCH_SCORE})`);

  // ══════════════════════════════════════════════════════════
  // ── GATE 3: Final score threshold (Is it actually oil?) ──
  // ══════════════════════════════════════════════════════════
  if (bestMatch.score < MIN_OIL_MATCH_SCORE) {
    details.push(`❌ REJECTED: Low match score (${bestMatch.score.toFixed(1)})`);
    return makeErrorResult(
      `❌ Could not verify as Cooking Oil.\n\nWhile the AI saw a container or packet, the contents do not match any known cooking oil profiles. It might be water, juice, or a different liquid.\n\nTips:\n• Ensure the oil color/label is visible\n• Avoid scanning empty packets\n• Try a different angle with less glare`,
      details, allDetectionLabels
    );
  }

  // Calculate confidence based on match score (normalize to 60-95%)
  const rawConfidence = Math.min(bestMatch.score, 100);
  const confidence = Math.round(60 + (rawConfidence / 100) * 35);

  // Select volume based on container size estimate
  let volume = sig.volumes[0];
  if (containerDetections.length > 0) {
    const [, , w, h] = containerDetections[0].bbox;
    const containerArea = w * h;
    const frameArea = canvas.width * canvas.height;
    const sizeRatio = containerArea / frameArea;

    if (sizeRatio > 0.4) {
      volume = sig.volumes[sig.volumes.length - 1];
    } else if (sizeRatio > 0.15) {
      volume = sig.volumes[Math.floor(sig.volumes.length / 2)];
    }
    details.push(`Container size ratio: ${(sizeRatio * 100).toFixed(1)}% → ${volume}L`);
  }

  const points = calculatePoints(volume, sig.oilType, sig.pointsMultiplier);

  details.push(`Best match: ${sig.brandName} ${sig.oilType} (score: ${bestMatch.score.toFixed(1)})`);
  details.push(`Top 3 matches:`);
  scores.slice(0, 3).forEach((s, i) =>
    details.push(`  ${i + 1}. ${s.sig.brandName} ${s.sig.oilType} — ${s.score.toFixed(1)}`)
  );

  const mlDetections = [
    ...cocoLabels.map(l => `${l.label} (${(l.score * 100).toFixed(0)}%)`),
    ...mnetLabels.slice(0, 3).map(l => `${l.label.split(',')[0].trim()} (${(l.prob * 100).toFixed(1)}%)`),
  ];

  return {
    isOilImage: true,
    errorMessage: '',
    brand: sig.brandName,
    oilType: sig.oilType,
    volume,
    confidence,
    pointsAwarded: points,
    mlDetections,
    colorAnalysis,
    classificationDetails: details,
  };
}

function makeErrorResult(
  errorMessage: string,
  details: string[] = [],
  mlDetections: string[] = []
): ClassificationResult {
  return {
    isOilImage: false,
    errorMessage,
    brand: '',
    oilType: '',
    volume: 0,
    confidence: 0,
    pointsAwarded: 0,
    mlDetections,
    colorAnalysis: { hue: 0, saturation: 0, lightness: 0, dominantColor: 'unknown' },
    classificationDetails: details,
  };
}
