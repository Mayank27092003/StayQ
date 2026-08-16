"use client";
import { useState, useEffect } from "react";
import Toast from "@/components/Toast";

interface HostApplication {
  userId: string;
  displayName: string;
  email: string;
  photoUrl: string | null;
  payoutAccount?: {
    govIdType: string;
    govIdNumber: string;
    govIdDocUrl: string;
    passbookImageUrl: string;
  };
  property: {
    id: string;
    title: string;
    pricePerNight: string;
    city: string;
    status: string;
    description?: string;
    type?: string;
    category?: string;
    address?: string;
    state?: string;
    images?: { url: string }[];
  }
}

export default function HostApplicationsPage() {
  const [applications, setApplications] = useState<HostApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // Fetch from the actual endpoint served by the backend
      const res = await fetch("/api/v1/admin/moderation/test-host-applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      } else {
        setApplications([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      // API call to POST /api/v1/admin/moderation/test-host-applications/:id/approve
      await fetch(`/api/v1/admin/moderation/test-host-applications/${userId}/approve`, { method: "POST" });
      setToastMessage(`Host approved successfully.`);
      setToastType("success");
      setApplications(prev => prev.filter(app => app.userId !== userId));
    } catch (error) {
      setToastMessage("Failed to approve host.");
      setToastType("error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    setProcessingId(userId);
    try {
      // API call to POST /api/v1/admin/moderation/test-host-applications/:id/reject
      await fetch(`/api/v1/admin/moderation/test-host-applications/${userId}/reject`, { method: "POST" });
      setToastMessage(`Host application rejected.`);
      setToastType("info");
      setApplications(prev => prev.filter(app => app.userId !== userId));
    } catch (error) {
      setToastMessage("Failed to reject host.");
      setToastType("error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-lg h-full pb-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">Host Applications</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Review first-time hosts and their initial property listings.</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest/80 backdrop-blur-3xl rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm flex-1 flex flex-col">
        {loading ? (
          <div className="p-xl text-center text-on-surface-variant">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="p-xl text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-sm block opacity-50">inbox</span>
            No pending host applications.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md p-md">
            {applications.map((app) => (
              <div key={app.userId} className="bg-surface-container/50 rounded-2xl border border-outline-variant/20 p-md flex flex-col gap-md">
                {/* Host Info */}
                <div className="flex items-center gap-sm">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">person</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface">{app.displayName || 'Unknown User'}</h3>
                    <p className="text-sm text-on-surface-variant">{app.email}</p>
                  </div>
                </div>

                <div className="h-px bg-outline-variant/20 my-xs"></div>

                {/* Property Info */}
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-xs">First Listing</p>
                  <h4 className="font-bold text-on-surface line-clamp-1">{app.property?.title || 'Untitled Property'}</h4>
                  <p className="text-sm text-on-surface-variant">{app.property?.city} • ₹{app.property?.pricePerNight}/night</p>
                </div>

                <div className="mt-auto pt-sm flex flex-col gap-sm">
                  <button 
                    onClick={() => setSelectedApp(app)}
                    className="w-full py-sm rounded-xl text-primary bg-primary/10 hover:bg-primary/20 font-bold transition-colors"
                  >
                    View Full Details
                  </button>
                  <div className="flex gap-sm">
                    <button 
                      onClick={() => handleReject(app.userId)}
                      disabled={processingId === app.userId}
                      className="flex-1 py-sm rounded-xl text-error bg-error/10 hover:bg-error/20 font-bold transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleApprove(app.userId)}
                      disabled={processingId === app.userId}
                      className="flex-1 py-sm rounded-xl text-on-primary bg-primary hover:bg-primary/90 font-bold transition-colors shadow-sm disabled:opacity-50"
                    >
                      Approve Both
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-scrim/40 backdrop-blur-sm p-md">
          <div className="bg-surface-container-lowest rounded-3xl w-[90vw] max-w-[800px] max-h-[90vh] flex flex-col shadow-lg border border-outline-variant/30 overflow-hidden">
            <div className="p-lg border-b border-outline-variant/20 flex justify-between items-center bg-surface-container/50">
              <h2 className="font-headline-sm font-bold text-on-surface">Application Details</h2>
              <button onClick={() => setSelectedApp(null)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-on-surface/10 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-lg overflow-y-auto flex-1 flex flex-col gap-lg">
              {/* Host Summary & KYC */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <h3 className="font-bold text-primary mb-sm uppercase text-xs tracking-wider">Host Profile</h3>
                  <div className="bg-surface-container rounded-2xl p-md flex flex-col gap-xs h-full">
                    <p><span className="text-on-surface-variant">Name:</span> <strong>{selectedApp.displayName || selectedApp.payoutAccount?.accountHolderName || 'N/A'}</strong></p>
                    <p><span className="text-on-surface-variant">Email:</span> <strong>{selectedApp.email}</strong></p>
                    <p><span className="text-on-surface-variant">Phone:</span> <strong>{selectedApp.phone || 'N/A'}</strong></p>
                    {selectedApp.payoutAccount && (
                      <>
                        <div className="h-px bg-outline-variant/20 my-xs"></div>
                        <p><span className="text-on-surface-variant">Gov ID Type:</span> <strong className="uppercase">{selectedApp.payoutAccount.govIdType || 'N/A'}</strong></p>
                        <p><span className="text-on-surface-variant">Gov ID Number:</span> <strong>{selectedApp.payoutAccount.govIdNumber || 'N/A'}</strong></p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-primary mb-sm uppercase text-xs tracking-wider">KYC Documents</h3>
                  <div className="bg-surface-container rounded-2xl p-md flex gap-sm overflow-x-auto h-full items-center">
                    {selectedApp.payoutAccount?.govIdDocUrl ? (
                      <div className="shrink-0 flex flex-col items-center gap-xs">
                        <img src={selectedApp.payoutAccount.govIdDocUrl} alt="Gov ID" className="h-24 w-auto object-cover rounded-lg border border-outline-variant/20 shadow-sm" />
                        <span className="text-[10px] text-on-surface-variant uppercase font-bold">Gov ID</span>
                      </div>
                    ) : (
                      <p className="text-sm text-on-surface-variant italic">No Gov ID uploaded.</p>
                    )}
                    
                    {selectedApp.payoutAccount?.passbookImageUrl && (
                      <div className="shrink-0 flex flex-col items-center gap-xs">
                        <img src={selectedApp.payoutAccount.passbookImageUrl} alt="Passbook" className="h-24 w-auto object-cover rounded-lg border border-outline-variant/20 shadow-sm" />
                        <span className="text-[10px] text-on-surface-variant uppercase font-bold">Bank Passbook</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Property Summary & Photos */}
              <section className="grid grid-cols-1 gap-md">
                <div>
                  <h3 className="font-bold text-primary mb-sm uppercase text-xs tracking-wider">Property Details</h3>
                  <div className="bg-surface-container rounded-2xl p-md flex flex-col gap-xs">
                    <p><span className="text-on-surface-variant">Title:</span> <strong>{selectedApp.property?.title}</strong></p>
                    <p><span className="text-on-surface-variant">Location:</span> <strong>{selectedApp.property?.address}, {selectedApp.property?.city}, {selectedApp.property?.state}</strong></p>
                    <p><span className="text-on-surface-variant">Type:</span> <strong>{selectedApp.property?.type} - {selectedApp.property?.category}</strong></p>
                    <p><span className="text-on-surface-variant">Price:</span> <strong>₹{selectedApp.property?.pricePerNight} / night</strong></p>
                    <p><span className="text-on-surface-variant">Description:</span> {selectedApp.property?.description}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-primary mb-sm uppercase text-xs tracking-wider">Property Photos</h3>
                  <div className="bg-surface-container rounded-2xl p-md flex gap-sm overflow-x-auto">
                    {selectedApp.property?.images && selectedApp.property.images.length > 0 ? (
                      selectedApp.property.images.map((img: any, i: number) => (
                        <img key={i} src={img.url} alt="Property" className="h-32 w-48 object-cover rounded-xl border border-outline-variant/20 shadow-sm shrink-0" />
                      ))
                    ) : (
                      <p className="text-sm text-on-surface-variant italic">No photos uploaded for this property.</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Raw JSON for advanced review */}
              <section>
                <h3 className="font-bold text-primary mb-sm uppercase text-xs tracking-wider">Raw Payload</h3>
                <pre className="bg-surface-container rounded-2xl p-md text-xs text-on-surface-variant overflow-x-auto">
                  {JSON.stringify(selectedApp.property, null, 2)}
                </pre>
              </section>
            </div>

            <div className="p-md border-t border-outline-variant/20 flex justify-end gap-sm bg-surface-container/30">
              <button 
                onClick={() => { handleReject(selectedApp.userId); setSelectedApp(null); }}
                className="px-lg py-sm rounded-xl text-error hover:bg-error/10 font-bold transition-colors"
              >
                Reject Application
              </button>
              <button 
                onClick={() => { handleApprove(selectedApp.userId); setSelectedApp(null); }}
                className="px-lg py-sm rounded-xl text-on-primary bg-primary hover:bg-primary/90 font-bold transition-colors shadow-sm"
              >
                Approve Both
              </button>
            </div>
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
