"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Toast from "@/components/Toast";

interface HostPlan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  billingPeriod: "MONTHLY" | "ANNUAL";
  savingsText?: string;
  badge?: string;
  features: string[];
}

const DEFAULT_PLANS: HostPlan[] = [
  {
    id: "HOST_PRO_MONTHLY",
    name: "StayQ Host Pro (Monthly)",
    tagline: "Comparable listing intelligence & advanced metrics",
    price: 999,
    billingPeriod: "MONTHLY",
    savingsText: "Standard Monthly Billing",
    badge: "Flexible",
    features: [
      "Unmasked details of comparable active StayQ listings",
      "30-day access to competitor ADR & occupancy metrics",
      "Priority customer & host support channel",
    ],
  },
  {
    id: "HOST_PRO_ANNUAL",
    name: "StayQ Host Pro (Annual)",
    tagline: "Uncapped annual intelligence suite with maximum savings",
    price: 7999,
    billingPeriod: "ANNUAL",
    savingsText: "Save 33% annually (₹666/mo equivalent)",
    badge: "Best Value",
    features: [
      "Unmasked details of comparable active StayQ listings",
      "365-day access to all regional booking trends",
      "Priority host search ranking algorithm boost",
      "Dedicated account manager on WhatsApp",
    ],
  },
];

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<HostPlan[]>(DEFAULT_PLANS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string>("HOST_PRO_MONTHLY");
  const [newFeatureText, setNewFeatureText] = useState("");

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/v1/subscriptions/admin/plans");
      if (res.data?.success && Array.isArray(res.data?.plans) && res.data.plans.length > 0) {
        setPlans(res.data.plans);
        if (res.data.plans[0]) {
          setEditingPlanId(res.data.plans[0].id);
        }
      }
    } catch (err: any) {
      console.warn("Could not fetch remote plans, using active defaults:", err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (id: string, newPrice: number) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, price: Math.max(0, newPrice) } : p))
    );
  };

  const handleFieldChange = (id: string, field: keyof HostPlan, value: any) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleAddFeature = (id: string) => {
    if (!newFeatureText.trim()) return;
    setPlans((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, features: [...p.features, newFeatureText.trim()] } : p
      )
    );
    setNewFeatureText("");
  };

  const handleRemoveFeature = (id: string, index: number) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, features: p.features.filter((_, i) => i !== index) }
          : p
      )
    );
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await axios.put("/api/v1/subscriptions/admin/plans", { plans });
      if (res.data?.success) {
        setPlans(res.data.plans);
        setToast({
          message: "Host Subscription plans & pricing updated successfully in database!",
          type: "success",
        });
      } else {
        setToast({ message: "Failed to update plans", type: "error" });
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setToast({
        message: err?.response?.data?.message || "Error saving plans to backend API",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const activePlan = plans.find((p) => p.id === editingPlanId) || plans[0];

  return (
    <div className="w-full max-w-[1400px] mx-auto p-6 space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[#5A31F4] font-bold text-xs uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
            Monetization &amp; Pricing Engine
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            StayQ Host Pro Subscriptions
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure live pricing, currency formatting (₹), features, and tier discounts synchronized with the StayQ Flutter mobile app.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPlans}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refresh Plans
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#5A31F4] hover:bg-[#4823d9] text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {saving ? "sync" : "cloud_done"}
            </span>
            {saving ? "Publishing to API..." : "Publish Pricing Changes"}
          </button>
        </div>
      </div>

      {/* Metric Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Tier Price</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 flex items-baseline gap-1">
            <span className="text-[#5A31F4]">₹</span>
            {plans.find((p) => p.billingPeriod === "MONTHLY")?.price.toLocaleString("en-IN") || 999}
            <span className="text-xs font-semibold text-slate-400">/ month</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Billed every 30 days</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Annual Tier Price</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 flex items-baseline gap-1">
            <span className="text-emerald-600">₹</span>
            {plans.find((p) => p.billingPeriod === "ANNUAL")?.price.toLocaleString("en-IN") || 7999}
            <span className="text-xs font-semibold text-slate-400">/ year</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">₹666/mo equivalent</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Currency Format</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-lg bg-purple-50 text-[#5A31F4] flex items-center justify-center font-bold text-sm border border-purple-200">
              ₹
            </span>
            <span>INR</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Indian Rupee symbol (₹)</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">App Sync State</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[22px]">bolt</span>
            <span>Live Sync</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Synced to Cloud Run &amp; Mobile</p>
        </div>
      </div>

      {/* Main Grid: Plan Selector & Editor + Live Mobile Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Plan Editor */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#5A31F4]">tune</span>
              Plan Parameters Editor
            </h2>
            {/* Tier Selector Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setEditingPlanId(p.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    editingPlanId === p.id
                      ? "bg-white text-[#5A31F4] shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {p.billingPeriod}
                </button>
              ))}
            </div>
          </div>

          {activePlan && (
            <div className="space-y-5">
              {/* Plan Name & Badge */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Plan Display Name
                  </label>
                  <input
                    type="text"
                    value={activePlan.name}
                    onChange={(e) => handleFieldChange(activePlan.id, "name", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#5A31F4] focus:ring-2 focus:ring-purple-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Promo Badge
                  </label>
                  <input
                    type="text"
                    value={activePlan.badge || ""}
                    placeholder="e.g. Best Value, Flexible"
                    onChange={(e) => handleFieldChange(activePlan.id, "badge", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#5A31F4] focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>

              {/* Price (INR) with Rupee Sign & Quick Presets */}
              <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 space-y-3">
                <label className="block text-xs font-bold text-[#5A31F4] uppercase">
                  Subscription Price (₹ Indian Rupees)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-700">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={activePlan.price}
                      onChange={(e) => handlePriceChange(activePlan.id, Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-purple-200 bg-white text-xl font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5A31F4]"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase px-3 py-2 bg-white rounded-xl border border-purple-100">
                    / {activePlan.billingPeriod.toLowerCase()}
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-400 font-semibold">Presets:</span>
                  {activePlan.billingPeriod === "MONTHLY" ? (
                    <>
                      <button
                        onClick={() => handlePriceChange(activePlan.id, 499)}
                        className="px-2.5 py-1 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:border-[#5A31F4]"
                      >
                        ₹499
                      </button>
                      <button
                        onClick={() => handlePriceChange(activePlan.id, 999)}
                        className="px-2.5 py-1 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:border-[#5A31F4]"
                      >
                        ₹999 (Current)
                      </button>
                      <button
                        onClick={() => handlePriceChange(activePlan.id, 1499)}
                        className="px-2.5 py-1 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:border-[#5A31F4]"
                      >
                        ₹1,499
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handlePriceChange(activePlan.id, 4999)}
                        className="px-2.5 py-1 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:border-[#5A31F4]"
                      >
                        ₹4,999
                      </button>
                      <button
                        onClick={() => handlePriceChange(activePlan.id, 7999)}
                        className="px-2.5 py-1 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:border-[#5A31F4]"
                      >
                        ₹7,999 (Current)
                      </button>
                      <button
                        onClick={() => handlePriceChange(activePlan.id, 9999)}
                        className="px-2.5 py-1 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:border-[#5A31F4]"
                      >
                        ₹9,999
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Tagline & Savings Note */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={activePlan.tagline}
                    onChange={(e) => handleFieldChange(activePlan.id, "tagline", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#5A31F4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Savings Text / Promo Subtitle
                  </label>
                  <input
                    type="text"
                    value={activePlan.savingsText || ""}
                    placeholder="e.g. Save 33% annually"
                    onChange={(e) => handleFieldChange(activePlan.id, "savingsText", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#5A31F4]"
                  />
                </div>
              </div>

              {/* Features List Editor */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 uppercase">
                    Feature Bullets ({activePlan.features.length})
                  </label>
                  <span className="text-[11px] text-slate-400">Shown in mobile feature list</span>
                </div>

                <div className="space-y-2">
                  {activePlan.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                        check_circle
                      </span>
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => {
                          const updated = [...activePlan.features];
                          updated[idx] = e.target.value;
                          handleFieldChange(activePlan.id, "features", updated);
                        }}
                        className="flex-1 bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                      />
                      <button
                        onClick={() => handleRemoveFeature(activePlan.id, idx)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                        title="Remove feature"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new feature input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddFeature(activePlan.id)}
                    placeholder="Add a new perk or feature bullet..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#5A31F4]"
                  />
                  <button
                    onClick={() => handleAddFeature(activePlan.id)}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Live Mobile App Card Preview */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#1E1238] to-[#120B24] rounded-3xl p-6 text-white shadow-2xl border border-purple-900/50 relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#9D00FF]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">smartphone</span>
              Mobile App Preview
            </span>
            <span className="text-[11px] text-purple-200/60 font-mono">Live Flutter Render</span>
          </div>

          {activePlan && (
            <div className="bg-white/[0.07] backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  {activePlan.badge && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold uppercase mb-2">
                      {activePlan.badge}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-white tracking-tight">{activePlan.name}</h3>
                  <p className="text-xs text-purple-200/70 mt-0.5">{activePlan.tagline}</p>
                </div>
              </div>

              {/* Price Display with bold Rupee sign */}
              <div className="pt-2 border-t border-white/10 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-purple-400">₹</span>
                <span className="text-4xl font-black text-white tracking-tight">
                  {activePlan.price.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-semibold text-purple-200/60">
                  / {activePlan.billingPeriod === "MONTHLY" ? "month" : "year"}
                </span>
              </div>

              {activePlan.savingsText && (
                <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">savings</span>
                  {activePlan.savingsText}
                </div>
              )}

              {/* Features List Preview */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                  Included Privileges:
                </p>
                {activePlan.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-purple-100/90 leading-tight">
                    <span className="material-symbols-outlined text-emerald-400 text-[16px] shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#9D00FF] to-[#5A31F4] text-white font-bold text-xs shadow-lg shadow-purple-900/50 flex items-center justify-center gap-1.5 tracking-wide"
                >
                  <span className="material-symbols-outlined text-[16px]">stars</span>
                  Subscribe for ₹{activePlan.price.toLocaleString("en-IN")}
                </button>
              </div>
            </div>
          )}

          <div className="mt-5 text-center">
            <p className="text-[11px] text-purple-200/50">
              Any changes saved here immediately update the StayQ host subscription screen on all devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
