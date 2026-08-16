"use client";
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type = 'info', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-primary text-on-primary',
    error: 'bg-error text-on-error',
    info: 'bg-surface-container-highest text-on-surface'
  };

  const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info'
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg ${bgColors[type]}`}>
        <span className="material-symbols-outlined text-[20px]">{icons[type]}</span>
        <span className="font-label-md text-label-md">{message}</span>
      </div>
    </div>
  );
}
