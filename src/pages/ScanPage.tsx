import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ScanLine, Zap, CheckCircle2, AlertCircle, Edit3, Loader2, Upload, XCircle, Info, Eye, ArrowRight } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { useAuth } from '../context/AuthContext';
import { OIL_BRANDS, OIL_TYPES, OIL_GRADES } from '../lib/constants';
import { calculatePoints, getOilGrade } from '../lib/calculations';
import {
  loadModels,
  classifyOilImage,
  type ModelBundle,
  type ClassificationResult,
} from '../lib/oilClassifier';

type ScanState = 'idle' | 'camera' | 'scanning' | 'result' | 'error' | 'manual' | 'upload' | 'details_form';

interface DetectionResult {
  brand: string;
  oilType: string;
  volume: number;
  confidence: number;
  pointsAwarded: number;
  mlDetections: string[];
  colorAnalysis?: { hue: number; saturation: number; lightness: number; dominantColor: string };
  classificationDetails?: string[];
}

export default function ScanPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<ScanState>('idle');
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [manualBrand, setManualBrand] = useState('');
  const [manualType, setManualType] = useState('');
  const [manualVolume, setManualVolume] = useState(1);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [errorTitle, setErrorTitle] = useState('Scan Failed');
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [errorDetections, setErrorDetections] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStage, setScanStage] = useState('');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Machine Learning temporary detection states (for user details form confirmation)
  const [mlDetectionsList, setMlDetectionsList] = useState<string[]>([]);
  const [mlColorAnalysis, setMlColorAnalysis] = useState<any>(null);
  const [mlDebugDetails, setMlDebugDetails] = useState<string[]>([]);
  const [mlConfidence, setMlConfidence] = useState(100);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelsRef = useRef<ModelBundle | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addPoints, addLiters, addScanResult, addNotification } = useAuth();

  // Load both models
  const loadAllModels = useCallback(async () => {
    if (modelsRef.current || modelLoading) return;
    setModelLoading(true);
    try {
      const bundle = await loadModels();
      modelsRef.current = bundle;
      setModelLoaded(true);
    } catch (err) {
      console.error('Failed to load ML models:', err);
    }
    setModelLoading(false);
  }, [modelLoading]);

  const startCamera = () => {
    setCameraError('');
    setErrorDetails([]);
    setErrorDetections([]);
    setState('camera');
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    loadAllModels();
    return () => {
      stopCamera();
    };
  }, [loadAllModels, stopCamera]);

  const [cameraTimeout, setCameraTimeout] = useState(false);

  useEffect(() => {
    let timer: any;
    if (state === 'camera' && !videoReady) {
      timer = setTimeout(() => {
        setCameraTimeout(true);
      }, 7000);
    } else {
      setCameraTimeout(false);
    }
    return () => clearTimeout(timer);
  }, [state, videoReady]);

  // Handle camera stream lifecycle based on state
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    const enableCamera = async () => {
      if (state !== 'camera') return;
      setVideoReady(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
        
        streamRef.current = stream;
        activeStream = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn('Error playing video stream:', playErr);
          }
        }
      } catch (err) {
        console.error('Camera error:', err);
        setCameraError('Camera access denied or unavailable. Use image upload or manual entry instead.');
        setState('idle');
      }
    };

    if (state === 'camera') {
      // Give React a bit more time to ensure the video DOM element is fully mounted and ready
      const timer = setTimeout(() => {
        enableCamera();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [state, stopCamera]);

  // Simulated progress animation during scan
  const animateProgress = useCallback(() => {
    const stages = [
      { pct: 15, label: 'Initializing TensorFlow.js...' },
      { pct: 30, label: 'Running COCO-SSD detection...' },
      { pct: 50, label: 'Running MobileNet classification...' },
      { pct: 70, label: 'Analyzing color profile...' },
      { pct: 85, label: 'Matching against oil database...' },
      { pct: 95, label: 'Calculating confidence score...' },
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < stages.length) {
        setScanProgress(stages[i].pct);
        setScanStage(stages[i].label);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const processClassification = async (result: ClassificationResult) => {
    if (!result.isOilImage) {
      // REJECTED — not an oil image
      setErrorTitle(result.errorMessage.includes('verify as Cooking Oil') || result.errorMessage.includes('not a cooking oil') ? 'Not Cooking Oil' : 'Scan Failed');
      setCameraError(result.errorMessage);
      setErrorDetails(result.classificationDetails);
      setErrorDetections(result.mlDetections);
      setState('error');
      return;
    }

    // SUCCESS — oil container verified by ML!
    // Pre-populate form inputs with AI's detections
    setManualBrand(result.brand);
    setManualType(result.oilType);
    setManualVolume(result.volume);
    
    // Save ML analysis details for final submission
    setMlDetectionsList(result.mlDetections || []);
    setMlColorAnalysis(result.colorAnalysis || null);
    setMlDebugDetails(result.classificationDetails || []);
    setMlConfidence(result.confidence || 100);

    setState('details_form');
  };

  const handleDetailsFormSubmit = () => {
    if (!manualBrand || !manualType) {
      setCameraError('Please select both brand and oil type.');
      return;
    }

    const brand = OIL_BRANDS.find(b => b.name === manualBrand) || OIL_BRANDS[0];
    const points = calculatePoints(manualVolume, manualType, brand.pointsMultiplier);

    const detection: DetectionResult = {
      brand: manualBrand,
      oilType: manualType,
      volume: manualVolume,
      confidence: mlConfidence,
      pointsAwarded: points,
      mlDetections: mlDetectionsList.length > 0 ? mlDetectionsList : ['AI Validated Container'],
      colorAnalysis: mlColorAnalysis,
      classificationDetails: mlDebugDetails,
    };

    // Save scan as pending - DO NOT award points yet
    addScanResult({
      brand: detection.brand,
      oilType: detection.oilType,
      volume: detection.volume,
      confidence: mlConfidence,
      pointsAwarded: points,
    });

    addNotification({
      type: 'system',
      title: 'Scan Submitted',
      message: `Scanned ${detection.brand} (${detection.volume}L). Pending validation.`,
      read: false,
      icon: '⏳',
    });

    setResult(detection);
    setState('result');
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };


  const captureAndAnalyze = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setState('scanning');
    setScanProgress(0);
    setScanStage('Initializing...');
    const cleanupProgress = animateProgress();

    try {
      if (!modelsRef.current) {
        throw new Error('AI models not loaded');
      }

      if (!videoRef.current || !canvasRef.current) {
        throw new Error('Camera not ready');
      }

      const classResult = await classifyOilImage(
        videoRef.current,
        canvasRef.current,
        modelsRef.current
      );

      stopCamera();
      setScanProgress(100);
      setScanStage('Complete!');
      await new Promise(r => setTimeout(r, 500));

      await processClassification(classResult);
    } catch (err) {
      console.error('Classification error:', err);
      stopCamera();
      setCameraError('An error occurred during AI analysis. Please try again.');
      setState('error');
    }

    cleanupProgress();
    setIsCapturing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setCameraError('Please upload an image file (JPG, PNG, etc.).');
      setState('error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadPreview(ev.target?.result as string);
      setState('upload');
    };
    reader.readAsDataURL(file);
  };

  const analyzeUploadedImage = async () => {
    setState('scanning');
    setScanProgress(0);
    setScanStage('Initializing...');
    const cleanupProgress = animateProgress();

    try {
      if (!modelsRef.current) {
        throw new Error('AI models not loaded');
      }

      // Create image element
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = uploadPreview!;
      });

      // Use upload canvas
      const canvas = uploadCanvasRef.current || document.createElement('canvas');

      const classResult = await classifyOilImage(
        img,
        canvas,
        modelsRef.current
      );

      setScanProgress(100);
      setScanStage('Complete!');
      await new Promise(r => setTimeout(r, 500));

      await processClassification(classResult);
    } catch (err) {
      console.error('Upload analysis error:', err);
      setCameraError('An error occurred while analyzing the uploaded image. Please try a different image.');
      setState('error');
    }

    cleanupProgress();
  };

  const handleManualSubmit = () => {
    const brand = OIL_BRANDS.find(b => b.name === manualBrand) || OIL_BRANDS[0];
    const points = calculatePoints(manualVolume, manualType, brand.pointsMultiplier);

    const detection: DetectionResult = {
      brand: manualBrand || brand.name,
      oilType: manualType || 'Sunflower Oil',
      volume: manualVolume,
      confidence: 100,
      pointsAwarded: points,
      mlDetections: ['Manual Entry'],
    };

    // Save as pending
    addScanResult({
      brand: detection.brand,
      oilType: detection.oilType,
      volume: detection.volume,
      confidence: 100,
      pointsAwarded: points,
    });

    setResult(detection);
    setState('result');
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const reset = () => {
    setState('idle');
    setResult(null);
    setCameraError('');
    setErrorDetails([]);
    setErrorDetections([]);
    setShowDebug(false);
    setUploadPreview(null);
    setScanProgress(0);
    setScanStage('');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBar title="AI Oil Scanner" showBack />
      <div className="page-container">
        {/* Hidden elements */}
        <canvas ref={uploadCanvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Confetti */}
        {showConfetti && (
          <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: '50%',
                  width: 8,
                  height: 8,
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  background: ['#22c55e', '#f59e0b', '#14b8a6', '#8b5cf6', '#ef4444'][Math.floor(Math.random() * 5)],
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${0.8 + Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* ═══════ IDLE STATE ═══════ */}
        {state === 'idle' && (
          <div className="flex flex-col items-center pt-8 animate-scale-in">
            <div className="relative mb-8">
              <div className="w-40 h-40 rounded-3xl glass-card-strong flex items-center justify-center shadow-elevated">
                <ScanLine size={64} style={{ color: 'var(--brand-primary)' }} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'var(--brand-primary)' }}>
                <Upload size={20} color="white" />
              </div>
            </div>

            <h2 className="text-xl font-bold font-display mb-2" style={{ color: 'var(--text-primary)' }}>
              AI Oil Scanner
            </h2>
            <p className="text-sm text-center mb-4 max-w-xs" style={{ color: 'var(--text-secondary)' }}>
              Upload an image of your used cooking oil container. Our AI uses <strong>MobileNet + COCO-SSD</strong> to detect the brand, type, and volume.
            </p>

            {/* AI Pipeline Info */}
            <div className="w-full p-3 rounded-xl mb-6" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <div className="flex items-start gap-2">
                <Info size={16} style={{ color: 'var(--brand-primary)', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--brand-primary)' }}>Multi-Stage AI Pipeline</p>
                  <div className="text-[11px] space-y-0.5" style={{ color: 'var(--text-muted)' }}>
                    <p>1. 📦 Object detection (COCO-SSD) — finds containers</p>
                    <p>2. 🧠 Image classification (MobileNet v2) — validates oil</p>
                    <p>3. 🎨 Color analysis — identifies oil type by color</p>
                    <p>4. 🏷️ Brand matching — matches {'>'}20 brand+type signatures</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ML Status */}
            <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
              {modelLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" style={{ color: 'var(--brand-primary)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading AI models (MobileNet + COCO-SSD)...</span>
                </>
              ) : modelLoaded ? (
                <>
                  <Zap size={14} style={{ color: 'var(--brand-primary)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--brand-primary)' }}>AI Ready — MobileNet v2 + COCO-SSD</span>
                </>
              ) : (
                <>
                  <AlertCircle size={14} style={{ color: '#f59e0b' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>AI models unavailable</span>
                </>
              )}
            </div>

            {cameraError && (
              <div className="w-full p-3 rounded-xl mb-4 text-sm text-center" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                {cameraError}
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary w-full flex items-center justify-center gap-2 mb-3"
            >
              <Upload size={18} /> Upload Oil Image
            </button>
            <button onClick={() => setState('manual')} className="btn-ghost w-full flex items-center justify-center gap-2">
              <Edit3 size={18} /> Enter Manually
            </button>
          </div>
        )}

        {/* ═══════ CAMERA VIEW ═══════ */}
        {state === 'camera' && (
          <div className="flex flex-col items-center animate-scale-in">
            <div className="relative w-full rounded-3xl overflow-hidden mb-6 shadow-2xl" style={{ aspectRatio: '4/3', background: '#000' }}>
              {!videoReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mb-4" style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }} />
                  <p className="text-xs font-medium animate-pulse" style={{ color: 'var(--text-muted)' }}>Waking up camera...</p>

                  {cameraTimeout && (
                    <div className="mt-6 animate-slide-up text-center px-6">
                      <p className="text-[10px] mb-3" style={{ color: '#ef4444' }}>Taking longer than usual...</p>
                      <button
                        onClick={() => { setState('idle'); setTimeout(() => setState('camera'), 100); }}
                        className="btn-secondary py-2 px-4 text-xs"
                      >
                        Reset Camera
                      </button>
                    </div>
                  )}
                </div>
              )}

              <video
                ref={videoRef}
                className={`w-full h-full object-cover transition-opacity duration-500 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
                playsInline
                muted
                onLoadedMetadata={() => setVideoReady(true)}
              />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full hidden" />

              {/* Scan overlay */}
              {videoReady && (
                <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
                  <div className="w-64 h-64 relative">
                    <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 rounded-tl-2xl" style={{ borderColor: 'var(--brand-primary)' }} />
                    <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 rounded-tr-2xl" style={{ borderColor: 'var(--brand-primary)' }} />
                    <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 rounded-bl-2xl" style={{ borderColor: 'var(--brand-primary)' }} />
                    <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 rounded-br-2xl" style={{ borderColor: 'var(--brand-primary)' }} />

                    {/* Animated scan line */}
                    <div className="animate-scan-line" />
                  </div>
                </div>
              )}

              <div className="absolute bottom-6 left-0 right-0 text-center z-20">
                <span className="px-4 py-2 rounded-full text-xs font-semibold text-white shadow-lg backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.5)' }}>
                  {videoReady ? 'Position container inside the frame' : 'Initializing...'}
                </span>
              </div>
            </div>

            <button
              onClick={captureAndAnalyze}
              disabled={!videoReady || isCapturing}
              className={`btn-primary w-full flex items-center justify-center gap-2 mb-3 ${(!videoReady || isCapturing) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
            >
              {isCapturing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ScanLine size={18} />
                  Capture & Analyze
                </>
              )}
            </button>
            <button onClick={() => { stopCamera(); reset(); }} className="btn-ghost w-full text-center">Cancel</button>
          </div>
        )}

        {/* ═══════ UPLOAD PREVIEW ═══════ */}
        {state === 'upload' && uploadPreview && (
          <div className="flex flex-col items-center animate-scale-in">
            <div className="relative w-full rounded-3xl overflow-hidden mb-6" style={{ maxHeight: 400, background: '#000' }}>
              <img
                ref={imageRef}
                src={uploadPreview}
                alt="Uploaded oil image"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 right-3">
                <button
                  onClick={reset}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                >
                  <XCircle size={18} color="white" />
                </button>
              </div>
            </div>

            <p className="text-sm mb-4 text-center" style={{ color: 'var(--text-secondary)' }}>
              Image loaded. The AI will analyze it for oil containers.
            </p>

            <button onClick={analyzeUploadedImage} className="btn-primary w-full flex items-center justify-center gap-2 mb-3">
              <Zap size={18} /> Analyze with AI
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary w-full flex items-center justify-center gap-2 mb-3"
            >
              <Upload size={18} /> Choose Different Image
            </button>
            <button onClick={reset} className="btn-ghost w-full text-center">Cancel</button>
          </div>
        )}

        {/* ═══════ SCANNING STATE ═══════ */}
        {state === 'scanning' && (
          <div className="flex flex-col items-center justify-center pt-16 animate-scale-in">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-full animate-spin-slow" style={{ border: '3px solid var(--border-color)', borderTopColor: 'var(--brand-primary)' }} />
              <div className="absolute inset-2 rounded-full animate-spin-slow" style={{ border: '3px solid var(--border-color)', borderBottomColor: 'var(--brand-primary)', animationDirection: 'reverse', animationDuration: '2s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <ScanLine size={28} style={{ color: 'var(--brand-primary)' }} />
              </div>
            </div>

            <h3 className="text-lg font-bold font-display mb-2" style={{ color: 'var(--text-primary)' }}>Analyzing Oil Container...</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{scanStage}</p>

            {/* Progress bar */}
            <div className="w-full max-w-xs mb-4">
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${scanProgress}%`,
                    background: 'linear-gradient(90deg, var(--brand-primary), #14b8a6)',
                  }}
                />
              </div>
              <p className="text-[11px] text-center mt-1" style={{ color: 'var(--text-muted)' }}>{scanProgress}%</p>
            </div>

            {/* Pipeline stages */}
            <div className="w-full max-w-xs space-y-2">
              {[
                { label: 'COCO-SSD Detection', done: scanProgress > 30 },
                { label: 'MobileNet Classification', done: scanProgress > 50 },
                { label: 'Color Analysis', done: scanProgress > 70 },
                { label: 'Brand Matching', done: scanProgress > 85 },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {s.done ? (
                    <CheckCircle2 size={14} style={{ color: 'var(--brand-primary)' }} />
                  ) : scanProgress > (i * 20 + 10) ? (
                    <Loader2 size={14} className="animate-spin" style={{ color: 'var(--brand-primary)' }} />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border" style={{ borderColor: 'var(--border-color)' }} />
                  )}
                  <span style={{ color: s.done ? 'var(--brand-primary)' : 'var(--text-muted)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ ERROR STATE ═══════ */}
        {state === 'error' && (
          <div className="animate-slide-up pt-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: errorTitle === 'Not Cooking Oil' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)' }}>
                {errorTitle === 'Not Cooking Oil' ? (
                  <AlertCircle size={40} style={{ color: '#f59e0b' }} />
                ) : (
                  <XCircle size={40} style={{ color: '#ef4444' }} />
                )}
              </div>
            </div>

            <h2 className="text-xl font-bold font-display text-center mb-4" style={{ color: errorTitle === 'Not Cooking Oil' ? '#f59e0b' : '#ef4444' }}>
              {errorTitle}
            </h2>

            {/* Error message */}
            <div className="card-base p-4 mb-4" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
              <p className="text-sm whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>
                {cameraError}
              </p>
            </div>

            {/* Debug details (expandable) */}
            {errorDetails.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="flex items-center gap-1.5 text-xs font-medium mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Eye size={12} />
                  {showDebug ? 'Hide' : 'Show'} AI Debug Log ({errorDetails.length} entries)
                </button>
                {showDebug && (
                  <div className="p-3 rounded-xl text-[10px] font-mono space-y-0.5 max-h-48 overflow-y-auto"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                    {errorDetails.map((d, i) => (
                      <p key={i}>{d}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary w-full flex items-center justify-center gap-2 mb-3"
            >
              <Upload size={18} /> Upload a Different Image
            </button>
            <button onClick={() => setState('manual')} className="btn-ghost w-full flex items-center justify-center gap-2">
              <Edit3 size={18} /> Enter Manually Instead
            </button>
          </div>
        )}

        {/* ═══════ DETAILS FORM STATE ═══════ */}
        {state === 'details_form' && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-3 p-4 rounded-2xl mb-6 shadow-sm" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.15)' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--brand-primary)' }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Oil Container Validated by AI!</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Confirm or update the scanned details below to earn points.</p>
              </div>
            </div>

            <div className="card-base p-5 mb-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Scan Details</h3>
              
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Brand</label>
                <select value={manualBrand} onChange={e => setManualBrand(e.target.value)} className="input-base">
                  <option value="">Select brand</option>
                  {OIL_BRANDS.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Oil Type</label>
                <select value={manualType} onChange={e => setManualType(e.target.value)} className="input-base">
                  <option value="">Select type</option>
                  <optgroup label="GRADE 1 — PREMIUM: 150 PTS/L">
                    {OIL_GRADES.GRADE_1.types.map(t => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                  <optgroup label="GRADE 2 — HIGH: 125 PTS/L">
                    {OIL_GRADES.GRADE_2.types.map(t => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                  <optgroup label="GRADE 3 — STANDARD: 100 PTS/L">
                    {OIL_GRADES.GRADE_3.types.map(t => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                  <optgroup label="GRADE 4 — LOW: 75 PTS/L">
                    {OIL_GRADES.GRADE_4.types.map(t => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                </select>
                {manualType && (
                  <p className="text-[10px] mt-1.5 font-bold text-green-600 dark:text-lime-400">
                    Detected {getOilGrade(manualType)}
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Quantity (Liters)</label>
                  <span className="text-sm font-bold text-green-500">{manualVolume.toFixed(1)} L</span>
                </div>
                <input
                  type="range" min={0.5} max={15} step={0.5}
                  value={manualVolume}
                  onChange={e => setManualVolume(Number(e.target.value))}
                  className="w-full accent-green-500"
                />
                <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  <span>0.5L</span><span>15L</span>
                </div>
              </div>
            </div>

            {/* AI Insights & Confidence */}
            <div className="card-base p-4 mb-6 shadow-sm" style={{ background: 'var(--bg-secondary)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>AI Insights</p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>ML Classifier Verification</span>
                  <span className="font-bold text-green-500">Passed (Cooking Oil Container)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>AI Detection Confidence</span>
                  <span className="font-bold" style={{ color: 'var(--brand-primary)' }}>{mlConfidence}%</span>
                </div>
                {mlColorAnalysis && (
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>Detected Oil Color Profile</span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{
                          background: `hsl(${mlColorAnalysis.hue}, ${mlColorAnalysis.saturation}%, ${mlColorAnalysis.lightness}%)`,
                          borderColor: 'var(--border-color)',
                        }}
                      />
                      <span className="capitalize">{mlColorAnalysis.dominantColor}</span>
                    </div>
                  </div>
                )}
                {mlDetectionsList.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] block mb-1" style={{ color: 'var(--text-muted)' }}>Object Identifiers:</span>
                    <div className="flex flex-wrap gap-1">
                      {mlDetectionsList.slice(0, 3).map((det, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: 'var(--border-color)', color: 'var(--text-muted)' }}>
                          {det}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button onClick={handleDetailsFormSubmit} className="btn-primary w-full flex items-center justify-center gap-2 mb-3">
              <CheckCircle2 size={18} /> Confirm & Claim Points
            </button>
            <button onClick={reset} className="btn-ghost w-full text-center">Scan Again</button>
          </div>
        )}

        {/* ═══════ RESULT STATE ═══════ */}
        {state === 'result' && result && (
          <div className="animate-slide-up">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-glow-green" style={{ background: 'rgba(34,197,94,0.15)' }}>
                <CheckCircle2 size={32} style={{ color: 'var(--brand-primary)' }} />
              </div>
            </div>

            <h2 className="text-xl font-bold font-display text-center mb-1" style={{ color: 'var(--text-primary)' }}>
              Oil Logged! ⏳
            </h2>
            <p className="text-xs text-center mb-6" style={{ color: 'var(--text-muted)' }}>
              Scan is pending admin approval.
            </p>

            <div className="card-base p-5 mb-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Status</span>
                  <span className="badge badge-warning text-[10px]">PENDING APPROVAL</span>
                </div>
                <div className="h-px" style={{ background: 'var(--border-color)' }} />
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Brand</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{result.brand}</span>
                </div>
                <div className="h-px" style={{ background: 'var(--border-color)' }} />
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Oil Type</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold block" style={{ color: 'var(--text-primary)' }}>{result.oilType}</span>
                    <span className="text-[10px] font-bold text-green-600">{getOilGrade(result.oilType)}</span>
                  </div>
                </div>
                <div className="h-px" style={{ background: 'var(--border-color)' }} />
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Estimated Volume</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{result.volume}L</span>
                </div>
                <div className="h-px" style={{ background: 'var(--border-color)' }} />
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Potential Points</span>
                  <span className="text-sm font-bold text-green-500">~{result.pointsAwarded} pts</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl mb-6 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
              <h4 className="text-sm font-bold text-green-800 dark:text-green-300 mb-1">Next Step: Schedule Pickup</h4>
              <p className="text-xs text-green-700 dark:text-green-400">
                To claim your points, you need to hand over the oil to one of our pickup stations.
              </p>
            </div>

            <button onClick={() => navigate('/schedule')} className="btn-primary w-full mb-3 flex items-center justify-center gap-2">
               Schedule Pickup <ArrowRight size={18} />
            </button>
            <button onClick={reset} className="btn-secondary w-full">Back to Scanner</button>
          </div>
        )}

        {/* ═══════ MANUAL ENTRY ═══════ */}
        {state === 'manual' && (
          <div className="animate-slide-up">
            <h2 className="text-lg font-bold font-display mb-4" style={{ color: 'var(--text-primary)' }}>Manual Entry</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Brand</label>
                <select value={manualBrand} onChange={e => setManualBrand(e.target.value)} className="input-base">
                  <option value="">Select brand</option>
                  {OIL_BRANDS.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Oil Type</label>
                <select value={manualType} onChange={e => setManualType(e.target.value)} className="input-base">
                  <option value="">Select type</option>
                  <optgroup label="GRADE 1 — PREMIUM: 150 PTS/L">
                    {OIL_GRADES.GRADE_1.types.map(t => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                  <optgroup label="GRADE 2 — HIGH: 125 PTS/L">
                    {OIL_GRADES.GRADE_2.types.map(t => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                  <optgroup label="GRADE 3 — STANDARD: 100 PTS/L">
                    {OIL_GRADES.GRADE_3.types.map(t => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                  <optgroup label="GRADE 4 — LOW: 75 PTS/L">
                    {OIL_GRADES.GRADE_4.types.map(t => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Volume: {manualVolume}L</label>
                <input
                  type="range" min={0.5} max={15} step={0.5}
                  value={manualVolume}
                  onChange={e => setManualVolume(Number(e.target.value))}
                  className="w-full accent-green-500"
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  <span>0.5L</span><span>15L</span>
                </div>
              </div>
              <button onClick={handleManualSubmit} className="btn-primary w-full">Submit & Earn Points</button>
              <button onClick={reset} className="btn-ghost w-full text-center">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
