"use client";

import React, { useState } from "react";
import axios from "axios";

export default function PublicHostInvitePage() {
  const [submitted, setSubmitted] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [hostName, setHostName] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("Villas");
  const [expectedPrice, setExpectedPrice] = useState<number>(12000);
  const [maxGuests, setMaxGuests] = useState<number>(6);
  const [bedrooms, setBedrooms] = useState<number>(3);
  const [photoUrl, setPhotoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "High-Speed Wi-Fi",
    "Air Conditioning",
    "Private Parking",
  ]);

  const amenitiesList = [
    "High-Speed Wi-Fi",
    "Air Conditioning",
    "Private Pool",
    "Ocean / Beach View",
    "Mountain View",
    "Solar / Off-grid Power",
    "4x4 Camper Setup",
    "Bonfire & BBQ Pit",
    "Chef on Demand",
    "Wood Fireplace",
    "Private Parking",
    "Pet Friendly",
    "Hot Tub / Jacuzzi",
    "Terrace Balcony",
    "Dedicated Workspace",
  ];

  const handleToggleAmenity = (name: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const generatedRef = `SQ-HOST-${Math.floor(100000 + Math.random() * 900000)}`;
    setRefCode(generatedRef);

    const payload = {
      hostName,
      propertyName,
      city: state ? `${city}, ${state}` : city,
      instagramHandle: instagramHandle.startsWith("@") ? instagramHandle : `@${instagramHandle}`,
      phone,
      email,
      channel: "INVITE_LINK",
      status: "FORM_SUBMITTED",
      expectedPrice: Number(expectedPrice),
      notes: `Category: ${category}. Guests: ${maxGuests}, Bedrooms: ${bedrooms}. Amenities: ${selectedAmenities.join(", ")}. Photos: ${photoUrl}. Notes: ${notes}`,
    };

    try {
      await axios.post("/api/v1/host-leads", payload, {
        headers: { 'x-admin-key': 'stayq-admin-secret-2026' }
      });
    } catch {
      try {
        const raw = localStorage.getItem("stayq_admin_host_leads");
        const existing = raw ? JSON.parse(raw) : [];
        localStorage.setItem(
          "stayq_admin_host_leads",
          JSON.stringify([{ ...payload, id: `lead-${Date.now()}`, createdAt: new Date().toISOString() }, ...existing])
        );
      } catch {
        // Fallback handled
      }
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (submitted) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 max-w-xl w-full p-8 md:p-12 rounded-3xl shadow-xl text-center flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-[42px]">check_circle</span>
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-violet-600">
            Application Received
          </span>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Welcome to Stay Q, {hostName}!
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed max-w-md">
            We have received details for <strong>{propertyName}</strong> ({city}). Our host onboarding team will review your property photos and reach out on WhatsApp at <strong>{phone}</strong> within 24 hours.
          </p>

          <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 my-3 w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Host Application Reference
            </span>
            <strong className="font-mono text-xl text-violet-700 font-bold">{refCode}</strong>
          </div>

          <p className="text-xs text-slate-500">
            QUATALYST PRIVATE LIMITED (CIN: U62011GA2026PTC018230) · Grievances: grievance@stayq.space
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 py-10 px-4 flex flex-col items-center">
      <div className="max-w-3xl w-full flex flex-col gap-8">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 font-bold text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-[16px]">hotel_class</span>
            Stay Q Host Partner Program
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Partner with Stay Q &amp; List Your Property
          </h1>

          <p className="text-sm md:text-base text-slate-600 max-w-xl">
            Join India&apos;s curated network of luxury villas, RVs &amp; campervans, off-grid campsites, and boutique stays.
          </p>

          {/* 3 Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-4 text-left">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <span className="material-symbols-outlined text-emerald-600 text-2xl mb-1">payments</span>
              <strong className="text-sm font-bold text-slate-900">Direct Settlements</strong>
              <span className="text-xs text-slate-500 mt-0.5">Automated bank payouts on check-in day.</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <span className="material-symbols-outlined text-violet-600 text-2xl mb-1">verified_user</span>
              <strong className="text-sm font-bold text-slate-900">Verified Guests</strong>
              <span className="text-xs text-slate-500 mt-0.5">Government ID &amp; KYC verified travelers.</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <span className="material-symbols-outlined text-blue-600 text-2xl mb-1">trending_up</span>
              <strong className="text-sm font-bold text-slate-900">Dedicated Support</strong>
              <span className="text-xs text-slate-500 mt-0.5">24/7 dedicated partner assistance desk.</span>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200 shadow-xl flex flex-col gap-6"
        >
          {/* Section 1: Host Contact */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-600">person</span>
              1. Host &amp; Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Full Name *</label>
                <input
                  type="text"
                  required
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="e.g. Vikram Malhotra"
                  className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-violet-600"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 uppercase">WhatsApp Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 font-mono focus:outline-violet-600"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Instagram Handle / Profile *</label>
                <input
                  type="text"
                  required
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="@villa_stayq or profile link"
                  className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-violet-600"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="host@property.com"
                  className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-violet-600"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          {/* Section 2: Property Specs */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-600">domain</span>
              2. Property Specifications
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Property / Stay Name *</label>
                <input
                  type="text"
                  required
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="e.g. The Heritage Glass Villa & Private Pool"
                  className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-violet-600"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-violet-600 font-medium"
                >
                  <option value="Villas">Luxury Villa</option>
                  <option value="Cabins">Mountain Cabin</option>
                  <option value="RVs">Campervan / RV</option>
                  <option value="Camping">Campsite / Glamping Dome</option>
                  <option value="Beachfront">Beachfront Stay</option>
                  <option value="Treehouses">Rainforest Treehouse</option>
                  <option value="Zero Broker">Zero Broker Long Stay / Flat</option>
                  <option value="Mansions">Heritage Mansion / Haveli</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 uppercase">City / Location *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Goa, Manali, Ladakh, Kasol"
                  className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-violet-600"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Expected Nightly Rate (₹) *</label>
                <input
                  type="number"
                  required
                  value={expectedPrice}
                  onChange={(e) => setExpectedPrice(Number(e.target.value))}
                  className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 font-mono font-bold focus:outline-violet-600"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Max Guests Capacity</label>
                <input
                  type="number"
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(Number(e.target.value))}
                  className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 font-bold focus:outline-violet-600"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          {/* Section 3: Amenities */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-600">spa</span>
              3. Amenities Included
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {amenitiesList.map((item) => {
                const isChecked = selectedAmenities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleToggleAmenity(item)}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-medium border flex items-center justify-between transition-all ${
                      isChecked
                        ? "bg-violet-100 border-violet-600 text-violet-800 font-bold shadow-sm"
                        : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>{item}</span>
                    {isChecked && <span className="material-symbols-outlined text-[16px]">check</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          {/* Section 4: Photo Link & Notes */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-600">photo_camera</span>
              4. Photos &amp; Notes
            </h2>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 uppercase">
                  Property Photos / Google Drive / Instagram Post Link
                </label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Paste link to photos, Google Drive folder, or Instagram post"
                  className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-violet-600"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Additional Notes or Special Highlights</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell us about the property architecture, 4x4 camper capabilities, telescope stargazing..."
                  className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-violet-600"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-violet-600 text-white font-bold text-base shadow-lg hover:bg-violet-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
            <span>{submitting ? "Submitting Application..." : "Submit Property Listing Application"}</span>
          </button>
        </form>

        <footer className="text-center text-xs text-slate-500 py-4">
          QUATALYST PRIVATE LIMITED (CIN: U62011GA2026PTC018230) · Grievance Officer: Shayan Mandal · grievance@stayq.space
        </footer>
      </div>
    </div>
  );
}
