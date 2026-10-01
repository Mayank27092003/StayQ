"use client";

import React, { useState } from 'react';
import {
  X,
  Crown,
  Zap,
  ArrowRight,
  Check,
  Gift,
  Coins,
  History,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LoyaltyTier } from '../types';

export const RewardsModal: React.FC = () => {
  const {
    isRewardsModalOpen,
    setIsRewardsModalOpen,
    loyaltyProfile,
    redeemPoints,
    upgradeTier,
    user,
    setIsAuthModalOpen,
  } = useApp();

  const [pointsToRedeem, setPointsToRedeem] = useState<number>(500);
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!isRewardsModalOpen) return null;

  const availablePoints = loyaltyProfile?.availablePoints || 0;
  const creditEquivalent = loyaltyProfile?.creditEquivalent || availablePoints * 0.5;
  const currentTier = loyaltyProfile?.tier || 'Q_STARTER';
  const multiplier = loyaltyProfile?.pointsMultiplier || 1.0;
  const transactions = loyaltyProfile?.transactions || [];

  const handleRedeem = async () => {
    if (pointsToRedeem > availablePoints) {
      setNotification({ message: 'Insufficient points balance', type: 'error' });
      return;
    }
    setIsRedeeming(true);
    setNotification(null);
    try {
      const success = await redeemPoints(pointsToRedeem);
      if (success) {
        setNotification({
          message: `🎉 Successfully converted ${pointsToRedeem} points to ₹${(pointsToRedeem * 0.5).toFixed(0)} Stay Q Credit!`,
          type: 'success',
        });
      } else {
        setNotification({ message: 'Failed to redeem points. Please try again.', type: 'error' });
      }
    } catch {
      setNotification({ message: 'Error redeeming points', type: 'error' });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleUpgrade = async (tier: LoyaltyTier, title: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsUpgrading(tier);
    setNotification(null);
    try {
      const success = await upgradeTier(tier);
      if (success) {
        setNotification({
          message: `👑 Welcome to ${title}! Enjoy ${tier === 'Q_PREMIUM' ? '2.0x Double Points' : '1.5x Multiplier'} and VIP perks.`,
          type: 'success',
        });
      } else {
        setNotification({ message: 'Failed to upgrade tier', type: 'error' });
      }
    } catch {
      setNotification({ message: 'Error upgrading membership', type: 'error' });
    } finally {
      setIsUpgrading(null);
    }
  };

  const tiers = [
    {
      key: 'Q_STARTER' as LoyaltyTier,
      title: 'Q Starter',
      price: 'Free',
      multiplier: '1.0x',
      color: 'from-slate-600 to-slate-800',
      badgeColor: 'bg-slate-700 text-slate-200',
      borderColor: 'border-slate-700/50',
      perks: [
        'Earn 1 pt per ₹100 spent',
        '500 pts = ₹250 Stay Q Credit',
        'Standard guest concierge',
      ],
    },
    {
      key: 'Q_PLUS' as LoyaltyTier,
      title: 'Q Plus',
      price: '₹499 / yr',
      multiplier: '1.5x Multiplier',
      color: 'from-purple-600 to-indigo-800',
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      borderColor: 'border-purple-500/50',
      popular: true,
      perks: [
        '⚡ 1.5x Points on all bookings',
        '⏰ Early check-in & late checkout',
        '🌟 Priority 24/7 VIP concierge',
        '🏷️ 5% extra discount on select villas',
        '🎁 +50 Welcome Bonus Points',
      ],
    },
    {
      key: 'Q_PREMIUM' as LoyaltyTier,
      title: 'Q Premium',
      price: '₹999 / yr',
      multiplier: '2.0x Double Points',
      color: 'from-amber-600 to-yellow-800',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      borderColor: 'border-amber-500/50',
      perks: [
        '⚡⚡ 2.0x Double points on all bookings',
        '👑 Free cancellation & room upgrades',
        '🛎️ Dedicated personal trip designer',
        '🚗 Airport / transfer discounts',
        '🎁 +100 Welcome Bonus Points',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Close Button */}
        <button
          onClick={() => setIsRewardsModalOpen(false)}
          className="absolute top-5 right-5 z-10 p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content Scrollable */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-8">
          {/* Notification Alert */}
          {notification && (
            <div
              className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 ${
                notification.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <span>{notification.message}</span>
            </div>
          )}

          {/* Hero Points Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-6 sm:p-8 border border-purple-500/30 shadow-xl">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-purple-400" />
                    {loyaltyProfile?.tierDetails?.title || 'Q Starter'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {multiplier}x Points Multiplier
                  </span>
                </div>
                <div className="text-xs font-bold tracking-wider text-slate-400 uppercase pt-2">
                  Available Rewards Balance
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    {availablePoints.toLocaleString()}
                  </span>
                  <span className="text-lg font-bold text-purple-300">Points</span>
                </div>
                <div className="text-sm font-medium text-slate-300">
                  ≈ <span className="font-bold text-emerald-400">₹{creditEquivalent.toFixed(0)}</span> Stay Q Credit (500 pts = ₹250 Credit)
                </div>
              </div>

              {/* Quick Redeem Box */}
              <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-700/60 max-w-sm w-full space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>REDEEM FOR CREDIT</span>
                  <span className="text-emerald-400">500 pts = ₹250</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Convert</span>
                    <span className="font-bold text-white">{pointsToRedeem} Points</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max={Math.max(100, availablePoints)}
                    step="50"
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                    disabled={availablePoints < 100}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>Min: 100</span>
                    <span>Max: {availablePoints}</span>
                  </div>
                </div>

                <button
                  onClick={handleRedeem}
                  disabled={isRedeeming || availablePoints < 100}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition shadow-lg shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRedeeming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4" />
                      Get ₹{(pointsToRedeem * 0.5).toFixed(0)} Wallet Credit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Membership Tiers Grid */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Membership Tiers</h3>
              <p className="text-xs text-slate-400">Upgrade to unlock point multipliers, free cancellations & VIP upgrades</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {tiers.map((t) => {
                const isCurrent = currentTier === t.key;
                return (
                  <div
                    key={t.key}
                    className={`relative rounded-2xl p-5 bg-slate-900 border flex flex-col justify-between transition hover:border-slate-600 ${
                      isCurrent ? `${t.borderColor} ring-2 ring-purple-500/30` : 'border-slate-800'
                    }`}
                  >
                    {t.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md">
                        Most Popular
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-black text-white">{t.title}</h4>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">{t.price}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.badgeColor}`}>
                          {t.multiplier}
                        </span>
                      </div>
                      <ul className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
                        {t.perks.map((perk, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-5">
                      {isCurrent ? (
                        <div className="w-full py-2.5 rounded-xl text-center text-xs font-bold text-slate-400 bg-slate-800/60 border border-slate-700">
                          Current Tier
                        </div>
                      ) : t.key !== 'Q_STARTER' ? (
                        <button
                          onClick={() => handleUpgrade(t.key, t.title)}
                          disabled={isUpgrading === t.key}
                          className="w-full py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white transition flex items-center justify-center gap-2 shadow-md shadow-purple-600/20"
                        >
                          {isUpgrading === t.key ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              Upgrade to {t.title}
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="w-full py-2.5 rounded-xl text-center text-xs font-bold text-slate-500">
                          Free Forever
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ways to Earn Points */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-white tracking-tight">How You Earn Points</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: '🏨', title: 'Book Stays', desc: '1 Point per ₹100 spent (multiplied by your tier)', badge: 'Dynamic' },
                { icon: '⭐', title: 'Write Reviews', desc: '10 points for every verified stay review', badge: '+10 pts' },
                { icon: '🤝', title: 'Refer Friends', desc: '25 points when friends take their 1st trip', badge: '+25 pts' },
                { icon: '👤', title: 'Complete Profile', desc: '15 points for Aadhaar & KYC verification', badge: '+15 pts' },
                { icon: '🔁', title: 'Repeat Stays', desc: '20 bonus points on re-booking favorite stays', badge: '+20 pts' },
                { icon: '🎁', title: 'Tier Welcome', desc: 'Up to 100 instant bonus points on tier join', badge: '+100 pts' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3.5"
                >
                  <span className="text-2xl p-2 rounded-xl bg-slate-800/80">{item.icon}</span>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-sm text-white">{item.title}</h5>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/20 text-purple-300">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Points Activity History */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              Points Activity History
            </h3>
            {transactions.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                <Gift className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm font-bold text-slate-300">No points activity yet</p>
                <p className="text-xs text-slate-500">Book stays or leave reviews to start earning Stay Q Points!</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900 border border-slate-800 divide-y divide-slate-800/60 overflow-hidden">
                {transactions.map((tx) => {
                  const isPositive = tx.points >= 0;
                  return (
                    <div key={tx.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl ${
                            isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          <TrendingUp className={`w-4 h-4 ${!isPositive && 'rotate-180'}`} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{tx.reason}</div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                      <div className={`text-sm font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? '+' : ''}
                        {tx.points} pts
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
