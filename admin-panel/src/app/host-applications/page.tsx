"use client";
import { useState, useEffect } from "react";
import Toast from "@/components/Toast";

interface HostApplication {
  userId: string;
  displayName: string;
  email: string;
  phone?: string;
  photoUrl: string | null;
  payoutAccount?: {
    id?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    upiId?: string;
    govIdType?: string;
    govIdNumber?: string;
    govIdDocUrl?: string;
    passbookImageUrl?: string;
    verified?: boolean;
  };
  property: {
    id: string;
    title: string;
    pricePerNight: string;
    city: string;
    state?: string;
    address?: string;
    country?: string;
    status: string;
    description?: string;
    type?: string;
    category?: string;
    bedrooms?: number;
    bathrooms?: number;
    maxGuests?: number;
    amenities?: string[];
    // Legal & Property Docs
    ownershipType?: string;
    isInsideGatedSociety?: boolean;
    electricityBillDocUrl?: string;
    propertyRegistryDocUrl?: string;
    leaseAgreementDocUrl?: string;
    landlordNocDocUrl?: string;
    societyNocDocUrl?: string;
    tradeLicenseDocUrl?: string;
    ownerIdProofDocUrl?: string;
    selfieFaceProofDocUrl?: string;
    images?: { id?: string; url: string; caption?: string }[];
  };
}

export default function HostApplicationsPage() {
  const [applications, setApplications] = useState<HostApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<HostApplication | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const getAdminHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("stayq_admin_token") : null;
    return {
      'Content-Type': 'application/json',
      'x-admin-key': 'stayq-admin-secret-2026',
      'Authorization': `Bearer ${token || 'stayq-admin-secret-2026'}`,
    };
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/moderation/host-applications", {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(Array.isArray(data) ? data : []);
      } else {
        setApplications([]);
      }
    } catch (e) {
      console.error("Error fetching host applications:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      const res = await fetch(`/api/v1/admin/moderation/host-applications/${userId}/approve`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setToastMessage("Host and listing approved successfully! Property is now ACTIVE.");
        setToastType("success");
        setApplications(prev => prev.filter(app => app.userId !== userId));
      } else {
        const errJson = await res.json().catch(() => null);
        setToastMessage(errJson?.message || "Failed to approve host.");
        setToastType("error");
      }
    } catch (error: any) {
      setToastMessage(error?.message || "Failed to approve host.");
      setToastType("error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    setProcessingId(userId);
    try {
      const res = await fetch(`/api/v1/admin/moderation/host-applications/${userId}/reject`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setToastMessage("Host application rejected.");
        setToastType("info");
        setApplications(prev => prev.filter(app => app.userId !== userId));
      } else {
        const errJson = await res.json().catch(() => null);
        setToastMessage(errJson?.message || "Failed to reject host.");
        setToastType("error");
      }
    } catch (error: any) {
      setToastMessage(error?.message || "Failed to reject host.");
      setToastType("error");
    } finally {
      setProcessingId(null);
    }
  };

  const openPreview = (url?: string | null, title?: string) => {
    if (!url) return;
    setPreviewImageUrl(url);
    setPreviewTitle(title || "Document Preview");
  };

  return (
    <div className="flex flex-col gap-lg h-full pb-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">Host Applications & KYC</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Review first-time host identity, government KYC, ownership deeds, and listing photos.</p>
        </div>
        <button
          onClick={fetchApplications}
          className="flex items-center gap-xs px-md py-xs rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm transition-all"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Refresh
        </button>
      </div>

      <div className="bg-surface-container-lowest/80 backdrop-blur-3xl rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm flex-1 flex flex-col">
        {loading ? (
          <div className="p-xl text-center text-on-surface-variant flex flex-col items-center justify-center gap-sm">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>Loading applications...</span>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-xl text-center text-on-surface-variant flex flex-col items-center justify-center min-h-[300px]">
            <span className="material-symbols-outlined text-5xl mb-sm block opacity-40 text-primary">verified_user</span>
            <h3 className="font-bold text-lg text-on-surface">No Pending Host Applications</h3>
            <p className="text-sm text-on-surface-variant mt-1">All new host onboardings and property listings have been reviewed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md p-md">
            {applications.map((app) => {
              const prop = app.property;
              const payout = app.payoutAccount;
              const hasDocs = prop?.electricityBillDocUrl || prop?.propertyRegistryDocUrl || prop?.leaseAgreementDocUrl || prop?.landlordNocDocUrl || prop?.societyNocDocUrl || prop?.tradeLicenseDocUrl || prop?.ownerIdProofDocUrl || prop?.selfieFaceProofDocUrl || payout?.govIdDocUrl || payout?.passbookImageUrl;
              const photoCount = prop?.images?.length || 0;

              return (
                <div key={app.userId} className="bg-surface-container/50 rounded-2xl border border-outline-variant/20 p-md flex flex-col gap-md hover:border-primary/40 transition-all shadow-sm">
                  {/* Host Info */}
                  <div className="flex items-center gap-sm">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20">
                      {app.displayName ? app.displayName.charAt(0).toUpperCase() : <span className="material-symbols-outlined">person</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-xs">
                        <h3 className="font-bold text-on-surface truncate">{app.displayName || payout?.accountHolderName || 'New Host Applicant'}</h3>
                        {payout?.verified && (
                          <span className="material-symbols-outlined text-emerald-500 text-sm" title="Bank Verified">check_circle</span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant truncate">{app.phone || 'No Phone'} • {app.email || 'No Email'}</p>
                    </div>
                  </div>

                  <div className="h-px bg-outline-variant/20 my-xs"></div>

                  {/* Property Info */}
                  <div>
                    <div className="flex items-center justify-between mb-xs">
                      <span className="text-[11px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-md">
                        {prop?.type || 'STAY'}
                      </span>
                      <span className="text-xs font-bold text-on-surface">₹{prop?.pricePerNight}/night</span>
                    </div>
                    <h4 className="font-bold text-on-surface line-clamp-1">{prop?.title || 'Untitled Listing'}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">📍 {prop?.city}, {prop?.state || prop?.country || 'India'}</p>
                  </div>

                  {/* Badges & Stats */}
                  <div className="flex flex-wrap gap-xs text-[11px]">
                    <span className="px-2 py-1 rounded-lg bg-surface-container-high text-on-surface-variant font-medium flex items-center gap-1">
                      📸 {photoCount} Photos
                    </span>
                    {hasDocs ? (
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold flex items-center gap-1">
                        📑 Docs Attached
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 font-bold flex items-center gap-1">
                        ⚠️ No Extra Docs
                      </span>
                    )}
                    {payout?.govIdNumber && (
                      <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 font-bold flex items-center gap-1">
                        🪪 {payout.govIdType || 'ID'}: {payout.govIdNumber.startsWith('enc:v1:') ? 'Verified (SecureID)' : payout.govIdNumber}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-sm flex flex-col gap-sm">
                    <button 
                      onClick={() => setSelectedApp(app)}
                      className="w-full py-2.5 rounded-xl text-primary bg-primary/10 hover:bg-primary/20 font-bold transition-colors text-sm flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                      Review Docs & Photos
                    </button>
                    <div className="flex gap-sm">
                      <button 
                        onClick={() => handleReject(app.userId)}
                        disabled={processingId === app.userId}
                        className="flex-1 py-2 rounded-xl text-error bg-error/10 hover:bg-error/20 font-bold text-xs transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleApprove(app.userId)}
                        disabled={processingId === app.userId}
                        className="flex-1 py-2 rounded-xl text-on-primary bg-primary hover:bg-primary/90 font-bold text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comprehensive Details & Documents Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-md">
          <div className="bg-surface-container-lowest rounded-3xl w-[95vw] max-w-[900px] max-h-[92vh] flex flex-col shadow-2xl border border-outline-variant/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-md px-lg border-b border-outline-variant/20 flex justify-between items-center bg-surface-container/50">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">shield_person</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg text-on-surface">Host Application Verification</h2>
                  <p className="text-xs text-on-surface-variant">Applicant: {selectedApp.displayName || selectedApp.payoutAccount?.accountHolderName || 'Host'} • {selectedApp.phone || selectedApp.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-on-surface/10 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-lg overflow-y-auto flex-1 flex flex-col gap-lg">
              {/* 1. Host Identity & Banking Summary */}
              <section>
                <h3 className="font-bold text-primary mb-sm uppercase text-xs tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">badge</span>
                  1. Host Identity & Bank Payout Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md bg-surface-container/40 border border-outline-variant/20 rounded-2xl p-md">
                  <div className="flex flex-col gap-xs text-xs">
                    <p><span className="text-on-surface-variant font-medium">Applicant Name:</span> <strong className="text-on-surface font-bold">{selectedApp.displayName || selectedApp.payoutAccount?.accountHolderName || 'N/A'}</strong></p>
                    <p><span className="text-on-surface-variant font-medium">Contact Phone:</span> <strong className="text-on-surface font-bold">{selectedApp.phone || 'N/A'}</strong></p>
                    <p><span className="text-on-surface-variant font-medium">Email Address:</span> <strong className="text-on-surface font-bold">{selectedApp.email || 'N/A'}</strong></p>
                    <p><span className="text-on-surface-variant font-medium">User ID:</span> <code className="text-[11px] bg-surface-container px-1 py-0.5 rounded">{selectedApp.userId}</code></p>
                  </div>
                  <div className="flex flex-col gap-xs text-xs border-t md:border-t-0 md:border-l border-outline-variant/20 md:pl-md">
                    <p><span className="text-on-surface-variant font-medium">Gov ID Type:</span> <strong className="text-on-surface font-bold uppercase">{selectedApp.payoutAccount?.govIdType || 'PAN / Aadhaar'}</strong></p>
                    <p><span className="text-on-surface-variant font-medium">Gov ID Number:</span> <strong className="text-on-surface font-bold text-primary">{selectedApp.payoutAccount?.govIdNumber || 'N/A'}</strong></p>
                    <p><span className="text-on-surface-variant font-medium">Payout UPI / Bank:</span> <strong className="text-on-surface font-bold">{selectedApp.payoutAccount?.upiId || `${selectedApp.payoutAccount?.bankName} - ${selectedApp.payoutAccount?.accountNumber}` || 'N/A'}</strong></p>
                    <p><span className="text-on-surface-variant font-medium">IFSC Code:</span> <strong className="text-on-surface font-bold">{selectedApp.payoutAccount?.ifscCode || 'N/A'}</strong></p>
                  </div>
                </div>
              </section>

              {/* 2. KYC & Payout Proof Documents */}
              <section>
                <h3 className="font-bold text-primary mb-sm uppercase text-xs tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  2. Host KYC & Bank Documents
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-md">
                  {/* Gov ID Card Document */}
                  <div className="bg-surface-container/40 border border-outline-variant/20 rounded-2xl p-sm flex flex-col items-center text-center gap-xs">
                    {selectedApp.payoutAccount?.govIdDocUrl ? (
                      <div 
                        onClick={() => openPreview(selectedApp.payoutAccount?.govIdDocUrl, "Government ID Document")}
                        className="cursor-pointer group relative w-full h-28 rounded-xl overflow-hidden bg-black/10 border border-outline-variant/20 flex items-center justify-center"
                      >
                        <img src={selectedApp.payoutAccount.govIdDocUrl} alt="Gov ID" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <span className="material-symbols-outlined text-xl">zoom_in</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-28 rounded-xl bg-surface-container flex flex-col items-center justify-center text-on-surface-variant opacity-40">
                        <span className="material-symbols-outlined text-2xl">credit_card</span>
                        <span className="text-[10px] mt-1 font-bold">Not Uploaded</span>
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-on-surface mt-1">Government ID</span>
                    <span className="text-[10px] text-on-surface-variant">{selectedApp.payoutAccount?.govIdType || 'PAN / Aadhaar'}</span>
                  </div>

                  {/* Bank Passbook / Cheque */}
                  <div className="bg-surface-container/40 border border-outline-variant/20 rounded-2xl p-sm flex flex-col items-center text-center gap-xs">
                    {selectedApp.payoutAccount?.passbookImageUrl ? (
                      <div 
                        onClick={() => openPreview(selectedApp.payoutAccount?.passbookImageUrl, "Bank Passbook / Cheque")}
                        className="cursor-pointer group relative w-full h-28 rounded-xl overflow-hidden bg-black/10 border border-outline-variant/20 flex items-center justify-center"
                      >
                        <img src={selectedApp.payoutAccount.passbookImageUrl} alt="Passbook" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <span className="material-symbols-outlined text-xl">zoom_in</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-28 rounded-xl bg-surface-container flex flex-col items-center justify-center text-on-surface-variant opacity-40">
                        <span className="material-symbols-outlined text-2xl">account_balance</span>
                        <span className="text-[10px] mt-1 font-bold">Not Uploaded</span>
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-on-surface mt-1">Bank Passbook</span>
                    <span className="text-[10px] text-on-surface-variant">Payout Proof</span>
                  </div>

                  {/* Selfie Face Proof */}
                  <div className="bg-surface-container/40 border border-outline-variant/20 rounded-2xl p-sm flex flex-col items-center text-center gap-xs">
                    {selectedApp.property?.selfieFaceProofDocUrl ? (
                      <div 
                        onClick={() => openPreview(selectedApp.property.selfieFaceProofDocUrl, "Host Live Selfie Proof")}
                        className="cursor-pointer group relative w-full h-28 rounded-xl overflow-hidden bg-black/10 border border-outline-variant/20 flex items-center justify-center"
                      >
                        <img src={selectedApp.property.selfieFaceProofDocUrl} alt="Selfie" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <span className="material-symbols-outlined text-xl">zoom_in</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-28 rounded-xl bg-surface-container flex flex-col items-center justify-center text-on-surface-variant opacity-40">
                        <span className="material-symbols-outlined text-2xl">face</span>
                        <span className="text-[10px] mt-1 font-bold">Not Uploaded</span>
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-on-surface mt-1">Live Selfie Proof</span>
                    <span className="text-[10px] text-on-surface-variant">Liveness Check</span>
                  </div>

                  {/* Owner ID Proof */}
                  <div className="bg-surface-container/40 border border-outline-variant/20 rounded-2xl p-sm flex flex-col items-center text-center gap-xs">
                    {selectedApp.property?.ownerIdProofDocUrl ? (
                      <div 
                        onClick={() => openPreview(selectedApp.property.ownerIdProofDocUrl, "Property Owner ID Proof")}
                        className="cursor-pointer group relative w-full h-28 rounded-xl overflow-hidden bg-black/10 border border-outline-variant/20 flex items-center justify-center"
                      >
                        <img src={selectedApp.property.ownerIdProofDocUrl} alt="Owner ID" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <span className="material-symbols-outlined text-xl">zoom_in</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-28 rounded-xl bg-surface-container flex flex-col items-center justify-center text-on-surface-variant opacity-40">
                        <span className="material-symbols-outlined text-2xl">fingerprint</span>
                        <span className="text-[10px] mt-1 font-bold">Not Uploaded</span>
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-on-surface mt-1">Owner ID Proof</span>
                    <span className="text-[10px] text-on-surface-variant">Legal Identity</span>
                  </div>
                </div>
              </section>

              {/* 3. Property Legal & Ownership Documents (Ghar ke Kagaj) */}
              <section>
                <h3 className="font-bold text-primary mb-sm uppercase text-xs tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">home_work</span>
                  3. Property Ownership & Legal Deeds (Ghar ke Kagaj)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-md">
                  {/* Electricity Bill */}
                  <div className="bg-surface-container/40 border border-outline-variant/20 rounded-2xl p-sm flex flex-col items-center text-center gap-xs">
                    {selectedApp.property?.electricityBillDocUrl ? (
                      <div 
                        onClick={() => openPreview(selectedApp.property.electricityBillDocUrl, "Electricity Bill Proof")}
                        className="cursor-pointer group relative w-full h-28 rounded-xl overflow-hidden bg-black/10 border border-outline-variant/20 flex items-center justify-center"
                      >
                        <img src={selectedApp.property.electricityBillDocUrl} alt="Electricity Bill" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <span className="material-symbols-outlined text-xl">zoom_in</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-28 rounded-xl bg-surface-container flex flex-col items-center justify-center text-on-surface-variant opacity-40">
                        <span className="material-symbols-outlined text-2xl">bolt</span>
                        <span className="text-[10px] mt-1 font-bold">Not Uploaded</span>
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-on-surface mt-1">Electricity Bill</span>
                    <span className="text-[10px] text-on-surface-variant">Address & Meter Proof</span>
                  </div>

                  {/* Property Registry / Sale Deed */}
                  <div className="bg-surface-container/40 border border-outline-variant/20 rounded-2xl p-sm flex flex-col items-center text-center gap-xs">
                    {selectedApp.property?.propertyRegistryDocUrl ? (
                      <div 
                        onClick={() => openPreview(selectedApp.property.propertyRegistryDocUrl, "Property Registry / Sale Deed")}
                        className="cursor-pointer group relative w-full h-28 rounded-xl overflow-hidden bg-black/10 border border-outline-variant/20 flex items-center justify-center"
                      >
                        <img src={selectedApp.property.propertyRegistryDocUrl} alt="Registry" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <span className="material-symbols-outlined text-xl">zoom_in</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-28 rounded-xl bg-surface-container flex flex-col items-center justify-center text-on-surface-variant opacity-40">
                        <span className="material-symbols-outlined text-2xl">description</span>
                        <span className="text-[10px] mt-1 font-bold">Not Uploaded</span>
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-on-surface mt-1">Property Registry</span>
                    <span className="text-[10px] text-on-surface-variant">Sale Deed / Khatiyan</span>
                  </div>

                  {/* Lease / Sublet Agreement */}
                  <div className="bg-surface-container/40 border border-outline-variant/20 rounded-2xl p-sm flex flex-col items-center text-center gap-xs">
                    {selectedApp.property?.leaseAgreementDocUrl ? (
                      <div 
                        onClick={() => openPreview(selectedApp.property.leaseAgreementDocUrl, "Lease / Sublet Agreement")}
                        className="cursor-pointer group relative w-full h-28 rounded-xl overflow-hidden bg-black/10 border border-outline-variant/20 flex items-center justify-center"
                      >
                        <img src={selectedApp.property.leaseAgreementDocUrl} alt="Lease" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <span className="material-symbols-outlined text-xl">zoom_in</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-28 rounded-xl bg-surface-container flex flex-col items-center justify-center text-on-surface-variant opacity-40">
                        <span className="material-symbols-outlined text-2xl">contract</span>
                        <span className="text-[10px] mt-1 font-bold">Not Uploaded</span>
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-on-surface mt-1">Lease Agreement</span>
                    <span className="text-[10px] text-on-surface-variant">Sublet Authorization</span>
                  </div>

                  {/* Landlord NOC */}
                  <div className="bg-surface-container/40 border border-outline-variant/20 rounded-2xl p-sm flex flex-col items-center text-center gap-xs">
                    {selectedApp.property?.landlordNocDocUrl ? (
                      <div 
                        onClick={() => openPreview(selectedApp.property.landlordNocDocUrl, "Landlord NOC Letter")}
                        className="cursor-pointer group relative w-full h-28 rounded-xl overflow-hidden bg-black/10 border border-outline-variant/20 flex items-center justify-center"
                      >
                        <img src={selectedApp.property.landlordNocDocUrl} alt="Landlord NOC" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <span className="material-symbols-outlined text-xl">zoom_in</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-28 rounded-xl bg-surface-container flex flex-col items-center justify-center text-on-surface-variant opacity-40">
                        <span className="material-symbols-outlined text-2xl">assignment_turned_in</span>
                        <span className="text-[10px] mt-1 font-bold">Not Uploaded</span>
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-on-surface mt-1">Landlord NOC</span>
                    <span className="text-[10px] text-on-surface-variant">Hosting Consent</span>
                  </div>

                  {/* Society / RWA NOC */}
                  <div className="bg-surface-container/40 border border-outline-variant/20 rounded-2xl p-sm flex flex-col items-center text-center gap-xs">
                    {selectedApp.property?.societyNocDocUrl ? (
                      <div 
                        onClick={() => openPreview(selectedApp.property.societyNocDocUrl, "Society / RWA NOC Letter")}
                        className="cursor-pointer group relative w-full h-28 rounded-xl overflow-hidden bg-black/10 border border-outline-variant/20 flex items-center justify-center"
                      >
                        <img src={selectedApp.property.societyNocDocUrl} alt="Society NOC" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <span className="material-symbols-outlined text-xl">zoom_in</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-28 rounded-xl bg-surface-container flex flex-col items-center justify-center text-on-surface-variant opacity-40">
                        <span className="material-symbols-outlined text-2xl">apartment</span>
                        <span className="text-[10px] mt-1 font-bold">Not Uploaded</span>
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-on-surface mt-1">Society / RWA NOC</span>
                    <span className="text-[10px] text-on-surface-variant">Gate Permission</span>
                  </div>

                  {/* Trade License */}
                  <div className="bg-surface-container/40 border border-outline-variant/20 rounded-2xl p-sm flex flex-col items-center text-center gap-xs">
                    {selectedApp.property?.tradeLicenseDocUrl ? (
                      <div 
                        onClick={() => openPreview(selectedApp.property.tradeLicenseDocUrl, "Trade License / Homestay Permit")}
                        className="cursor-pointer group relative w-full h-28 rounded-xl overflow-hidden bg-black/10 border border-outline-variant/20 flex items-center justify-center"
                      >
                        <img src={selectedApp.property.tradeLicenseDocUrl} alt="Trade License" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <span className="material-symbols-outlined text-xl">zoom_in</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-28 rounded-xl bg-surface-container flex flex-col items-center justify-center text-on-surface-variant opacity-40">
                        <span className="material-symbols-outlined text-2xl">store</span>
                        <span className="text-[10px] mt-1 font-bold">Not Uploaded</span>
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-on-surface mt-1">Trade License</span>
                    <span className="text-[10px] text-on-surface-variant">Homestay Permit</span>
                  </div>
                </div>
              </section>

              {/* 4. Property Details & Photos */}
              <section>
                <h3 className="font-bold text-primary mb-sm uppercase text-xs tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">photo_library</span>
                  4. Listing Information & Categorized Photos
                </h3>
                <div className="bg-surface-container/40 border border-outline-variant/20 rounded-2xl p-md flex flex-col gap-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-xs text-xs">
                    <p><span className="text-on-surface-variant font-medium">Title:</span> <strong className="text-on-surface block font-bold">{selectedApp.property?.title}</strong></p>
                    <p><span className="text-on-surface-variant font-medium">Category / Type:</span> <strong className="text-on-surface block font-bold">{selectedApp.property?.type} • {selectedApp.property?.category}</strong></p>
                    <p><span className="text-on-surface-variant font-medium">Location:</span> <strong className="text-on-surface block font-bold">{selectedApp.property?.address || `${selectedApp.property?.city}, ${selectedApp.property?.state}`}</strong></p>
                    <p><span className="text-on-surface-variant font-medium">Price per Night:</span> <strong className="text-on-surface block font-bold text-emerald-600">₹{selectedApp.property?.pricePerNight}</strong></p>
                  </div>

                  {selectedApp.property?.description && (
                    <div className="text-xs bg-surface-container p-sm rounded-xl">
                      <span className="text-on-surface-variant font-bold block mb-0.5">Description:</span>
                      <p className="text-on-surface leading-relaxed">{selectedApp.property.description}</p>
                    </div>
                  )}

                  {/* Photos Grid */}
                  <div>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">
                      Uploaded Property Photos ({selectedApp.property?.images?.length || 0})
                    </span>
                    {selectedApp.property?.images && selectedApp.property.images.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-xs">
                        {selectedApp.property.images.map((img, i) => (
                          <div 
                            key={i} 
                            onClick={() => openPreview(img.url, `Photo ${i + 1}: ${img.caption || 'Property'}`)}
                            className="cursor-pointer group relative aspect-square rounded-xl overflow-hidden bg-black/10 border border-outline-variant/20"
                          >
                            <img src={img.url} alt="Property" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            {img.caption && (
                              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate text-center font-bold">
                                {img.caption}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-on-surface-variant italic">No photos uploaded for this property.</p>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Actions */}
            <div className="p-md px-lg border-t border-outline-variant/20 flex justify-between items-center bg-surface-container/30">
              <span className="text-xs text-on-surface-variant">
                Approving will make this host <strong className="text-on-surface">Verified</strong> and activate the listing immediately.
              </span>
              <div className="flex gap-sm">
                <button 
                  onClick={() => { handleReject(selectedApp.userId); setSelectedApp(null); }}
                  className="px-lg py-2.5 rounded-xl text-error hover:bg-error/10 font-bold text-sm transition-colors"
                >
                  Reject Application
                </button>
                <button 
                  onClick={() => { handleApprove(selectedApp.userId); setSelectedApp(null); }}
                  className="px-lg py-2.5 rounded-xl text-on-primary bg-primary hover:bg-primary/90 font-bold text-sm transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Approve Both & Activate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {previewImageUrl && (
        <div 
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-md animate-in fade-in duration-150"
        >
          <div className="relative max-w-[90vw] max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex justify-between items-center text-white mb-2 px-1">
              <span className="font-bold text-sm">{previewTitle}</span>
              <button onClick={() => setPreviewImageUrl(null)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <img 
              src={previewImageUrl} 
              alt="Preview" 
              className="max-w-full max-h-[75vh] object-contain rounded-2xl border border-white/20 shadow-2xl" 
            />
            <a 
              href={previewImageUrl} 
              target="_blank" 
              rel="noreferrer"
              className="mt-3 px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">open_in_new</span>
              Open Full Resolution
            </a>
          </div>
        </div>
      )}

      {toastMessage && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setToastMessage("")} 
        />
      )}
    </div>
  );
}
