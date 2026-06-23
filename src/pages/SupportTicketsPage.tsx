import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Plus, MessageCircle, Clock, CheckCircle2, HelpCircle, Send, Tag, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/layout/TopBar';

export default function SupportTicketsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, tickets, addTicket, addTicketMessage } = useAuth();

  const [activeTab, setActiveTab] = useState<'my_tickets' | 'raise_ticket'>('my_tickets');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Set initial selected ticket/tab from router state if present
  useEffect(() => {
    if (location.state) {
      const stateObj = location.state as any;
      if (stateObj.ticketId) {
        setSelectedTicketId(stateObj.ticketId);
        setActiveTab('my_tickets');
      } else if (stateObj.tab) {
        setActiveTab(stateObj.tab);
      }
      // Clear location state to prevent sticky behavior on navigate back
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  // Form fields
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Pickup');
  const [description, setDescription] = useState('');
  const [replyText, setReplyText] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Filter user's own tickets
  const myTickets = tickets.filter(t => t.userId === user?.id);

  // Currently selected ticket
  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  useEffect(() => {
    if (selectedTicket) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages?.length, selectedTicketId]);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    addTicket(subject.trim(), category, description.trim());
    
    // Reset form
    setSubject('');
    setCategory('Pickup');
    setDescription('');
    
    // Switch to tickets list
    setActiveTab('my_tickets');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;

    addTicketMessage(selectedTicketId, replyText.trim());
    setReplyText('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
            Open
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400">
            Resolved
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBar 
        title={selectedTicket ? `Ticket Details` : "Help Desk / Support"} 
        showBack 
        onBackOverride={selectedTicket ? () => setSelectedTicketId(null) : undefined}
      />

      <div className="page-container animate-fade-in pb-10">
        
        {/* Ticket Chat View */}
        {selectedTicket ? (
          <div className="flex flex-col h-[calc(100vh-140px)]">
            {/* Header info */}
            <div className="card-base p-4 mb-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-zinc-400">ID: {selectedTicket.id}</span>
                {getStatusBadge(selectedTicket.status)}
              </div>
              <h2 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>{selectedTicket.subject}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold uppercase tracking-wide text-zinc-400 flex items-center gap-1">
                  <Tag size={10} /> {selectedTicket.category}
                </span>
                <span className="text-xs text-zinc-400">
                  Created on {new Date(selectedTicket.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Chat Box */}
            <div className="flex-1 card-base p-4 mb-4 overflow-y-auto flex flex-col gap-4">
              <div className="text-center p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-[11px] text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800">
                🔒 Safe support channel. Stored locally.
              </div>

              {selectedTicket.messages.map((msg) => {
                const isAdminMsg = msg.sender === 'admin';
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[80%] ${isAdminMsg ? 'self-start' : 'self-end'}`}
                  >
                    <span 
                      className="text-[10px] font-semibold mb-1 ml-1" 
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {isAdminMsg ? '🛡️ Loop Support' : '👤 You'}
                    </span>
                    <div 
                      className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                        isAdminMsg 
                          ? 'bg-zinc-100 dark:bg-zinc-850 rounded-tl-sm text-zinc-800 dark:text-zinc-200' 
                          : 'bg-green-500 text-white rounded-tr-sm shadow-md'
                      }`}
                    >
                      {msg.message}
                    </div>
                    <span className="text-[9px] text-zinc-400 mt-1 self-end mr-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input box */}
            {selectedTicket.status === 'resolved' ? (
              <div className="card-base p-4 text-center bg-green-50/20 border-green-200 text-green-500 text-xs font-semibold">
                ✓ This support ticket is marked as Resolved.
              </div>
            ) : (
              <form onSubmit={handleSendReply} className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  className="input-base flex-1"
                  style={{ borderRadius: '16px', height: '52px' }}
                />
                <button 
                  type="submit" 
                  disabled={!replyText.trim()}
                  className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
                >
                  <Send size={18} />
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-1 mb-6">
              <button
                onClick={() => setActiveTab('my_tickets')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'my_tickets' ? 'bg-white dark:bg-zinc-700 shadow-md text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`}
              >
                My Tickets ({myTickets.length})
              </button>
              <button
                onClick={() => setActiveTab('raise_ticket')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'raise_ticket' ? 'bg-white dark:bg-zinc-700 shadow-md text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`}
              >
                Raise Ticket
              </button>
            </div>

            {/* View List */}
            {activeTab === 'my_tickets' ? (
              <div className="space-y-4">
                {myTickets.length === 0 ? (
                  <div className="card-base p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-400">
                      <HelpCircle size={32} />
                    </div>
                    <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>No Tickets Yet</h3>
                    <p className="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
                      Need help with your pickup, reward points, or anything else? Open a ticket and our support team will help you out.
                    </p>
                    <button 
                      onClick={() => setActiveTab('raise_ticket')}
                      className="btn-primary mt-5 flex items-center gap-2"
                    >
                      <Plus size={16} /> Raise Support Ticket
                    </button>
                  </div>
                ) : (
                  myTickets.map(ticket => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className="w-full card-base p-4 text-left hover:scale-[1.01] transition-transform flex items-center justify-between group"
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-zinc-400">ID: {ticket.id}</span>
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <Clock size={10} /> {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm leading-tight text-zinc-800 dark:text-zinc-200 group-hover:text-green-500 transition-colors">
                          {ticket.subject}
                        </h4>
                        <div className="flex items-center gap-2 mt-2.5">
                          <span className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[8px] font-bold uppercase tracking-wide text-zinc-400 flex items-center gap-1">
                            <Tag size={8} />
                            {ticket.category === 'Pickup' && '📅 '}
                            {ticket.category === 'Redemption' && '🎁 '}
                            {ticket.category === 'Rewards' && '⭐ '}
                            {ticket.category === 'App Issue' && '🐛 '}
                            {ticket.category === 'Other' && '💬 '}
                            {ticket.category}
                          </span>
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <MessageCircle size={10} /> {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {getStatusBadge(ticket.status)}
                        <span className="text-zinc-300 group-hover:text-green-500 transition-colors">➔</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              /* Raise Ticket Form */
              <form onSubmit={handleSubmitTicket} className="card-base p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Ticket Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. My pickup is delayed"
                    className="input-base"
                    style={{ borderRadius: '12px' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="input-base"
                    style={{ borderRadius: '12px', height: '48px', appearance: 'auto', paddingRight: '12px' }}
                  >
                    <option value="Pickup">Pickup Collection Inquiry</option>
                    <option value="Redemption">Redemption &amp; Delivery</option>
                    <option value="Rewards">Rewards &amp; Points</option>
                    <option value="App Issue">App Issues &amp; Bugs</option>
                    <option value="Other">Other Issues</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Explain your issue in detail</label>
                  <textarea
                    required
                    rows={5}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Provide as much detail as possible so our support team can resolve it quickly."
                    className="input-base py-3 h-auto"
                    style={{ borderRadius: '12px' }}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={!subject.trim() || !description.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2 h-12"
                  style={{ borderRadius: '14px' }}
                >
                  <Send size={16} /> Submit Ticket
                </button>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
}
