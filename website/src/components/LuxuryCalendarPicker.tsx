import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, X, RotateCcw } from 'lucide-react';

interface LuxuryCalendarPickerProps {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  onChange: (checkIn: string, checkOut: string) => void;
  onClose: () => void;
}

export const LuxuryCalendarPicker: React.FC<LuxuryCalendarPickerProps> = ({
  checkIn,
  checkOut,
  onChange,
  onClose,
}) => {
  const today = new Date();
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    if (checkIn) {
      const d = new Date(checkIn);
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Month navigation
  const nextMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    const prev = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1);
    // Don't navigate before current month
    if (prev >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonthDate(prev);
    }
  };

  const secondMonthDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1);

  // Quick Shortcuts
  const setPreset = (type: 'THIS_WEEKEND' | 'NEXT_WEEKEND' | 'ONE_WEEK' | 'FLEXIBLE') => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    if (type === 'THIS_WEEKEND') {
      const day = now.getDay();
      const diffToFri = (5 - day + 7) % 7;
      start.setDate(now.getDate() + (diffToFri === 0 ? 0 : diffToFri));
      end = new Date(start);
      end.setDate(start.getDate() + 2);
    } else if (type === 'NEXT_WEEKEND') {
      const day = now.getDay();
      const diffToFri = (5 - day + 7) % 7 + 7;
      start.setDate(now.getDate() + diffToFri);
      end = new Date(start);
      end.setDate(start.getDate() + 2);
    } else if (type === 'ONE_WEEK') {
      start.setDate(now.getDate() + 1);
      end.setDate(start.getDate() + 7);
    } else if (type === 'FLEXIBLE') {
      start.setDate(now.getDate() + 2);
      end.setDate(start.getDate() + 3);
    }

    const fmt = (d: Date) => d.toISOString().split('T')[0];
    onChange(fmt(start), fmt(end));
  };

  const handleDateClick = (dateStr: string) => {
    if (!checkIn || (checkIn && checkOut)) {
      // First click: start new selection
      onChange(dateStr, '');
    } else if (checkIn && !checkOut) {
      if (new Date(dateStr) < new Date(checkIn)) {
        // If clicked date is before checkIn, reset checkIn
        onChange(dateStr, '');
      } else if (dateStr === checkIn) {
        // Clicked same date: default to 1 night
        const nextDay = new Date(dateStr);
        nextDay.setDate(nextDay.getDate() + 1);
        onChange(dateStr, nextDay.toISOString().split('T')[0]);
      } else {
        // Valid end date
        onChange(checkIn, dateStr);
      }
    }
  };

  const calculateNights = (): number => {
    if (!checkIn || !checkOut) return 0;
    const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderMonth = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Blank days before first of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`blank-${i}`} style={{ height: '38px' }} />);
    }

    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isCheckIn = checkIn === dateStr;
      const isCheckOut = checkOut === dateStr;

      let isInRange = false;
      if (checkIn && checkOut) {
        isInRange = dateStr > checkIn && dateStr < checkOut;
      } else if (checkIn && !checkOut && hoverDate) {
        isInRange = dateStr > checkIn && dateStr <= hoverDate;
      }

      days.push(
        <button
          key={dateStr}
          type="button"
          disabled={isPast}
          onClick={() => handleDateClick(dateStr)}
          onMouseEnter={() => {
            if (checkIn && !checkOut) setHoverDate(dateStr);
          }}
          style={{
            height: '38px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            fontWeight: isCheckIn || isCheckOut ? 800 : 500,
            color: isPast
              ? 'var(--gray-300, #d1d5db)'
              : isCheckIn || isCheckOut
              ? '#ffffff'
              : 'var(--ink, #18181b)',
            background: isCheckIn || isCheckOut
              ? 'var(--violet, #5a31f4)'
              : isInRange
              ? 'rgba(90, 49, 244, 0.12)'
              : 'transparent',
            borderRadius: isCheckIn
              ? '12px 0 0 12px'
              : isCheckOut
              ? '0 12px 12px 0'
              : isInRange
              ? '0'
              : '10px',
            border: 'none',
            cursor: isPast ? 'not-allowed' : 'pointer',
            transition: 'all 0.12s ease',
          }}
        >
          {d}
        </button>
      );
    }

    return (
      <div style={{ flex: 1, minWidth: '260px' }}>
        <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.95rem', color: 'var(--ink, #18181b)', marginBottom: '0.75rem' }}>
          {monthName}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', gap: '2px', marginBottom: '0.5rem' }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w) => (
            <span key={w} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400, #9ca3af)' }}>
              {w}
            </span>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {days}
        </div>
      </div>
    );
  };

  const nights = calculateNights();

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 12px)',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '1.75rem',
        boxShadow: '0 20px 48px rgba(0, 0, 0, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.06)',
        zIndex: 2000,
        width: '95vw',
        maxWidth: '680px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--violet)' }}>
            Stay Q Smart Calendar
          </span>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', margin: '0.2rem 0 0' }}>
            {nights > 0
              ? `${nights} Night${nights > 1 ? 's' : ''} (${formatDateDisplay(checkIn)} – ${formatDateDisplay(checkOut)})`
              : checkIn
              ? `Select Check-out Date (Check-in: ${formatDateDisplay(checkIn)})`
              : 'Select Check-in Date'}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'var(--gray-100, #f4f4f5)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Quick Shortcuts */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setPreset('THIS_WEEKEND')}
          style={{
            padding: '0.4rem 0.85rem',
            borderRadius: '999px',
            border: '1px solid var(--border)',
            background: 'var(--gray-50)',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <Sparkles size={13} style={{ color: 'var(--violet)' }} /> This Weekend
        </button>
        <button
          type="button"
          onClick={() => setPreset('NEXT_WEEKEND')}
          style={{
            padding: '0.4rem 0.85rem',
            borderRadius: '999px',
            border: '1px solid var(--border)',
            background: 'var(--gray-50)',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Next Weekend
        </button>
        <button
          type="button"
          onClick={() => setPreset('ONE_WEEK')}
          style={{
            padding: '0.4rem 0.85rem',
            borderRadius: '999px',
            border: '1px solid var(--border)',
            background: 'var(--gray-50)',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          1 Week Stay
        </button>
        <button
          type="button"
          onClick={() => setPreset('FLEXIBLE')}
          style={{
            padding: '0.4rem 0.85rem',
            borderRadius: '999px',
            border: '1px solid var(--border)',
            background: 'var(--gray-50)',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Flexible Dates
        </button>
      </div>

      {/* Navigation Arrows & Dual Months */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'absolute', top: '0', left: '0', right: '0', zIndex: 10, pointerEvents: 'none' }}>
          <button
            type="button"
            onClick={prevMonth}
            style={{
              pointerEvents: 'auto',
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            style={{
              pointerEvents: 'auto',
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {renderMonth(currentMonthDate)}
          {renderMonth(secondMonthDate)}
        </div>
      </div>

      {/* Footer Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={() => onChange('', '')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'transparent',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--gray-600)',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={14} /> Clear Dates
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'var(--violet, #5a31f4)',
            color: '#fff',
            border: 'none',
            padding: '0.65rem 1.5rem',
            borderRadius: '14px',
            fontSize: '0.9rem',
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
