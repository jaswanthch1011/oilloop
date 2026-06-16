import React, { useState } from 'react';
import { MapPin, Clock, ChevronRight, CheckCircle2, Calendar, Droplets, Package, Loader2 } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { useAuth } from '../context/AuthContext';
import { mockLocations } from '../data/mockData';
import { OIL_TYPES, OIL_GRADES } from '../lib/constants';

type Step = 'location' | 'slot' | 'details' | 'review' | 'confirmed';

export default function SchedulePickupPage() {
  const [step, setStep] = useState<Step>('location');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [oilType, setOilType] = useState('Sunflower Oil');
  const [volume, setVolume] = useState(2);
  const [containers, setContainers] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pickupId, setPickupId] = useState('');
  const { addPickup } = useAuth();

  const location = mockLocations.find(l => l.id === selectedLocation);
  const slot = location?.availableSlots.find(s => s.id === selectedSlot);

  const handleConfirm = async () => {
    if (!location || !slot) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    const id = `OL-${Date.now().toString(36).toUpperCase()}`;
    setPickupId(id);
    addPickup({
      userId: 'u1',
      locationId: location.id,
      locationName: location.name,
      scheduledDate: slot.date,
      scheduledTime: slot.time,
      status: 'scheduled',
      estimatedVolume: volume,
      oilType,
      containers,
    });
    setStep('confirmed');
    setLoading(false);
  };

  // Available dates for selected location
  const availableDates = location
    ? [...new Set(location.availableSlots.filter(s => s.available).map(s => s.date))]
    : [];

  const [selectedDate, setSelectedDate] = useState('');
  const slotsForDate = location?.availableSlots.filter(s => s.date === selectedDate && s.available) || [];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBar title="Schedule Pickup" showBack />
      <div className="page-container">
        {/* Progress */}
        {step !== 'confirmed' && (
          <div className="flex items-center gap-1 mb-6">
            {['location', 'slot', 'details', 'review'].map((s, idx) => (
              <React.Fragment key={s}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: ['location', 'slot', 'details', 'review'].indexOf(step) >= idx
                      ? 'var(--brand-primary)' : 'var(--bg-secondary)',
                    color: ['location', 'slot', 'details', 'review'].indexOf(step) >= idx
                      ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {idx + 1}
                </div>
                {idx < 3 && <div className="flex-1 h-0.5 rounded" style={{
                  background: ['location', 'slot', 'details', 'review'].indexOf(step) > idx
                    ? 'var(--brand-primary)' : 'var(--border-color)',
                }} />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Step 1: Location */}
        {step === 'location' && (
          <div className="animate-slide-up">
            <h2 className="text-lg font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>Choose Collection Point</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Select a drop-off location near you</p>
            <div className="space-y-3">
              {mockLocations.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => { setSelectedLocation(loc.id); setStep('slot'); }}
                  className="w-full card-base p-4 text-left flex items-start gap-3"
                  style={{
                    borderColor: selectedLocation === loc.id ? 'var(--brand-primary)' : 'var(--border-color)',
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.1)' }}>
                    <MapPin size={18} style={{ color: 'var(--brand-primary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{loc.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{loc.address}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <Clock size={11} /> {loc.operatingHours}
                      </span>
                      {loc.distance && (
                        <span className="badge badge-success text-[10px]">{loc.distance}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} className="mt-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Date & Time Slot */}
        {step === 'slot' && location && (
          <div className="animate-slide-up">
            <h2 className="text-lg font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>Pick a Date & Time</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{location.name}</p>

            {/* Date buttons */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                <Calendar size={14} className="inline mr-1" /> Available Dates
              </label>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {availableDates.map(date => {
                  const d = new Date(date);
                  const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
                  const dayNum = d.getDate();
                  const month = d.toLocaleDateString('en-IN', { month: 'short' });
                  return (
                    <button
                      key={date}
                      onClick={() => { setSelectedDate(date); setSelectedSlot(''); }}
                      className="flex flex-col items-center py-3 px-4 rounded-2xl transition-all flex-shrink-0"
                      style={{
                        background: selectedDate === date ? 'var(--brand-primary)' : 'var(--bg-card)',
                        border: `1.5px solid ${selectedDate === date ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                        color: selectedDate === date ? '#fff' : 'var(--text-primary)',
                        minWidth: 72,
                      }}
                    >
                      <span className="text-xs font-medium opacity-80">{dayName}</span>
                      <span className="text-xl font-bold">{dayNum}</span>
                      <span className="text-[10px] opacity-70">{month}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  <Clock size={14} className="inline mr-1" /> Available Slots
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {slotsForDate.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSlot(s.id)}
                      className="py-3 px-2 rounded-xl text-sm font-medium transition-all text-center"
                      style={{
                        background: selectedSlot === s.id ? 'var(--brand-primary)' : 'var(--bg-card)',
                        border: `1.5px solid ${selectedSlot === s.id ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                        color: selectedSlot === s.id ? '#fff' : 'var(--text-primary)',
                      }}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
                {slotsForDate.length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No available slots for this date</p>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep('location')} className="btn-secondary flex-1">Back</button>
              <button onClick={() => setStep('details')} disabled={!selectedSlot} className="btn-primary flex-1" style={{ opacity: selectedSlot ? 1 : 0.5 }}>Next</button>
            </div>
          </div>
        )}

        {/* Step 3: Oil Details */}
        {step === 'details' && (
          <div className="animate-slide-up">
            <h2 className="text-lg font-bold font-display mb-4" style={{ color: 'var(--text-primary)' }}>Oil Details</h2>
            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  <Droplets size={14} /> Oil Type
                </label>
                <select value={oilType} onChange={e => setOilType(e.target.value)} className="input-base">
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
                <label className="flex items-center gap-1.5 text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  <Droplets size={14} /> Estimated Volume: {volume}L
                </label>
                <input type="range" min={0.5} max={20} step={0.5} value={volume} onChange={e => setVolume(Number(e.target.value))} className="w-full accent-green-500" />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}><span>0.5L</span><span>20L</span></div>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  <Package size={14} /> Number of Containers
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setContainers(n)}
                      className="w-12 h-12 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background: containers === n ? 'var(--brand-primary)' : 'var(--bg-card)',
                        border: `1.5px solid ${containers === n ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                        color: containers === n ? '#fff' : 'var(--text-primary)',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep('slot')} className="btn-secondary flex-1">Back</button>
              <button onClick={() => setStep('review')} className="btn-primary flex-1">Review</button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 'review' && location && slot && (
          <div className="animate-slide-up">
            <h2 className="text-lg font-bold font-display mb-4" style={{ color: 'var(--text-primary)' }}>Review Pickup</h2>
            <div className="card-base p-5 space-y-4 mb-6">
              {[
                { label: 'Location', value: location.name },
                { label: 'Address', value: location.address },
                { label: 'Date', value: new Date(slot.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) },
                { label: 'Time', value: slot.time },
                { label: 'Oil Type', value: oilType },
                { label: 'Volume', value: `${volume} Liters` },
                { label: 'Containers', value: `${containers}` },
              ].map((item, idx) => (
                <React.Fragment key={item.label}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    <span className="text-sm font-semibold text-right max-w-[60%] truncate" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                  </div>
                  {idx < 6 && <div className="h-px" style={{ background: 'var(--border-color)' }} />}
                </React.Fragment>
              ))}
            </div>

            <div className="card-base p-4 mb-6" style={{ background: 'var(--glow-color)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--brand-primary)' }}>
                ⭐ You'll earn approximately {Math.round(volume * 50)} points from this pickup!
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('details')} className="btn-secondary flex-1">Back</button>
              <button onClick={handleConfirm} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> Confirm</>}
              </button>
            </div>
          </div>
        )}

        {/* Confirmed */}
        {step === 'confirmed' && (
          <div className="flex flex-col items-center pt-12 animate-scale-in">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-glow-green" style={{ background: 'rgba(34,197,94,0.15)' }}>
              <CheckCircle2 size={40} style={{ color: 'var(--brand-primary)' }} />
            </div>
            <h2 className="text-xl font-bold font-display mb-2" style={{ color: 'var(--text-primary)' }}>Pickup Scheduled! 🎉</h2>
            <p className="text-sm text-center mb-2" style={{ color: 'var(--text-secondary)' }}>Your pickup has been confirmed</p>
            <div className="badge badge-success mb-6">{pickupId}</div>

            <div className="card-base p-4 w-full mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
                  <MapPin size={18} style={{ color: 'var(--brand-primary)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{location?.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{slot?.date} at {slot?.time}</p>
                </div>
              </div>
            </div>

            <button onClick={() => { setStep('location'); setSelectedLocation(''); setSelectedSlot(''); setSelectedDate(''); }} className="btn-primary w-full mb-3">Schedule Another</button>
            <button onClick={() => window.history.back()} className="btn-ghost w-full text-center">Go Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
