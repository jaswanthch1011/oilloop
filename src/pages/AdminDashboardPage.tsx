import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Droplets, CalendarDays, Plus, Search, Check, AlertTriangle, ArrowLeft, Trash2, MapPin, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/layout/TopBar';
import { mockLocations } from '../data/mockData';
import type { Pickup, Location } from '../types';
import { apiUrl } from '../lib/api';
import { getOilGrade } from '../lib/calculations';

export default function AdminDashboardPage() {
  const { user, pickups, scanResults, updatePickupStatus, addNotification } = useAuth();
  const navigate = useNavigate();

  // Role Gate check
  const isAdmin = user?.role === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pickups' | 'scans' | 'locations'>('pickups');
  const [locations, setLocations] = useState<Location[]>(mockLocations);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [globalScans, setGlobalScans] = useState<any[]>([]);

  // Form state to add new location
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocHours, setNewLocHours] = useState('8:00 AM – 6:00 PM');
  const [newLocDistance, setNewLocDistance] = useState('1.0 km');

  useEffect(() => {
    if (isAdmin) {
      // Fetch stats
      fetch(apiUrl('/api/admin/stats'))
        .then(res => res.json())
        .then(data => {
          setStats(data);
          setLoadingStats(false);
        })
        .catch(err => {
          console.error('Failed to fetch admin stats:', err);
          setLoadingStats(false);
        });

      // Fetch global scans for visibility
      fetch(apiUrl('/api/admin/scans'))
        .then(res => res.json())
        .then(data => {
          if (data.scans) setGlobalScans(data.scans);
        })
        .catch(err => console.error('Failed to fetch global scans:', err));
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/20 flex items-center justify-center mb-6 text-red-500">
          <Shield size={40} />
        </div>
        <h2 className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>Access Denied</h2>
        <p className="text-sm mt-2 max-w-xs" style={{ color: 'var(--text-muted)' }}>
          This area is restricted to OilLoop administrators only.
        </p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary mt-6">
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Calculate metrics from live stats or local pickups as fallback
  const totalLiters = stats?.totalLiters !== undefined
    ? stats.totalLiters
    : pickups.reduce((acc, p) => (p.status === 'processed' || p.status === 'completed') ? acc + p.estimatedVolume : acc, 0);

  const activeOrders = stats?.activePickups !== undefined
    ? stats.activePickups
    : pickups.filter(p => p.status === 'scheduled' || p.status === 'confirmed' || p.status === 'picked_up').length;

  const completedOrders = stats?.completedPickups !== undefined
    ? stats.completedPickups
    : pickups.filter(p => p.status === 'completed').length;

  const totalUsers = stats?.totalUsers !== undefined ? stats.totalUsers : 0;

  // Status transition handler
  const handleStatusChange = async (pickupId: string, currentStatus: Pickup['status']) => {
    let nextStatus: Pickup['status'] = 'scheduled';
    let title = '';
    let message = '';
    let icon = '';

    if (currentStatus === 'scheduled') {
      nextStatus = 'confirmed';
      title = 'Pickup Confirmed! 📅';
      message = `Your pickup ${pickupId} has been confirmed. A collector will arrive at your slot.`;
      icon = '📅';
    } else if (currentStatus === 'confirmed') {
      nextStatus = 'picked_up';
      title = 'Oil Picked Up! 🚚';
      message = `Your oil container for order ${pickupId} was picked up and is headed to the processing plant.`;
      icon = '🚚';
    } else if (currentStatus === 'picked_up') {
      nextStatus = 'processed';
      title = 'Oil Processed! ⛽';
      message = `Success! Your recycled oil has been processed into high-quality biodiesel. Points and impact have been credited.`;
      icon = '⚡';
    } else if (currentStatus === 'processed') {
      nextStatus = 'completed';
      title = 'Order Completed! 🎉';
      message = `Recycling order ${pickupId} is officially complete. Thank you for making a difference!`;
      icon = '🎉';
    }

    await updatePickupStatus(pickupId, nextStatus);

    // Refresh stats after status change
    fetch(apiUrl('/api/admin/stats'))
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to refresh stats:', err));
  };

  // Add location helper
  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName || !newLocAddress) return;

    const newLoc: Location = {
      id: `loc${locations.length + 1}`,
      name: newLocName,
      address: newLocAddress,
      city: 'Hyderabad',
      lat: 17.4326 + (Math.random() - 0.5) * 0.1,
      lng: 78.4071 + (Math.random() - 0.5) * 0.1,
      operatingHours: newLocHours,
      distance: newLocDistance,
      availableSlots: [
        { id: `s_new_1`, date: '2026-06-12', time: '10:00 AM', available: true },
        { id: `s_new_2`, date: '2026-06-12', time: '02:00 PM', available: true },
      ],
      image: '',
    };

    setLocations([...locations, newLoc]);
    setNewLocName('');
    setNewLocAddress('');
    setShowAddForm(false);
  };

  // Delete location helper
  const handleDeleteLocation = (id: string) => {
    setLocations(locations.filter(loc => loc.id !== id));
  };

  // Analytics chart data
  const adminMonthlyData = stats?.dailyCollection || [];

  const locationChartData = locations.map(loc => {
    const ordersCount = pickups.filter(p => p.locationId === loc.id).length;
    return {
      name: loc.name.split('—')[1]?.trim() || loc.name.slice(0, 12),
      orders: ordersCount,
    };
  });

  const filteredPickups = pickups.filter(p => 
    p.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBar title="Admin Panel" showBack={false} />
      
      {/* Back button to User Mode */}
      <div className="bg-zinc-900 text-white px-4 py-2 flex justify-between items-center text-xs">
        <span className="flex items-center gap-1"><Shield size={12} className="text-lime-400" /> Admin Mode Active</span>
        <button onClick={() => navigate('/dashboard')} className="font-semibold text-lime-400 flex items-center gap-1">
          <ArrowLeft size={12} /> Switch to User View
        </button>
      </div>

      <div className="page-container pt-4">
        
        {/* Overview metrics */}
        <div className="grid grid-cols-2 gap-3 mb-6 animate-slide-down">
          <div className="card-base p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Droplets size={16} className="text-green-500" />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Liters Recycled</span>
            </div>
            <p className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{totalLiters}L</p>
          </div>

          <div className="card-base p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <CalendarDays size={16} className="text-amber-500" />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Active Pickups</span>
            </div>
            <p className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{activeOrders}</p>
          </div>

          <div className="card-base p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users size={16} className="text-purple-500" />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Registered Users</span>
            </div>
            <p className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{totalUsers}</p>
          </div>

          <div className="card-base p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <Check size={16} className="text-teal-500" />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Completed Orders</span>
            </div>
            <p className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{completedOrders}</p>
          </div>
        </div>

        {/* Recharts Analytics */}
        <div className="card-base p-4 mb-6">
          <h3 className="section-title mb-4">Daily Collection Volume (Liters)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={adminMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={25} />
              <Tooltip />
              <Line type="monotone" dataKey="liters" stroke="var(--brand-primary)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card-base p-4 mb-6">
          <h3 className="section-title mb-4">Orders by Collection Point</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={locationChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={25} />
              <Tooltip />
              <Bar dataKey="orders" fill="var(--brand-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* View Tabs */}
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl mb-6">
          {(['pickups', 'scans', 'locations'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                activeTab === tab ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Active Pickups Panel */}
        {activeTab === 'pickups' && (
          <div className="card-base p-5 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="section-title">Manage Pickups</h3>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{filteredPickups.length} Orders</span>
            </div>

            {/* Search bar */}
            <div className="relative mb-4">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search by ID or Location..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-base pl-10"
              />
            </div>

            <div className="space-y-3">
              {filteredPickups.map(p => (
                <div key={p.id} className="p-3.5 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-mono text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{p.id}</span>
                      <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.locationName}</p>
                    </div>
                    <span className={`badge uppercase text-[8px] font-extrabold ${
                      p.status === 'scheduled' ? 'badge-warning' :
                      p.status === 'confirmed' ? 'badge-info' : 'badge-success'
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs mt-3 pt-2.5 border-t border-dashed" style={{ borderColor: 'var(--border-color)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {p.oilType} • {p.estimatedVolume}L
                    </span>
                    {p.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusChange(p.id, p.status)}
                        className="px-3 py-1 rounded bg-green-500 hover:bg-green-600 dark:bg-lime-500 dark:hover:bg-lime-600 text-[10px] font-bold text-white dark:text-zinc-950 transition-all flex items-center gap-1"
                      >
                        {p.status === 'scheduled' && 'Confirm Order'}
                        {p.status === 'confirmed' && 'Mark Picked Up'}
                        {p.status === 'picked_up' && 'Process Biodiesel'}
                        {p.status === 'processed' && 'Complete Order'}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filteredPickups.length === 0 && (
                <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>No pickups found matching your query</p>
              )}
            </div>
          </div>
        )}

        {/* Global Scans / Grading Panel */}
        {activeTab === 'scans' && (
          <div className="card-base p-5 mb-6">
            <h3 className="section-title mb-4">AI Scans & Oil Grading</h3>
            <div className="space-y-4">
              {(globalScans.length > 0 ? globalScans : scanResults).map((s: any) => (
                <div key={s.id} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-bold">{s.brand}</h4>
                      <p className="text-[10px] opacity-60">{new Date(s.scannedAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-green-600">+{s.pointsAwarded} pts</span>
                      <p className="text-[10px] font-bold opacity-40">AWARDED</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <div>
                      <p className="text-[10px] font-bold opacity-40 uppercase">Oil Type & Grade</p>
                      <p className="text-xs font-semibold">{s.oilType}</p>
                      <p className="text-[9px] font-bold text-green-600 dark:text-lime-400">{getOilGrade(s.oilType)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold opacity-40 uppercase">Volume</p>
                      <p className="text-xs font-semibold">{s.volume}L</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[10px] font-bold opacity-40 uppercase">AI Confidence</p>
                      <span className="text-xs font-bold text-teal-500">{s.confidence}% Match</span>
                    </div>
                  </div>
                </div>
              ))}
              {(globalScans.length === 0 && scanResults.length === 0) && (
                <p className="text-sm text-center py-10 opacity-40">No scans recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Location Management */}
        {activeTab === 'locations' && (
          <div className="card-base p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="section-title">Collection Locations</h3>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-500/10 text-green-500 dark:text-lime-400 hover:bg-green-500/20 transition-all"
            >
              <Plus size={16} />
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddLocation} className="p-4 rounded-xl border mb-4 space-y-3 animate-scale-in" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
              <h4 className="text-xs font-bold">Add Collection Hub</h4>
              <div>
                <label className="block text-[10px] font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Hub Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. BioDrop Station — Gachibowli" 
                  value={newLocName}
                  onChange={e => setNewLocName(e.target.value)}
                  className="input-base py-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Address</label>
                <input 
                  type="text" 
                  placeholder="Street and landmark details" 
                  value={newLocAddress}
                  onChange={e => setNewLocAddress(e.target.value)}
                  className="input-base py-2 text-xs"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Hours</label>
                  <input 
                    type="text" 
                    value={newLocHours}
                    onChange={e => setNewLocHours(e.target.value)}
                    className="input-base py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Distance</label>
                  <input 
                    type="text" 
                    value={newLocDistance}
                    onChange={e => setNewLocDistance(e.target.value)}
                    className="input-base py-2 text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-[10px] font-bold btn-primary">Add Location</button>
              </div>
            </form>
          )}

          <div className="space-y-2.5">
            {locations.map(loc => (
              <div key={loc.id} className="flex justify-between items-start p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin size={15} className="text-green-500 dark:text-lime-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{loc.name}</h4>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{loc.address}</p>
                    <span className="text-[9px] mt-1 inline-block px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Slots Available: {loc.availableSlots.length}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteLocation(loc.id)}
                  className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 flex-shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
        )}

      </div>
    </div>
  );
}
