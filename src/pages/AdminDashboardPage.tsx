import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Droplets, CalendarDays, Plus, Search, Check, AlertTriangle, ArrowLeft, Trash2, MapPin, Loader2, TrendingUp, Filter, Download, LayoutDashboard, Scan, Map as MapIcon, MessageCircle, Pencil } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/layout/TopBar';
import { mockLocations } from '../data/mockData';
import type { Pickup, Location } from '../types';
import { apiUrl } from '../lib/api';
import { getOilGrade } from '../lib/calculations';

export default function AdminDashboardPage() {
  const { user, pickups, scanResults, updatePickupStatus, addNotification, approveScan, rejectScan, allScans, authFetch, tickets, updateTicketStatus, addTicketMessage, registeredUsers, updateUserPoints } = useAuth();
  const navigate = useNavigate();

  // Role Gate check
  const isAdmin = user?.role === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pickups' | 'scans' | 'locations' | 'tickets' | 'users'>('pickups');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editTotalPoints, setEditTotalPoints] = useState<number>(0);
  const [editAvailablePoints, setEditAvailablePoints] = useState<number>(0);
  const [replyText, setReplyText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedTicketId) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicketId, tickets]);
  const [locations, setLocations] = useState<Location[]>(mockLocations);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [globalScans, setGlobalScans] = useState<any[]>([]);
  const [editingPoints, setEditingPoints] = useState<string | null>(null);
  const [newPoints, setNewPoints] = useState<number>(0);
  const [adjustedPointsMap, setAdjustedPointsMap] = useState<Record<string, number>>({});

  // Form state to add new location
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocHours, setNewLocHours] = useState('8:00 AM – 6:00 PM');
  const [newLocDistance, setNewLocDistance] = useState('1.0 km');

  const calculateLocalStats = () => {
    const totalLitersVal = pickups.reduce((acc, p) => (p.status === 'processed' || p.status === 'completed' || p.status === 'picked_up') ? acc + p.estimatedVolume : acc, 0);
    const activeOrdersVal = pickups.filter(p => p.status === 'scheduled' || p.status === 'confirmed' || p.status === 'picked_up' || p.status === 'processed').length;
    const completedOrdersVal = pickups.filter(p => p.status === 'completed').length;
    const totalUsersVal = 12;

    const dailyCollection = [
      { date: '10 Jun', liters: totalLitersVal * 0.2 },
      { date: '11 Jun', liters: totalLitersVal * 0.35 },
      { date: '12 Jun', liters: totalLitersVal * 0.5 },
      { date: '13 Jun', liters: totalLitersVal * 0.6 },
      { date: '14 Jun', liters: totalLitersVal * 0.75 },
      { date: '15 Jun', liters: totalLitersVal * 0.9 },
      { date: '16 Jun', liters: totalLitersVal },
    ];

    return {
      totalLiters: totalLitersVal,
      activePickups: activeOrdersVal,
      completedPickups: completedOrdersVal,
      totalUsers: totalUsersVal,
      dailyCollection
    };
  };

  useEffect(() => {
    if (isAdmin) {
      setStats(calculateLocalStats());
      setLoadingStats(false);
      setGlobalScans(allScans);
    }
  }, [isAdmin, pickups, allScans]);

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
  const totalLiters = stats?.totalLiters !== undefined ? stats.totalLiters : 0;
  const activeOrders = stats?.activePickups !== undefined ? stats.activePickups : 0;
  const completedOrders = stats?.completedPickups !== undefined ? stats.completedPickups : 0;
  const totalUsers = registeredUsers.length;

  // Status transition handler
  const handleStatusChange = async (pickupId: string, currentStatus: Pickup['status']) => {
    let nextStatus: Pickup['status'] = 'scheduled';
    if (currentStatus === 'scheduled') nextStatus = 'confirmed';
    else if (currentStatus === 'confirmed') nextStatus = 'picked_up';
    else if (currentStatus === 'picked_up') nextStatus = 'processed';
    else if (currentStatus === 'processed') nextStatus = 'completed';

    await updatePickupStatus(pickupId, nextStatus);
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
        { id: `s_new_1`, date: '2025-03-15', time: '10:00 AM', available: true },
        { id: `s_new_2`, date: '2025-03-15', time: '02:00 PM', available: true },
      ],
      image: '',
    };

    setLocations([...locations, newLoc]);
    setNewLocName('');
    setNewLocAddress('');
    setShowAddForm(false);
  };

  const handleDeleteLocation = (id: string) => {
    setLocations(locations.filter(loc => loc.id !== id));
  };

  const adminMonthlyData = stats?.dailyCollection || [];

  const locationChartData = locations.map(loc => {
    const ordersCount = pickups.filter(p => p.locationId === loc.id).length;
    return {
      name: loc.name.split('—')[1]?.trim() || loc.name.slice(0, 10),
      orders: ordersCount,
    };
  });

  const filteredPickups = pickups.filter(p => 
    p.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-32" style={{ background: 'var(--bg-primary)' }}>
      <TopBar title="Admin Command Center" showBack={false} />
      
      {/* Premium Back to User Toggle */}
      <div className="mx-4 mt-2 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full py-2.5 rounded-2xl bg-zinc-900 text-white flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-xl shadow-zinc-900/20 active:scale-95 transition-all"
        >
          <ArrowLeft size={14} className="text-emerald-400" />
          Switch to User Experience
        </button>
      </div>

      <div className="page-container pt-0">
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8 animate-slide-down">
          {[
            { label: 'Total Volume', value: `${totalLiters}L`, icon: Droplets, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Live Orders', value: activeOrders, icon: CalendarDays, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'System Users', value: totalUsers, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { label: 'Goal Met', value: '88%', icon: TrendingUp, color: 'text-teal-500', bg: 'bg-teal-500/10' },
          ].map((item, idx) => (
            <div key={idx} className="card-base p-5 group hover:border-emerald-500/50">
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                <item.icon size={20} className={item.color} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{item.label}</p>
              <p className="text-2xl font-black font-display text-zinc-900 dark:text-white">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Analytics Section */}
        <div className="card-base p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="section-title">Collection Analytics</h3>
            <div className="flex gap-2">
               <button className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-500"><Filter size={14}/></button>
               <button className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-500"><Download size={14}/></button>
            </div>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={adminMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                   contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="liters"
                  stroke="var(--brand-primary)"
                  strokeWidth={4}
                  dot={{ r: 5, fill: 'var(--brand-primary)', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-zinc-200/50 dark:bg-zinc-800/50 p-1.5 rounded-[1.25rem] mb-8 shadow-inner">
          {[
            { id: 'pickups', label: 'Orders', icon: LayoutDashboard },
            { id: 'scans', label: 'Approvals', icon: Scan },
            { id: 'locations', label: 'Hubs', icon: MapIcon },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'tickets', label: 'Tickets', icon: MessageCircle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-zinc-700 shadow-md text-emerald-600 dark:text-emerald-400 scale-[1.02]'
                  : 'text-zinc-500'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content: Pickups */}
        {activeTab === 'pickups' && (
          <div className="animate-slide-up">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="section-title">Manage Logistics</h3>
              <span className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg opacity-60">{filteredPickups.length} ACTIVE</span>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                placeholder="Search by ID, User, or Hub..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-base pl-12 h-14 rounded-2xl"
              />
            </div>

            <div className="space-y-4">
              {filteredPickups.map(p => (
                <div key={p.id} className="card-base p-5 border-l-4" style={{ borderLeftColor: p.status === 'completed' ? '#10b981' : p.status === 'scheduled' ? '#f59e0b' : '#3b82f6' }}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-mono text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-md">{p.id}</span>
                      <h4 className="text-sm font-bold mt-1 text-zinc-900 dark:text-white">{p.locationName}</h4>
                    </div>
                    <span className={`text-[8px] font-black px-2 py-1 rounded uppercase tracking-wider ${
                      p.status === 'scheduled' ? 'bg-amber-100 text-amber-700' :
                      p.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex justify-between items-end mt-4 pt-4 border-t border-dashed border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-4">
                       <div>
                          <p className="text-[9px] font-black text-zinc-400 uppercase">OIL TYPE</p>
                          <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{p.oilType}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-zinc-400 uppercase">VOLUME</p>
                          <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{p.estimatedVolume}L</p>
                       </div>
                    </div>
                    {p.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusChange(p.id, p.status)}
                        className="h-10 px-4 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 active:scale-95"
                      >
                        Advance Status
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Scans */}
        {activeTab === 'scans' && (
          <div className="animate-slide-up">
            <h3 className="section-title mb-6 px-1">Quality Verification</h3>
            <div className="space-y-4">
              {allScans.filter(s => s.status === 'pending').map((s: any) => (
                <div key={s.id} className="card-base p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-base font-black text-zinc-900 dark:text-white">{s.brand}</h4>
                      <p className="text-[10px] font-medium text-zinc-500">{new Date(s.scannedAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       {editingPoints === s.id ? (
                         <div className="flex items-center gap-1.5 justify-end">
                           <input
                             type="number"
                             value={newPoints}
                             onChange={e => setNewPoints(Number(e.target.value))}
                             className="w-20 h-8 text-center text-xs font-bold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                             min="0"
                           />
                           <button
                             onClick={() => {
                               setAdjustedPointsMap(prev => ({ ...prev, [s.id]: newPoints }));
                               setEditingPoints(null);
                             }}
                             className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                             title="Confirm points adjustment"
                           >
                             <Check size={12} />
                           </button>
                         </div>
                       ) : (
                         <div className="flex items-center gap-1.5 justify-end">
                           <span className="text-lg font-black text-emerald-600">
                             ~{adjustedPointsMap[s.id] !== undefined ? adjustedPointsMap[s.id] : s.pointsAwarded} XP
                           </span>
                           <button
                             onClick={() => {
                               setEditingPoints(s.id);
                               setNewPoints(adjustedPointsMap[s.id] !== undefined ? adjustedPointsMap[s.id] : s.pointsAwarded);
                             }}
                             className="p-1 text-zinc-400 hover:text-emerald-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-all"
                             title="Edit reward points"
                           >
                             <Pencil size={12} />
                           </button>
                         </div>
                       )}
                       <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">EST. REWARD</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 mb-6">
                    <div>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">GRADE ANALYSIS</p>
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{getOilGrade(s.oilType)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">REPORTED VOLUME</p>
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{s.volume} Liters</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => rejectScan(s.id)}
                      className="flex-1 h-12 rounded-xl border-2 border-red-100 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => approveScan(s.id, adjustedPointsMap[s.id])}
                      className="flex-[2] h-12 rounded-xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      Approve & Credit XP
                    </button>
                  </div>
                </div>
              ))}
              {allScans.filter(s => s.status === 'pending').length === 0 && (
                <div className="py-20 text-center">
                   <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="text-emerald-500" size={32} />
                   </div>
                   <p className="text-sm font-bold text-zinc-500">All scans have been processed!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Locations */}
        {activeTab === 'locations' && (
          <div className="animate-slide-up">
            <div className="flex justify-between items-center mb-6 px-1">
              <h3 className="section-title">Collection Network</h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="h-10 px-4 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Plus size={14} /> Add Hub
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddLocation} className="card-base p-6 mb-8 space-y-4 animate-scale-in border-2 border-emerald-500/20 shadow-2xl">
                <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">New Collection Point</h4>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Hub Name (e.g. BioDrop Station)"
                    value={newLocName}
                    onChange={e => setNewLocName(e.target.value)}
                    className="input-base h-12"
                    required
                  />
                  <input
                    type="text" 
                    placeholder="Full Street Address"
                    value={newLocAddress}
                    onChange={e => setNewLocAddress(e.target.value)}
                    className="input-base h-12"
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Operating Hours"
                      value={newLocHours}
                      onChange={e => setNewLocHours(e.target.value)}
                      className="input-base h-12"
                    />
                    <input
                      type="text"
                      placeholder="Distance Display"
                      value={newLocDistance}
                      onChange={e => setNewLocDistance(e.target.value)}
                      className="input-base h-12"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 h-12 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-50 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 h-12 rounded-xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">Create Hub</button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {locations.map(loc => (
                <div key={loc.id} className="flex justify-between items-center p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-emerald-500/30 transition-all group">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-emerald-500 transition-colors">
                      <MapPin size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-zinc-900 dark:text-white">{loc.name}</h4>
                      <p className="text-[10px] font-medium text-zinc-500">{loc.address}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                          {loc.availableSlots.length} SLOTS
                        </span>
                        <span className="text-[9px] font-bold text-zinc-400">• {loc.operatingHours}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteLocation(loc.id)}
                    className="w-10 h-10 rounded-xl hover:bg-red-50 text-red-300 hover:text-red-500 transition-all flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Users */}
        {activeTab === 'users' && (
          <div className="animate-slide-up">
            <div className="flex justify-between items-center mb-6 px-1">
              <h3 className="section-title">Registered Users</h3>
              <span className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg opacity-60">
                {registeredUsers.length} TOTAL
              </span>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                placeholder="Search by Name, Email, or Phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-base pl-12 h-14 rounded-2xl"
              />
            </div>

            <div className="space-y-4">
              {registeredUsers
                .filter(u => 
                  u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (u.phone && u.phone.includes(searchQuery))
                )
                .map(u => (
                  <div key={u.id} className="card-base p-6 hover:border-emerald-500/20 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl">
                          {u.avatar || '👤'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-zinc-900 dark:text-white leading-tight">{u.name}</h4>
                            <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                              {u.role}
                            </span>
                          </div>
                          <p className="text-[10px] font-medium text-zinc-400 mt-1">{u.email}</p>
                          {u.phone && <p className="text-[10px] font-medium text-zinc-500">{u.phone}</p>}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-zinc-400 block">Eco-Level</span>
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <span>{u.ecoLevel.icon}</span>
                          <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">{u.ecoLevel.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-850/30 border border-zinc-100 dark:border-zinc-800/20 mb-4">
                      <div>
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">TOTAL POINTS (XP)</p>
                        <p className="text-base font-black text-zinc-800 dark:text-zinc-200">{u.totalPoints} XP</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">AVAILABLE POINTS</p>
                        <p className="text-base font-black text-zinc-800 dark:text-zinc-200">{u.availablePoints} PTS</p>
                      </div>
                    </div>

                    {editingUser === u.id ? (
                      <div className="p-4 rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 space-y-4 animate-scale-in">
                        <h5 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Adjust Points Balance</h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-bold text-zinc-400 block mb-1">TOTAL POINTS</label>
                            <input
                              type="number"
                              value={editTotalPoints}
                              onChange={e => setEditTotalPoints(Number(e.target.value))}
                              className="input-base h-10 text-xs px-3 font-bold"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-zinc-400 block mb-1">AVAILABLE POINTS</label>
                            <input
                              type="number"
                              value={editAvailablePoints}
                              onChange={e => setEditAvailablePoints(Number(e.target.value))}
                              className="input-base h-10 text-xs px-3 font-bold"
                              min="0"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingUser(null)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateUserPoints(u.id, editTotalPoints, editAvailablePoints);
                              setEditingUser(null);
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-emerald-500/20"
                          >
                            Save Balance
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser(u.id);
                            setEditTotalPoints(u.totalPoints);
                            setEditAvailablePoints(u.availablePoints);
                          }}
                          className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-500/30 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                        >
                          <Pencil size={12} /> Adjust Balance
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              {registeredUsers.filter(u => 
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.phone && u.phone.includes(searchQuery))
              ).length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-sm font-bold text-zinc-500">No users found matching your search</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Tickets */}
        {activeTab === 'tickets' && (
          <div className="animate-slide-up">
            <div className="flex justify-between items-center mb-6 px-1">
              <h3 className="section-title">Support Tickets</h3>
              <span className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg opacity-60">
                {tickets.filter(t => t.status !== 'resolved').length} OPEN
              </span>
            </div>

            {selectedTicketId ? (
              // Ticket details and chat view
              (() => {
                const ticket = tickets.find(t => t.id === selectedTicketId);
                if (!ticket) return null;
                return (
                  <div className="card-base p-6 space-y-6 animate-scale-in">
                    <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-800">
                      <button 
                        onClick={() => setSelectedTicketId(null)} 
                        className="text-xs font-bold text-zinc-500 hover:text-emerald-500 transition-colors flex items-center gap-1"
                      >
                        <ArrowLeft size={14} /> Back to Tickets List
                      </button>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-400 mr-2">Status:</span>
                        <select
                          value={ticket.status}
                          onChange={e => updateTicketStatus(ticket.id, e.target.value as any)}
                          className="px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-xs font-bold border border-zinc-200 dark:border-zinc-800"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[9px] font-black uppercase tracking-wider text-zinc-400">
                          {ticket.category}
                        </span>
                        <span className="text-xs text-zinc-400">Raised by {ticket.userName} ({ticket.userEmail})</span>
                      </div>
                      <h4 className="text-lg font-black text-zinc-900 dark:text-white leading-tight">{ticket.subject}</h4>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed bg-zinc-50/50 dark:bg-zinc-850/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        {ticket.description}
                      </p>
                    </div>

                    {/* Chat history */}
                    <div className="h-[250px] overflow-y-auto border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 space-y-4 flex flex-col bg-zinc-50/20 dark:bg-zinc-950/10">
                      {ticket.messages.map(msg => {
                        const isSenderAdmin = msg.sender === 'admin';
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col max-w-[80%] ${isSenderAdmin ? 'self-end' : 'self-start'}`}
                          >
                            <span className="text-[9px] font-bold mb-1 ml-1 text-zinc-400">
                              {isSenderAdmin ? '🛡️ Loop Support (You)' : `👤 ${msg.senderName}`}
                            </span>
                            <div 
                              className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                isSenderAdmin 
                                  ? 'bg-emerald-500 text-white rounded-tr-sm shadow-md' 
                                  : 'bg-zinc-100 dark:bg-zinc-850 rounded-tl-sm text-zinc-800 dark:text-zinc-200'
                              }`}
                            >
                              {msg.message}
                            </div>
                            <span className="text-[8px] text-zinc-400 mt-0.5 self-end mr-1">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Send reply */}
                    <form 
                      onSubmit={e => {
                        e.preventDefault();
                        if (!replyText.trim()) return;
                        addTicketMessage(ticket.id, replyText.trim());
                        setReplyText('');
                      }} 
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Type response to user..."
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        className="input-base flex-1 h-12"
                      />
                      <button 
                        type="submit" 
                        disabled={!replyText.trim()}
                        className="px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                );
              })()
            ) : (
              // Tickets list view
              <div className="space-y-4">
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by ID, User, or Subject..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="input-base h-12 pl-12"
                  />
                </div>

                <div className="space-y-3">
                  {tickets.filter(t => 
                    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.id.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 ? (
                    <div className="card-base p-8 text-center text-zinc-400 text-sm">
                      No support tickets found matching "{searchQuery}"
                    </div>
                  ) : (
                    tickets.filter(t => 
                      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.id.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(ticket => (
                      <button
                        key={ticket.id}
                        onClick={() => {
                          setSelectedTicketId(ticket.id);
                          setReplyText('');
                        }}
                        className="w-full card-base p-4 text-left hover:scale-[1.01] transition-transform flex items-center justify-between group"
                      >
                        <div className="flex-1 pr-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-zinc-400">ID: {ticket.id}</span>
                            <span className="text-[9px] text-zinc-400">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-black text-sm text-zinc-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                            {ticket.subject}
                          </h4>
                          <p className="text-[10px] text-zinc-500 mt-1">
                            From: {ticket.userName} ({ticket.userEmail})
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[8px] font-black uppercase tracking-wide text-zinc-400">
                              {ticket.category}
                            </span>
                            <span className="text-[9px] text-zinc-400">
                              {ticket.messages.length} msg{ticket.messages.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {ticket.status === 'open' && (
                            <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">Open</span>
                          )}
                          {ticket.status === 'in_progress' && (
                            <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">In Progress</span>
                          )}
                          {ticket.status === 'resolved' && (
                            <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400">Resolved</span>
                          )}
                          <span className="text-zinc-300 group-hover:text-emerald-500 transition-colors">➔</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

