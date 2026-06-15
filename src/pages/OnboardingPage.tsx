import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const slides = [
  {
    emoji: '♻️',
    title: 'Turn Waste Oil\nInto Rewards',
    description: 'FrytoFly transforms your used cooking oil into tracked, rewarded, and biodiesel-bound resources.',
    gradient: 'from-green-400 to-emerald-600',
    bg: 'radial-gradient(circle at 30% 20%, rgba(34, 197, 94, 0.15) 0%, transparent 60%)',
  },
  {
    emoji: '📅',
    title: 'Schedule Easy\nPickups',
    description: 'Choose a collection point, pick a time slot, and we\'ll handle the rest. Recycling has never been easier.',
    gradient: 'from-amber-400 to-orange-500',
    bg: 'radial-gradient(circle at 70% 30%, rgba(245, 158, 11, 0.15) 0%, transparent 60%)',
  },
  {
    emoji: '📷',
    title: 'Scan & Earn\nInstant Points',
    description: 'Our AI recognizes your oil packet — brand, type, and volume — and awards points instantly.',
    gradient: 'from-teal-400 to-cyan-600',
    bg: 'radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.15) 0%, transparent 60%)',
  },
  {
    emoji: '🌍',
    title: 'Track Your\nEco Impact',
    description: 'Visualize liters recycled, CO₂ saved, and biodiesel generated. Every drop counts!',
    gradient: 'from-green-500 to-lime-400',
    bg: 'radial-gradient(circle at 40% 70%, rgba(34, 197, 94, 0.15) 0%, transparent 60%)',
  },
];

export default function OnboardingPage() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const next = () => {
    if (current < slides.length - 1) setCurrent(current + 1);
    else navigate('/login');
  };

  const skip = () => navigate('/login');

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0" style={{ background: slides[current].bg }} />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 animate-float"
            style={{
              width: 8 + i * 6,
              height: 8 + i * 6,
              left: `${15 + i * 14}%`,
              top: `${20 + (i % 3) * 25}%`,
              background: 'var(--brand-primary)',
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Skip button */}
      <div className="relative z-10 flex justify-end p-4">
        <button onClick={skip} className="btn-ghost text-sm">Skip</button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        <div
          key={current}
          className="flex flex-col items-center text-center animate-scale-in"
        >
          {/* Emoji with glow */}
          <div className="relative mb-8">
            <div
              className="absolute inset-0 rounded-full animate-pulse-ring"
              style={{ background: 'var(--glow-color)', transform: 'scale(2)' }}
            />
            <div
              className="w-28 h-28 rounded-3xl flex items-center justify-center text-6xl glass-card-strong shadow-elevated"
            >
              {slides[current].emoji}
            </div>
          </div>

          {/* Title */}
          <h1
            className="text-3xl font-bold font-display leading-tight mb-4 whitespace-pre-line"
            style={{ color: 'var(--text-primary)' }}
          >
            {slides[current].title}
          </h1>

          {/* Description */}
          <p
            className="text-base leading-relaxed max-w-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            {slides[current].description}
          </p>
        </div>
      </div>

      {/* Bottom section */}
      <div className="relative z-10 px-8 pb-12">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: idx === current ? 24 : 8,
                height: 8,
                background: idx === current ? 'var(--brand-primary)' : 'var(--border-color)',
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={next}
          className="btn-primary w-full flex items-center justify-center gap-2 text-base"
        >
          {current === slides.length - 1 ? 'Get Started' : 'Next'}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
