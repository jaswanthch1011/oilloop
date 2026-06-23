import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Bot, User, Sparkles, Leaf, Loader2, Trash2, ArrowDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../lib/api';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  typing?: boolean;
}

// Knowledge base for the chatbot
const knowledgeBase: Record<string, string[]> = {
  greeting: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'howdy', 'greetings'],
  pickup: ['pickup', 'pick up', 'schedule', 'collect', 'collection', 'drop off', 'dropoff', 'when', 'time slot'],
  scan: ['scan', 'camera', 'detect', 'recognize', 'ai', 'image', 'packet', 'bottle', 'brand'],
  points: ['point', 'earn', 'score', 'balance', 'how many points', 'reward point'],
  rewards: ['reward', 'redeem', 'gift', 'marketplace', 'product', 'buy', 'shop'],
  impact: ['impact', 'co2', 'carbon', 'biodiesel', 'environment', 'eco', 'green', 'save', 'planet', 'recycle'],
  badges: ['badge', 'achievement', 'level', 'tier', 'eco-level', 'ecolevel', 'seedling', 'sprout', 'forest'],
  referral: ['refer', 'invite', 'friend', 'code', 'share', 'referral'],
  account: ['account', 'profile', 'password', 'email', 'phone', 'settings', 'avatar', 'name', 'login'],
  help: ['help', 'support', 'contact', 'problem', 'issue', 'bug', 'error', 'complaint'],
  oil: ['oil', 'cooking oil', 'used oil', 'uco', 'sunflower', 'mustard', 'coconut', 'quantity', 'liter', 'volume'],
  leaderboard: ['leaderboard', 'rank', 'ranking', 'top', 'competition', 'compete', 'leader'],
  admin: ['admin', 'dashboard', 'manage', 'analytics', 'statistics', 'admin dashboard'],
};

const responses: Record<string, string[]> = {
  greeting: [
    "Hello! 🌿 Welcome to FrytoFly! I'm your eco-assistant. How can I help you today?",
    "Hey there! ♻️ I'm here to help you with anything about recycling cooking oil. What would you like to know?",
    "Hi! 🌱 Great to see you! Ask me anything about pickups, scanning, rewards, or your eco impact!",
  ],
  pickup: [
    "📅 **Scheduling a Pickup is easy!**\n\n1. Go to the **Pickup** tab\n2. Choose a collection location near you\n3. Select an available date & time slot\n4. Enter your oil details (type, volume, containers)\n5. Confirm and you're done!\n\nWe have 5 collection points across Hyderabad with slots from 7 AM to 8 PM. Need help finding the nearest one?",
    "🚛 **Pickup Info:**\n\n• **Minimum quantity:** 0.5 liters\n• **Reschedule:** Up to 2 hours before\n• **Status tracking:** Real-time in History tab\n• **Containers:** Any clean, sealed container works\n\nYour oil goes through: Collection → Filtration → Quality Testing → Biodiesel Production!",
  ],
  scan: [
    "📸 **AI Oil Scan Feature:**\n\nOur smart scanner uses image recognition to identify:\n• **Brand** (Fortune, Saffola, Dhara, etc.)\n• **Oil Type** (Sunflower, Mustard, Coconut, etc.)\n• **Volume** (0.5L to 15L)\n\nJust point your camera at the oil packet and tap scan! If auto-detection doesn't work, you can always enter details manually.\n\n💡 **Tip:** Good lighting helps the AI scan faster!",
  ],
  points: [
    "⭐ **How Points Work:**\n\n• **Base rate:** 50 points per liter of UCO\n• **Brand multipliers:** Up to 1.5x boost!\n• **Referral bonus:** 100 pts per friend who joins\n• **Streak bonus:** Extra points for consecutive days\n\n**Quick calculation:**\n1L of Fortune Sunflower Oil = 50 × 1.2 = **60 points**\n5L of Saffola Rice Bran = 250 × 1.3 = **325 points**\n\nPoints are valid for 12 months from earning date.",
  ],
  rewards: [
    "🎁 **Rewards Marketplace:**\n\nRedeem your points for real products!\n\n**Categories:**\n• 🛒 **Groceries** — Organic rice, honey, green tea\n• 🧴 **Personal Care** — Natural soaps, moisturizers\n• 🏠 **Home** — Plant kits, compost bins, biodegradable plates\n• 🌿 **Eco Products** — Bamboo brushes, steel bottles, jute bags\n\nNew items added every week! Deliveries take 3-5 business days.",
  ],
  impact: [
    "🌍 **Your Eco Impact Matters!**\n\nHere's what happens with every liter:\n• **2.5 kg CO₂** saved vs fossil diesel\n• **0.85 liters biodiesel** produced\n• **50+ points** earned\n\nCheck your personal impact dashboard for real-time stats including liters recycled, CO₂ saved, and biodiesel generated. Every drop counts! 💧",
  ],
  badges: [
    "🏆 **Badges & Eco-Levels:**\n\n**Eco-Levels (5 tiers):**\n🌱 Seedling (0-100 pts)\n🌿 Sprout (101-500 pts)\n🌳 Tree (501-2000 pts)\n🏔️ Forest (2001-5000 pts)\n🌍 Planet Saver (5001+ pts)\n\n**Badges to unlock:**\n💧 First Drop — First scan\n⚔️ Weekly Warrior — 7-day streak\n🏆 Liter Legend — 10L recycled\n👑 Community Champion — 5 referrals\n💯 Century Club — 100 scans\n🌟 Eco Ambassador — Share on social",
  ],
  referral: [
    "🤝 **Referral Program:**\n\n1. Find your unique code in Profile\n2. Share it with friends via link or social media\n3. When they sign up & complete first scan:\n   • **You** get 100 bonus points\n   • **They** get 100 bonus points\n\nNo limit on referrals! Top referrers can unlock the **Community Champion** badge at 5 referrals. 🎉",
  ],
  account: [
    "👤 **Account Management:**\n\n• **Edit profile:** Profile tab → tap any field to edit\n• **Change avatar:** Tap your avatar → choose from eco icons\n• **Theme:** Toggle dark/light mode in Settings\n• **Notifications:** Customize in Profile → Settings\n• **Delete account:** Profile → Settings → Delete Account\n\nYour data is encrypted and never shared with third parties. 🔒",
  ],
  help: [
    "📞 **Need More Help?**\n\nI'm here to assist! Here are your support options:\n\n• **This chatbot** — Ask me anything!\n• **FAQ section** — Detailed answers to common questions\n• **Email:** support@frytofly.in\n• **Phone:** +91 1800-FRY-TO-FLY\n• **Response time:** Within 24 hours\n\nWhat specific issue are you facing? I'll try my best to help! 🌿",
  ],
  oil: [
    "🫙 **About Used Cooking Oil:**\n\n**Accepted types:**\nSunflower, Mustard, Coconut, Groundnut, Soybean, Palm, Olive, Rice Bran, Sesame, Canola\n\n**Tips for collection:**\n• Let oil cool completely before storing\n• Use any clean, sealed container\n• Don't mix with water or food waste\n• Strain out food particles if possible\n\n**Minimum quantity:** 0.5 liters\n**No maximum limit!** The more you recycle, the bigger your impact! 🌍",
  ],
  leaderboard: [
    "📊 **Leaderboard:**\n\nCompete with fellow eco-warriors!\n\n• **Weekly, Monthly, All-time** rankings\n• Top 3 get a special podium display 🥇🥈🥉\n• Your rank is always highlighted\n• Rankings based on total points earned\n\nClimb the leaderboard by scanning more oil, maintaining streaks, and referring friends!",
  ],
  admin: [
    "🛡️ **Admin Dashboard:**\n\nAdmin access includes:\n• **Overview metrics** — Total users, liters, active pickups\n• **Analytics charts** — Orders by location, daily collection, user growth\n• **Order management** — Search, sort, update pickup statuses\n• **Location management** — Add/edit collection points\n\nTo access admin features, log in with the Admin role from the login page.",
  ],
};

const defaultResponse = [
  "🤔 I'm not sure I understand that. Let me help you with what I know about!\n\nTry asking about:\n• 📅 Scheduling pickups\n• 📸 Oil scanning\n• ⭐ Earning points\n• 🎁 Rewards & redemptions\n• 🌍 Environmental impact\n• 🏆 Badges & levels\n• 👤 Account settings\n\nOr you can visit our **FAQ section** for detailed answers!",
  "Hmm, I didn't quite catch that. 🤖\n\nHere are some things I can help with:\n• How to schedule a pickup\n• How the AI scan works\n• Points and rewards system\n• Your eco impact\n• Account & profile settings\n\nFeel free to ask in your own words!",
];

const quickActions = [
  { label: '📅 Schedule Pickup', query: 'How do I schedule a pickup?' },
  { label: '⭐ Earn Points', query: 'How do I earn points?' },
  { label: '📸 Oil Scanning', query: 'How does the AI scan work?' },
  { label: '🎁 Rewards', query: 'What rewards can I redeem?' },
  { label: '🌍 Eco Impact', query: 'What is my environmental impact?' },
  { label: '🏆 Badges', query: 'Tell me about badges and eco-levels' },
];

function classifyMessage(message: string): string {
  const lower = message.toLowerCase().trim();
  let bestMatch = '';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(knowledgeBase)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        score += keyword.length; // Longer matches get higher scores
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }

  return bestMatch || 'unknown';
}

function getResponse(category: string): string {
  if (category === 'unknown' || !responses[category]) {
    return defaultResponse[Math.floor(Math.random() * defaultResponse.length)];
  }
  const options = responses[category];
  return options[Math.floor(Math.random() * options.length)];
}

export default function ChatbotPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'bot',
      content: `Hello${user ? ` ${user.name}` : ''}! 🌿 I'm **FlyBot**, your FrytoFly eco-assistant.\n\nI can help you with:\n• Scheduling pickups & tracking orders\n• Understanding the AI scan feature\n• Points, rewards & badges system\n• Environmental impact info\n• Account & profile settings\n\nAsk me anything or tap a quick action below! ♻️`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate thinking delay
    const delay = 600 + Math.random() * 800;
    setTimeout(() => {
      const category = classifyMessage(text);
      const response = getResponse(category);

      const botMsg: Message = {
        id: `msg-${Date.now()}-bot`,
        role: 'bot',
        content: response,
        timestamp: new Date(),
      };

      setIsTyping(false);
      setMessages(prev => [...prev, botMsg]);
    }, delay);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome-new',
      role: 'bot',
      content: "Chat cleared! 🧹 I'm ready for new questions. How can I help?",
      timestamp: new Date(),
    }]);
  };

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content.split('\n').map((line, i) => {
      // Bold text
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <span key={i} className="block" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl transition-colors" style={{ color: 'var(--text-primary)' }}>
          <ChevronLeft size={22} />
        </button>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))' }}
        >
          <Bot size={20} color="#fff" />
        </div>
        <div className="flex-1">
          <h1 className="text-base font-bold font-display" style={{ color: 'var(--text-primary)' }}>
            FlyBot
          </h1>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Online • AI Assistant</span>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="Clear chat"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Chat messages */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide relative"
      >
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-scale-in`}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
              style={{
                background: msg.role === 'bot'
                  ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))'
                  : 'var(--bg-secondary)',
              }}
            >
              {msg.role === 'bot' ? <Leaf size={14} color="#fff" /> : <span>{user?.avatar || '👤'}</span>}
            </div>

            {/* Bubble */}
            <div
              className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={{
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))'
                  : 'var(--bg-card)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                border: msg.role === 'bot' ? '1px solid var(--border-color)' : 'none',
                borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                borderTopLeftRadius: msg.role === 'bot' ? '4px' : '16px',
                boxShadow: '0 2px 8px var(--shadow-color)',
              }}
            >
              {formatContent(msg.content)}
              <span
                className="block text-[10px] mt-1.5 opacity-60"
                style={{ textAlign: msg.role === 'user' ? 'right' : 'left' }}
              >
                {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2.5 animate-scale-in">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))' }}
            >
              <Leaf size={14} color="#fff" />
            </div>
            <div
              className="rounded-2xl px-5 py-3 flex items-center gap-1.5"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderTopLeftRadius: '4px',
              }}
            >
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--brand-primary)', animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--brand-primary)', animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--brand-primary)', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Quick actions (show at start) */}
        {messages.length <= 1 && !isTyping && (
          <div className="pt-2">
            <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Sparkles size={14} /> Quick Actions
            </p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(action.query)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollDown && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-20 transition-all"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <ArrowDown size={18} style={{ color: 'var(--text-primary)' }} />
        </button>
      )}

      {/* Input bar */}
      <div
        className="flex-shrink-0 px-4 py-3"
        style={{
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="input-base flex-1 py-2.5"
            placeholder="Ask me anything about FrytoFly..."
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0"
            style={{
              background: input.trim()
                ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))'
                : 'var(--bg-secondary)',
              opacity: input.trim() ? 1 : 0.5,
              boxShadow: input.trim() ? '0 2px 12px var(--glow-color)' : 'none',
            }}
          >
            {isTyping ? (
              <Loader2 size={18} className="animate-spin" color={input.trim() ? '#fff' : 'var(--text-muted)'} />
            ) : (
              <Send size={18} color={input.trim() ? '#fff' : 'var(--text-muted)'} />
            )}
          </button>
        </form>
        <p className="text-[10px] text-center mt-2" style={{ color: 'var(--text-muted)' }}>
          FlyBot provides AI-assisted answers. For urgent issues, contact support.
        </p>
      </div>
    </div>
  );
}
