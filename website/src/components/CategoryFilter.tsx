import React from 'react';
import { Sparkles, Palmtree, Trees, Mountain, ShieldCheck, Flame, Compass, Castle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PropertyCategoryType } from '../types';

interface CategoryItem {
  id: PropertyCategoryType;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'ALL', label: 'All Stays', icon: <Sparkles size={18} /> },
  { id: 'VILLA', label: 'Villas', icon: <Palmtree size={18} /> },
  { id: 'BEACHFRONT', label: 'Beachfront', icon: <WavesIcon /> },
  { id: 'CABIN', label: 'Cabins', icon: <Trees size={18} /> },
  { id: 'MANSION', label: 'Mansions', icon: <Castle size={18} /> },
  { id: 'TREEHOUSE', label: 'Treehouses', icon: <Mountain size={18} /> },
  { id: 'RV', label: 'RVs & Vans', icon: <Compass size={18} /> },
  { id: 'CAMPING_SITE', label: 'Camping', icon: <Flame size={18} /> },
  { id: 'ZERO_BROKER', label: 'Zero Broker', icon: <ShieldCheck size={18} />, badge: '0% Fee' },
];

function WavesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
    </svg>
  );
}

export const CategoryFilter: React.FC = () => {
  const { filters, updateFilters } = useApp();

  return (
    <div className="cat-filter">
      <div className="cat-filter__track">
        {CATEGORIES.map((cat) => {
          const isActive = filters.category === cat.id;
          return (
            <button
              key={cat.id}
              className={`cat-pill ${isActive ? 'cat-pill--active' : ''}`}
              onClick={() => updateFilters({ category: cat.id })}
              type="button"
            >
              <span className="cat-pill__icon">{cat.icon}</span>
              <span className="cat-pill__label">{cat.label}</span>
              {cat.badge && <span className="cat-pill__badge">{cat.badge}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
