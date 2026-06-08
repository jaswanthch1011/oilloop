import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft, Search, Leaf, Recycle, HelpCircle, Truck, Gift, Shield, Zap, Phone } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    id: 'general',
    name: 'General',
    icon: <HelpCircle size={20} />,
    color: '#22c55e',
    items: [
      {
        question: 'What is OilLoop?',
        answer: 'OilLoop is an eco-friendly platform that helps you recycle used cooking oil (UCO). We collect your used oil, convert it into biodiesel, and reward you with points for every liter you contribute. It\'s a win for you and a win for the planet!'
      },
      {
        question: 'Why should I recycle cooking oil?',
        answer: 'Used cooking oil dumped in drains causes water pollution, blocks sewage systems, and harms aquatic life. When recycled into biodiesel, each liter of UCO saves approximately 2.5 kg of CO₂ emissions and produces 0.85 liters of clean biodiesel fuel.'
      },
      {
        question: 'Is OilLoop free to use?',
        answer: 'Absolutely! OilLoop is completely free for all users. Not only do we pick up your used oil at no charge, we actually reward you with points that can be redeemed for real products!'
      },
      {
        question: 'Which cities is OilLoop available in?',
        answer: 'Currently, OilLoop operates in Hyderabad with collection points across Jubilee Hills, Banjara Hills, Madhapur, Gachibowli, and Kondapur. We\'re expanding to Bangalore, Chennai, and Mumbai soon!'
      },
    ]
  },
  {
    id: 'pickup',
    name: 'Pickups',
    icon: <Truck size={20} />,
    color: '#3b82f6',
    items: [
      {
        question: 'How do I schedule a pickup?',
        answer: 'Go to the "Pickup" tab, select a collection location near you, choose an available date and time slot, enter your oil details (type, estimated volume, number of containers), and confirm. You\'ll receive a pickup ID and can track the status in your History.'
      },
      {
        question: 'What containers can I use?',
        answer: 'You can use any clean, sealed container — plastic bottles, glass jars, or metal cans. Make sure the oil has cooled down completely and the container is properly sealed to prevent spills.'
      },
      {
        question: 'Can I cancel or reschedule a pickup?',
        answer: 'Yes! You can cancel or reschedule a pickup up to 2 hours before the scheduled time. Go to your History page, find the pickup, and tap "Reschedule" or "Cancel".'
      },
      {
        question: 'What\'s the minimum oil quantity?',
        answer: 'The minimum quantity for a pickup is 0.5 liters (500ml). There\'s no maximum limit — the more you recycle, the more points you earn!'
      },
      {
        question: 'What happens to my oil after pickup?',
        answer: 'Your oil goes through a multi-step process: Collection → Filtration → Quality Testing → Transesterification → Biodiesel. The entire process is tracked and transparent.'
      },
    ]
  },
  {
    id: 'scanning',
    name: 'Oil Scanning',
    icon: <Zap size={20} />,
    color: '#8b5cf6',
    items: [
      {
        question: 'How does the AI oil scan work?',
        answer: 'Our AI-powered scanner uses image recognition to identify the oil brand, type, and estimated volume from the packaging. Simply point your camera at the oil packet, and our system will detect the details automatically.'
      },
      {
        question: 'What if the scan doesn\'t recognize my oil?',
        answer: 'No worries! If the automatic scan can\'t identify your oil packet, you can manually enter the details — brand, oil type, and volume. You\'ll still earn the same points.'
      },
      {
        question: 'Do I earn points for scanning?',
        answer: 'Yes! Each scan earns you points based on the volume of oil. The base rate is 50 points per liter, with brand multipliers that can boost your earnings up to 1.5x!'
      },
    ]
  },
  {
    id: 'rewards',
    name: 'Rewards',
    icon: <Gift size={20} />,
    color: '#f59e0b',
    items: [
      {
        question: 'How do I earn points?',
        answer: 'You earn points through: Oil scans (50 pts/liter × brand multiplier), completing pickups, maintaining recycling streaks, referring friends (100 pts per referral), and unlocking badges. Every action counts!'
      },
      {
        question: 'What can I redeem points for?',
        answer: 'Points can be redeemed for real products in our marketplace including organic groceries, eco-friendly personal care items, home essentials, and sustainable products. New items are added regularly!'
      },
      {
        question: 'Do points expire?',
        answer: 'Points earned through regular activities are valid for 12 months from the date of earning. Bonus points from promotions may have shorter validity — check the specific offer terms.'
      },
      {
        question: 'How long does redemption delivery take?',
        answer: 'Most redeemed products are delivered within 3-5 business days. You can track your redemption status in the History section.'
      },
    ]
  },
  {
    id: 'eco',
    name: 'Eco Impact',
    icon: <Leaf size={20} />,
    color: '#10b981',
    items: [
      {
        question: 'How is CO₂ saving calculated?',
        answer: 'Each liter of used cooking oil recycled saves approximately 2.5 kg of CO₂ compared to fossil diesel. This is calculated based on the lifecycle analysis of biodiesel vs. conventional diesel fuel production and combustion.'
      },
      {
        question: 'What are eco-levels?',
        answer: 'Eco-levels are tiers that reflect your recycling commitment: 🌱 Seedling (0-100 pts), 🌿 Sprout (101-500 pts), 🌳 Tree (501-2000 pts), 🏔️ Forest (2001-5000 pts), and 🌍 Planet Saver (5001+ pts). Each level unlocks new badges and benefits!'
      },
      {
        question: 'How is biodiesel generated from used oil?',
        answer: 'Through a chemical process called transesterification, used cooking oil is mixed with methanol and a catalyst to produce FAME (Fatty Acid Methyl Ester) — biodiesel. Approximately 0.85 liters of biodiesel is produced per liter of UCO.'
      },
    ]
  },
  {
    id: 'account',
    name: 'Account',
    icon: <Shield size={20} />,
    color: '#ec4899',
    items: [
      {
        question: 'How do I change my profile details?',
        answer: 'Go to Profile → tap on your name, email, or phone to edit. You can also change your avatar by tapping on the avatar icon and selecting from our eco-themed collection.'
      },
      {
        question: 'How does the referral system work?',
        answer: 'Each user gets a unique referral code (found in Profile). Share it with friends — when they sign up and complete their first scan, both of you earn 100 bonus points!'
      },
      {
        question: 'Can I delete my account?',
        answer: 'Yes, you can request account deletion from Profile → Settings → Delete Account. Please note that this action is irreversible and all points, badges, and history will be permanently removed.'
      },
      {
        question: 'Is my data safe?',
        answer: 'Absolutely. We follow industry-standard security practices including encrypted data storage, secure authentication, and we never share your personal information with third parties without consent.'
      },
    ]
  },
];

function AccordionItem({ item, isOpen, toggle }: { item: FAQItem; isOpen: boolean; toggle: () => void }) {
  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: isOpen ? 'var(--bg-card)' : 'transparent',
        border: `1px solid ${isOpen ? 'var(--border-color)' : 'transparent'}`,
        boxShadow: isOpen ? '0 4px 20px var(--shadow-color)' : 'none',
      }}
    >
      <button
        onClick={toggle}
        className="w-full flex items-start gap-3 p-4 text-left transition-colors"
      >
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300"
          style={{
            background: isOpen ? 'var(--brand-primary)' : 'var(--bg-secondary)',
            transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        >
          <ChevronDown size={14} color={isOpen ? '#fff' : 'var(--text-muted)'} />
        </div>
        <span className="text-sm font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>
          {item.question}
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: isOpen ? '500px' : '0',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="px-4 pb-4 pl-[3.25rem]">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('general');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredCategories = search.trim()
    ? faqData.map(cat => ({
        ...cat,
        items: cat.items.filter(
          item =>
            item.question.toLowerCase().includes(search.toLowerCase()) ||
            item.answer.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(cat => cat.items.length > 0)
    : faqData.filter(cat => cat.id === activeCategory);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl">
          <ChevronLeft size={22} style={{ color: 'var(--text-primary)' }} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
            Help & FAQ
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Find answers to common questions</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
          <Recycle size={20} style={{ color: 'var(--brand-primary)' }} />
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-base pl-11"
          placeholder="Search for help..."
        />
      </div>

      {/* Category pills (hidden when searching) */}
      {!search.trim() && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
          {faqData.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300"
              style={{
                background: activeCategory === cat.id
                  ? `${cat.color}15`
                  : 'var(--bg-secondary)',
                color: activeCategory === cat.id ? cat.color : 'var(--text-muted)',
                border: `1.5px solid ${activeCategory === cat.id ? `${cat.color}40` : 'transparent'}`,
                boxShadow: activeCategory === cat.id ? `0 2px 12px ${cat.color}20` : 'none',
              }}
            >
              {cat.icon}
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* FAQ Items */}
      <div className="space-y-2">
        {filteredCategories.map(cat => (
          <div key={cat.id}>
            {search.trim() && (
              <div className="flex items-center gap-2 mb-3 mt-4">
                <span style={{ color: cat.color }}>{cat.icon}</span>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{cat.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${cat.color}15`, color: cat.color }}>
                  {cat.items.length}
                </span>
              </div>
            )}
            {cat.items.map((item, idx) => {
              const key = `${cat.id}-${idx}`;
              return (
                <AccordionItem
                  key={key}
                  item={item}
                  isOpen={openItems.has(key)}
                  toggle={() => toggleItem(key)}
                />
              );
            })}
          </div>
        ))}
        {filteredCategories.length === 0 && search.trim() && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No results found</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Try different keywords or browse categories
            </p>
          </div>
        )}
      </div>

      {/* Contact support card */}
      <div
        className="mt-8 p-5 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))',
          boxShadow: '0 8px 30px var(--glow-color)',
        }}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Phone size={22} color="#fff" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-base">Still need help?</h3>
            <p className="text-white/80 text-xs mt-1">
              Chat with our AI assistant or contact our support team for personalized help.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => navigate('/chatbot')}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'white', color: 'var(--brand-accent)' }}
              >
                💬 Chat with AI
              </button>
              <button
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/20 text-white transition-all"
              >
                📧 Email Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
