"use client";

import React, { useEffect } from 'react';
import { X, Sparkles, Compass, Palmtree, Mountain, Landmark, Building, Trees, Tent } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SearchBar } from './SearchBar';

const QUICK_EXPLORE_TAGS = [
  { label: 'Goa Beaches', query: 'Goa', icon: <Palmtree size={14} color="#0EA5E9" /> },
  { label: 'Manali Cabins', query: 'Manali', icon: <Mountain size={14} color="#6366F1" /> },
  { label: 'Udaipur Palaces', query: 'Udaipur', icon: <Landmark size={14} color="#F59E0B" /> },
  { label: 'Wayanad Treehouses', query: 'Wayanad', icon: <Trees size={14} color="#10B981" /> },
  { label: 'Bangalore Lofts', query: 'Bengaluru', icon: <Building size={14} color="#8B5CF6" /> },
  { label: 'Ladakh RV Glamping', query: 'Leh Ladakh', icon: <Tent size={14} color="#EC4899" /> },
];

export const SearchModal: React.FC = () => {
  const { isSearchModalOpen, setIsSearchModalOpen, updateFilters } = useApp();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchModalOpen) {
        setIsSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, setIsSearchModalOpen]);

  if (!isSearchModalOpen) return null;

  const handleQuickTagClick = (query: string) => {
    updateFilters({ destination: query });
    setIsSearchModalOpen(false);
    
    // Smooth scroll to catalog
    setTimeout(() => {
      const el = document.getElementById('stays-catalog');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.hash = '#/stays';
      }
    }, 100);
  };

  return (
    <div
      className="search-modal-backdrop"
      onClick={() => setIsSearchModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Search Stays"
    >
      <div className="search-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="search-modal-header">
          <div className="search-modal-title-group">
            <span className="eyebrow" style={{ marginBottom: '4px' }}>
              <Sparkles size={13} /> Where to next?
            </span>
            <h2 className="search-modal-title">Search Luxury Stays &amp; Direct Homes</h2>
          </div>
          <button
            type="button"
            className="search-modal-close"
            onClick={() => setIsSearchModalOpen(false)}
            aria-label="Close search"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar Container */}
        <div className="search-modal-body">
          <SearchBar />

          {/* Quick Popular Destinations */}
          <div className="search-modal-quick">
            <span className="search-modal-quick-label">
              <Compass size={14} /> Popular Destinations:
            </span>
            <div className="search-modal-quick-tags">
              {QUICK_EXPLORE_TAGS.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  className="search-quick-tag"
                  onClick={() => handleQuickTagClick(tag.query)}
                >
                  {tag.icon}
                  <span>{tag.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
