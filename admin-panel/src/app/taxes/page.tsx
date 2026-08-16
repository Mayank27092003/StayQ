"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';

import Toast from '@/components/Toast';

export default function TaxesAndCompliance() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [regionFilter, setRegionFilter] = useState("All Regions");
    const [viewMode, setViewMode] = useState<"list" | "map">("list");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [toast, setToast] = useState<{message: string, type: 'success'|'error'|'info'} | null>(null);

    useEffect(() => {
        axios.get('/api/v1/admin/taxes')
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const regions = (data?.regions || []).filter((r: any) => regionFilter === "All Regions" || r?.region === regionFilter || r?.name === regionFilter);
    const pendingDocs = data?.pendingDocs || data?.docs || [];

    const exportCSV = () => {
        if (regions.length === 0) return;
        const headers = ["Region", "Rate", "Status", "Last Updated"];
        const rows = regions.map((r: any) => [
            `"${(r.name || r.region || "").replace(/"/g, '""')}"`,
            r.taxRate || r.rate || 0,
            r.status || "Active",
            new Date().toLocaleDateString()
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `stayq_taxes_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreateModalOpen(false);
        setToast({message: "Tax Rule created successfully!", type: 'success'});
    };

    return (
        <main className="flex-1 flex flex-col min-w-0 relative">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-surface rounded-3xl p-xl shadow-2xl w-[400px] max-w-[90vw] animate-in zoom-in-95 duration-200">
                        <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">New Tax Rule</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-lg">Configure tax parameters for a region.</p>
                        <form onSubmit={submitCreate} className="flex flex-col gap-md">
                            <input type="text" required placeholder="Region Name" className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                            <input type="number" required placeholder="Tax Rate (%)" className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                            <div className="flex justify-end gap-sm mt-md">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-lg py-sm rounded-full font-label-md text-label-md text-on-surface-variant hover:bg-surface-container transition-colors">Cancel</button>
                                <button type="submit" className="px-lg py-sm rounded-full bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container shadow-sm transition-colors">Save Rule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <div className="p-gutter max-w-[1440px] mx-auto w-full flex-1 space-y-gutter">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h1 className="font-display-lg text-display-lg text-on-surface">Tax &amp; Compliance</h1>
                        <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">Manage regional tax rules and monitor host compliance status.</p>
                    </div>
                    <div className="mt-md md:mt-0 flex space-x-md">
                        <button onClick={exportCSV} className="px-md py-sm border border-outline/30 rounded-full text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.03)]">Export Data</button>
                        <button onClick={() => setIsCreateModalOpen(true)} className="px-md py-sm bg-primary text-on-primary rounded-full font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center space-x-xs"><span className="material-symbols-outlined text-[18px]">add</span><span>New Tax Rule</span></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
                    <div className="col-span-1 md:col-span-3 bg-surface-container-lowest rounded-xl p-lg shadow-sm border border-surface-container flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-sm">
                                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Overall Compliance</span>
                                <span className="material-symbols-outlined text-secondary">verified_user</span>
                            </div>
                            <div className="font-display-lg text-display-lg text-on-surface">{data?.overallCompliance ?? "-"}</div>
                            <div className="flex items-center mt-xs text-secondary font-label-md text-label-md">
                                <span className="material-symbols-outlined text-[16px] mr-base">trending_up</span> {data?.complianceTrend ?? "-"}
                            </div>
                        </div>
                        <div className="mt-lg w-full h-2 bg-surface-container rounded-full overflow-hidden">
                            <div className="h-full bg-secondary rounded-full" style={{ width: data?.overallCompliance || '0%' }}></div>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-3 bg-error-container rounded-xl p-lg shadow-sm border border-tertiary-fixed-dim flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-sm">
                                <span className="font-label-md text-label-md text-on-error-container uppercase tracking-wider">Action Required</span>
                                <span className="material-symbols-outlined text-error">warning</span>
                            </div>
                            <div className="font-display-lg text-display-lg text-on-error-container">{data?.actionRequired ?? "-"}</div>
                            <div className="mt-xs text-on-error-container font-body-md text-body-md">
                                Hosts out of compliance
                            </div>
                        </div>
                        <button onClick={() => setToast({message: "Alerts reviewed", type: 'success'})} className="mt-lg w-full py-sm bg-error text-on-error rounded-full font-label-md text-label-md hover:bg-error/90 transition-colors shadow-sm">Review Alerts</button>
                    </div>

                    <div className="col-span-1 md:col-span-6 bg-surface-container-lowest rounded-xl p-lg shadow-sm border border-surface-container relative overflow-hidden group hover:-translate-y-[1px] transition-transform duration-300">
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">YTD Tax Collected</span>
                                    <div className="font-display-lg text-display-lg text-on-surface mt-xs">{data?.ytdTax ?? "-"}</div>
                                </div>
                                <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="bg-surface border border-outline-variant text-on-surface text-label-md font-label-md rounded-md py-xs px-sm focus:ring-primary focus:border-primary">
                                    <option>All Regions</option>
                                    <option>North America</option>
                                    <option>Europe</option>
                                    <option>Asia</option>
                                </select>
                            </div>
                            <div className="mt-lg h-[120px] w-full flex items-end space-x-sm pt-md">
                                {(data?.chartData || [40, 65, 50, 80, 75, 100]).map((h: number, i: number) => (
                                    <div key={i} className={`w-1/6 rounded-t-sm transition-colors relative ${i === 5 ? 'bg-primary h-full' : 'bg-surface-container-high group-hover:bg-primary-container/50'}`} style={{ height: `${h}%` }}>
                                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">Q{i+1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-8 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden flex flex-col">
                        <div className="p-md border-b border-surface-container flex justify-between items-center bg-surface">
                            <h2 className="font-headline-md text-headline-md text-on-surface">Regional Compliance Status</h2>
                            <div className="flex space-x-xs">
                                <button className={`p-xs rounded ${viewMode === 'list' ? 'bg-surface-container-high text-on-surface' : 'text-on-surface-variant hover:bg-surface-container-high'}`} onClick={() => setViewMode('list')}><span className="material-symbols-outlined text-[20px]">list</span></button>
                                <button className={`p-xs rounded ${viewMode === 'map' ? 'bg-surface-container-high text-on-surface' : 'text-on-surface-variant hover:bg-surface-container-high'}`} onClick={() => setViewMode('map')}><span className="material-symbols-outlined text-[20px]">map</span></button>
                            </div>
                        </div>
                        <div className="overflow-x-auto flex-1">
{viewMode === 'list' ? (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-bright border-b border-surface-container">
                                        <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase">Region</th>
                                        <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase">Active Hosts</th>
                                        <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase">Compliance Rate</th>
                                        <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase">Status</th>
                                        <th className="p-md"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-container font-data-mono text-data-mono text-on-surface">
                                    {loading ? (
                                        Array.from({length: 4}).map((_, i) => (
                                            <tr key={i} className="animate-pulse h-[56px]">
                                                <td className="p-md"><div className="h-4 bg-surface-variant rounded w-32"></div></td>
                                                <td className="p-md"><div className="h-4 bg-surface-variant rounded w-12"></div></td>
                                                <td className="p-md"><div className="h-4 bg-surface-variant rounded w-24"></div></td>
                                                <td className="p-md"><div className="h-4 bg-surface-variant rounded w-16"></div></td>
                                                <td className="p-md text-right"><div className="h-4 bg-surface-variant rounded w-12 ml-auto"></div></td>
                                            </tr>
                                        ))
                                    ) : regions.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">No regions found.</td></tr>
                                    ) : regions.map((region: any, i: number) => (
                                        <tr key={i} className="hover:bg-surface-container-low transition-colors h-[56px]">
                                            <td className="p-md flex items-center space-x-sm">
                                                <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-on-surface-variant"><span className="material-symbols-outlined text-[18px]">public</span></div>
                                                <span className="font-semibold font-body-md">{(region.name || region.region) ?? "-"}</span>
                                            </td>
                                            <td className="p-md">{region.hosts ?? "-"}</td>
                                            <td className="p-md">
                                                <div className="flex items-center space-x-sm">
                                                    <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden"><div className={`h-full ${region.rate && parseInt(region.rate) < 70 ? 'bg-error' : 'bg-secondary'}`} style={{width: region.rate || '0%'}}></div></div>
                                                    <span>{region.rate ?? "-"}</span>
                                                </div>
                                            </td>
                                            <td className="p-md"><span className={`px-xs py-0.5 rounded-sm font-label-md text-[11px] uppercase ${region.status?.toLowerCase() === 'review req.' || region.status?.toLowerCase() === 'action required' ? 'bg-error-container text-error' : 'bg-secondary-container/30 text-secondary'}`}>{region.status ?? "-"}</span></td>
                                            <td className="p-md text-right"><button onClick={() => setToast({message: "Manage " + (region.name || region.region), type: 'info'})} className="text-primary hover:underline font-label-md text-label-md">Manage</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
) : (
    <div className="p-6 h-[300px] flex items-center justify-center bg-surface-container-lowest">
        <div className="w-full h-full border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center text-on-surface-variant gap-4 bg-surface-container-low/30">
            <span className="material-symbols-outlined text-4xl opacity-50">public</span>
            <div className="text-center">
                <p className="font-headline-sm text-headline-sm text-on-surface">Interactive Map View</p>
                <p className="font-body-md text-body-md mt-1">Select a region from the map to see tax compliance details.</p>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 w-1/2">
                <div className="h-16 bg-surface-container rounded-lg flex items-center justify-center hover:bg-primary-container/20 hover:border hover:border-primary cursor-pointer transition-colors text-on-surface font-label-md">NA</div>
                <div className="h-16 bg-surface-container rounded-lg flex items-center justify-center hover:bg-primary-container/20 hover:border hover:border-primary cursor-pointer transition-colors text-on-surface font-label-md">EU</div>
                <div className="h-16 bg-surface-container rounded-lg flex items-center justify-center hover:bg-primary-container/20 hover:border hover:border-primary cursor-pointer transition-colors text-on-surface font-label-md">AS</div>
            </div>
        </div>
    </div>
)}
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-4 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container flex flex-col">
                        <div className="p-md border-b border-surface-container flex justify-between items-center bg-surface">
                            <h2 className="font-headline-md text-headline-md text-on-surface">Doc Verification</h2>
                            <span className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full font-label-md text-[11px]">{pendingDocs.length} Pending</span>
                        </div>
                        <div className="p-md flex-1 overflow-y-auto space-y-md">
                            {loading ? (
                                Array.from({length: 2}).map((_, i) => (
                                    <div key={i} className="animate-pulse border border-outline-variant rounded-lg p-sm flex flex-col bg-surface h-24">
                                        <div className="h-4 bg-surface-variant rounded w-1/2 mb-2"></div>
                                        <div className="h-3 bg-surface-variant rounded w-3/4 mb-auto"></div>
                                        <div className="h-6 bg-surface-variant rounded w-full mt-2"></div>
                                    </div>
                                ))
                            ) : pendingDocs.length === 0 ? (
                                <div className="text-center text-on-surface-variant p-4">No pending docs.</div>
                            ) : pendingDocs.map((doc: any, i: number) => (
                                <div key={i} className="border border-outline-variant rounded-lg p-sm flex flex-col bg-surface hover:border-primary transition-colors cursor-pointer group">
                                    <div className="flex justify-between items-start mb-xs">
                                        <div className="flex items-center space-x-xs">
                                            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">{doc.icon || 'description'}</span>
                                            <span className="font-label-md text-label-md text-on-surface">{doc.title ?? "-"}</span>
                                        </div>
                                        <span className={doc.flagged ? "text-error font-label-md text-[11px]" : "text-on-surface-variant font-label-md text-[11px]"}>{(doc.time || doc.status) ?? "-"}</span>
                                    </div>
                                    <div className="text-body-md font-body-md text-on-surface-variant mb-sm">Host: {doc.host ?? "-"}</div>
                                    <div className="flex space-x-xs mt-auto">
                                        <button onClick={() => setToast({message: "Viewing " + doc.title, type: 'info'})} className="flex-1 py-xs border border-outline/30 rounded-full text-primary font-label-md text-label-md hover:bg-surface-container transition-colors">View</button>
                                        {!doc.flagged && <button onClick={() => setToast({message: "Verifying " + doc.title, type: 'success'})} className="flex-1 py-xs bg-primary text-on-primary rounded-full font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors">Verify</button>}
                                    </div>
                                </div>
                            ))}

                            <div className="mt-md pt-sm border-t border-surface-container border-dashed">
                                <button onClick={() => setToast({message: "Upload dialog opening...", type: 'info'})} className="w-full py-sm border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant font-label-md text-label-md hover:border-primary hover:text-primary hover:bg-primary-container/5 transition-all flex items-center justify-center space-x-xs">
                                    <span className="material-symbols-outlined text-[18px]">upload</span>
                                    <span>Bulk Upload Docs</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
