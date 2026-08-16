import React from 'react';
import { Users, Dog, Baby, User, ShieldCheck } from 'lucide-react';

interface GuestsAndPetsPopoverProps {
  adults: number;
  childrenCount: number;
  infants: number;
  pets: number;
  onChange: (counts: { adults: number; children: number; infants: number; pets: number }) => void;
  onClose: () => void;
}

export const GuestsAndPetsPopover: React.FC<GuestsAndPetsPopoverProps> = ({
  adults,
  childrenCount,
  infants,
  pets,
  onChange,
  onClose,
}) => {
  const updateCount = (key: 'adults' | 'children' | 'infants' | 'pets', delta: number) => {
    let nextAdults = adults;
    let nextChildren = childrenCount;
    let nextInfants = infants;
    let nextPets = pets;

    if (key === 'adults') nextAdults = Math.max(1, Math.min(16, adults + delta));
    if (key === 'children') {
      nextChildren = Math.max(0, Math.min(10, childrenCount + delta));
      // If adding child and adults is 0, set adults to 1
      if (nextChildren > 0 && nextAdults === 0) nextAdults = 1;
    }
    if (key === 'infants') nextInfants = Math.max(0, Math.min(5, infants + delta));
    if (key === 'pets') nextPets = Math.max(0, Math.min(5, pets + delta));

    onChange({
      adults: nextAdults,
      children: nextChildren,
      infants: nextInfants,
      pets: nextPets,
    });
  };

  const renderStepper = (
    label: string,
    subtitle: string,
    icon: React.ReactNode,
    value: number,
    onMinus: () => void,
    onPlus: () => void,
    minusDisabled: boolean,
    plusDisabled: boolean
  ) => {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 0',
          borderBottom: '1px solid var(--border, #f4f4f5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(90, 49, 244, 0.08)',
              color: 'var(--violet, #5a31f4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--ink, #18181b)' }}>{label}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500, #71717a)' }}>{subtitle}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            disabled={minusDisabled}
            onClick={onMinus}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid var(--border, #e4e4e7)',
              background: minusDisabled ? 'var(--gray-100, #f4f4f5)' : '#ffffff',
              color: minusDisabled ? 'var(--gray-400, #a1a1aa)' : 'var(--ink, #18181b)',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: minusDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            -
          </button>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, minWidth: '18px', textAlign: 'center' }}>
            {value}
          </span>
          <button
            type="button"
            disabled={plusDisabled}
            onClick={onPlus}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid var(--border, #e4e4e7)',
              background: plusDisabled ? 'var(--gray-100, #f4f4f5)' : '#ffffff',
              color: plusDisabled ? 'var(--gray-400, #a1a1aa)' : 'var(--ink, #18181b)',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: plusDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            +
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 12px)',
        right: '0',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '1.5rem',
        boxShadow: '0 20px 48px rgba(0, 0, 0, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.06)',
        zIndex: 2000,
        width: '360px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--violet)' }}>
          Travel Crew &amp; Pets
        </span>
      </div>

      {/* Adults */}
      {renderStepper(
        'Adults',
        'Age 13 or above',
        <User size={18} />,
        adults,
        () => updateCount('adults', -1),
        () => updateCount('adults', 1),
        adults <= 1,
        adults >= 16
      )}

      {/* Children */}
      {renderStepper(
        'Children',
        'Ages 2–12',
        <Users size={18} />,
        childrenCount,
        () => updateCount('children', -1),
        () => updateCount('children', 1),
        childrenCount <= 0,
        childrenCount >= 10
      )}

      {/* Infants */}
      {renderStepper(
        'Infants',
        'Under 2 (Does not count to guest limit)',
        <Baby size={18} />,
        infants,
        () => updateCount('infants', -1),
        () => updateCount('infants', 1),
        infants <= 0,
        infants >= 5
      )}

      {/* Pets */}
      {renderStepper(
        'Pets',
        'Service animals & pets',
        <Dog size={18} />,
        pets,
        () => updateCount('pets', -1),
        () => updateCount('pets', 1),
        pets <= 0,
        pets >= 5
      )}

      {pets > 0 && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.75rem 1rem',
            background: '#F0FDF4',
            borderRadius: '12px',
            border: '1px solid #BBF7D0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <ShieldCheck size={16} style={{ color: '#16A34A', flexShrink: 0 }} />
          <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
            Filtering for verified pet-friendly properties!
          </span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'var(--violet, #5a31f4)',
            color: '#fff',
            border: 'none',
            padding: '0.6rem 1.5rem',
            borderRadius: '14px',
            fontSize: '0.88rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
};
