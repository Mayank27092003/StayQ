"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';

import Toast from '@/components/Toast';

export default function Page() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showSchedulesModal, setShowSchedulesModal] = useState(false);
    const [showAllTemplates, setShowAllTemplates] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeRegions, setActiveRegions] = useState(['North America', 'EMEA']);
    const [showRegionDropdown, setShowRegionDropdown] = useState(false);
    const [toast, setToast] = useState<{message: string, type: 'success'|'error'|'info'} | null>(null);

    useEffect(() => {
        axios.get('/api/v1/admin/reports')
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {/* You can use {data?.something || 'Fallback'} to render API data */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">



<div className="flex-1 overflow-y-auto p-gutter scrollbar-hide">
<div className="max-w-[1440px] mx-auto space-y-xl pb-2xl">

<div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
<div>
<h2 className="font-display-lg text-display-lg text-on-surface mb-xs">Reports Center</h2>
<p className="font-body-lg text-body-lg text-on-surface-variant">Generate, schedule, and manage executive reporting for Stay Q operations.</p>
</div>
<div className="flex gap-md">
<button className="px-lg py-2.5 bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-sm" onClick={() => setShowFilters(true)}>
<span className="material-symbols-outlined text-[18px]">tune</span>
                            Filters
                        </button>
<button className="px-lg py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-sm" onClick={() => setShowModal(true)}>
<span className="material-symbols-outlined text-[18px]">add_chart</span>
                            New Report
                        </button>
</div>
</div>

<div className="grid grid-cols-12 gap-gutter">

<section className="col-span-12 lg:col-span-8 flex flex-col gap-md">
<div className="flex justify-between items-center mb-xs">
<h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-sm">
<span className="material-symbols-outlined text-primary">view_cozy</span>
                                Recommended Templates
                            </h3>
<button className="text-primary font-label-md text-label-md hover:underline" onClick={() => setShowAllTemplates(!showAllTemplates)}>{showAllTemplates ? 'View Less' : 'View All Templates'}</button>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-md">
{loading ? (
    Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="glass-card rounded-xl p-md h-[180px] animate-pulse bg-surface-container-lowest border border-outline-variant/50"></div>
    ))
) : (data?.templates || []).length > 0 ? (
    (data?.templates || []).slice(0, showAllTemplates ? undefined : 3).map((tpl: any, i: number) => (
        <div key={i} className="glass-card rounded-xl p-md report-card cursor-pointer transition-all duration-300 flex flex-col h-full border border-outline-variant/50">
            <div className={`w-10 h-10 rounded-lg bg-surface-container-high text-${tpl.color || 'primary'} flex items-center justify-center mb-md border border-outline-variant/30`}>
                <span className="material-symbols-outlined">{tpl.icon || 'monitoring'}</span>
            </div>
            <h4 className="font-body-lg text-body-lg font-semibold text-on-surface mb-xs leading-tight">{tpl.name}</h4>
            <p className="font-body-md text-body-md text-on-surface-variant flex-1 text-sm line-clamp-2">{tpl.description}</p>
            <div className="mt-md pt-md border-t border-outline-variant/30 flex justify-between items-center">
                <span className="font-label-md text-label-md text-outline">{tpl.type || 'System Default'}</span>
                <button className={`text-${tpl.color || 'primary'} hover:text-${tpl.color || 'primary'}-container p-1 rounded-full hover:bg-surface-container-low transition-colors`} onClick={() => setShowModal(true)}>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
            </div>
        </div>
    ))
) : (
    <div className="col-span-3 text-center p-md text-on-surface-variant">No templates found.</div>
)}
</div>
</section>

<section className="col-span-12 lg:col-span-4 flex flex-col gap-md">
<div className="flex justify-between items-center mb-xs">
<h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-sm">
<span className="material-symbols-outlined text-outline">schedule</span>
                                Scheduled Runs
                            </h3>
</div>
<div className="glass-card rounded-xl flex-1 border border-outline-variant/50 overflow-hidden flex flex-col bg-surface-container-lowest">
<div className="flex-1 overflow-y-auto scrollbar-hide p-xs">
{loading ? (
    <div className="p-sm animate-pulse h-16 bg-surface-container-low rounded-lg mb-2"></div>
) : (data?.schedules || []).length > 0 ? (
    (data?.schedules || []).map((sch: any, i: number) => (
        <div key={i} className={`p-sm flex items-start gap-sm hover:bg-surface-container-low rounded-lg transition-colors group ${i > 0 ? 'border-t border-outline-variant/20' : ''} ${!sch.active ? 'opacity-60' : ''}`}>
            <div className="mt-1">
                <label className="relative inline-flex items-center cursor-pointer">
                    <input defaultChecked={sch.active} className="sr-only peer" type="checkbox" />
                    <div className="w-9 h-5 bg-outline-variant peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
            </div>
            <div className="flex-1 min-w-0">
                <p className={`font-data-mono text-data-mono text-on-surface truncate ${!sch.active ? 'line-through' : ''}`}>{sch.name}</p>
                <p className="font-label-md text-[11px] text-on-surface-variant mt-0.5">{sch.scheduleText}</p>
            </div>
            <button className="text-outline hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setShowSchedulesModal(true)}>
                <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>
        </div>
    ))
) : (
    <div className="text-center p-sm text-on-surface-variant text-sm">No scheduled runs.</div>
)}
</div>
<div className="p-sm border-t border-outline-variant/30 bg-surface-container-low">
<button className="w-full py-1.5 text-center text-primary font-label-md text-label-md hover:underline flex items-center justify-center gap-xs" onClick={() => setShowSchedulesModal(true)}>
<span className="material-symbols-outlined text-[16px]">add</span> Manage Schedules
                                </button>
</div>
</div>
</section>

<section className="col-span-12 mt-lg">
<div className="glass-card rounded-xl border border-outline-variant/50 bg-surface-container-lowest overflow-hidden">
<div className="p-md border-b border-outline-variant/30 flex justify-between items-center bg-surface/50">
<h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-sm">
<span className="material-symbols-outlined text-outline">history</span>
                                    Recent Generates
                                </h3>
<div className="flex gap-sm">
<div className="relative">
<span className="material-symbols-outlined absolute left-2.5 top-2 text-[18px] text-outline">search</span>
<input className="pl-8 pr-3 py-1.5 text-sm bg-surface-container-low border border-outline-variant rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Filter history..." type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
</div>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="border-b border-outline-variant/30 bg-surface-container-low/50">
<th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase w-1/3">Report Name</th>
<th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase w-1/6">Date Generated</th>
<th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase w-1/6">Status</th>
<th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase w-1/6">Generated By</th>
<th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase w-1/6 text-right">Actions</th>
</tr>
</thead>
<tbody className="font-body-md text-body-md">
{loading ? (
    <tr className="border-b border-outline-variant/20 h-[56px] animate-pulse">
        <td colSpan={5} className="py-2 px-4"><div className="h-6 bg-surface-container-high rounded w-full"></div></td>
    </tr>
) : (data?.recentRuns || data?.data || []).length > 0 ? (
    (data?.recentRuns || data?.data || []).filter((r: any) => !searchQuery || r.name?.toLowerCase().includes(searchQuery.toLowerCase())).map((run: any, i: number) => (
        <tr key={i} className="border-b border-outline-variant/20 table-row-hover transition-colors h-[56px]">
            <td className="py-2 px-4 font-data-mono text-on-surface flex items-center gap-sm h-full">
                <span className={`material-symbols-outlined text-[20px] ${run.status === 'Generating' ? 'text-outline animate-spin' : 'text-primary'}`}>{run.status === 'Generating' ? 'progress_activity' : (run.type === 'CSV' ? 'table' : 'picture_as_pdf')}</span>
                {run.name}
            </td>
            <td className="py-2 px-4 text-on-surface-variant">{run.date}</td>
            <td className="py-2 px-4">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${run.status === 'Generating' ? 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/50' : 'bg-secondary-container/20 text-secondary border border-secondary/20'}`}>
                    {run.status === 'Generating' ? <span className="material-symbols-outlined text-[12px] animate-spin">refresh</span> : <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>}
                    {run.status || 'Ready'}
                </span>
            </td>
            <td className="py-2 px-4 text-on-surface-variant">{run.createdBy || 'System'}</td>
            <td className="py-2 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    {run.status !== 'Generating' ? (
                        <>
                            <button className="p-1.5 text-outline hover:text-primary hover:bg-primary-container/10 rounded-md transition-colors tooltip-trigger" title="Download" onClick={() => setToast({message: 'Downloading report...', type: 'info'})}>
                                <span className="material-symbols-outlined text-[20px]">download</span>
                            </button>
                            <button className="p-1.5 text-outline hover:text-primary hover:bg-primary-container/10 rounded-md transition-colors tooltip-trigger" title="View Details" onClick={() => setToast({message: 'Opening report details...', type: 'info'})}>
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                        </>
                    ) : (
                        <button className="p-1.5 text-outline hover:text-error hover:bg-error-container/20 rounded-md transition-colors tooltip-trigger" title="Cancel" onClick={() => setToast({message: 'Report generation canceled.', type: 'error'})}>
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    )}
                </div>
            </td>
        </tr>
    ))
) : (
    <tr><td colSpan={5} className="text-center py-4 text-on-surface-variant">No recent history found.</td></tr>
)}
</tbody>
</table>
</div>
<div className="p-sm border-t border-outline-variant/30 flex justify-between items-center bg-surface/30">
<span className="font-label-md text-label-md text-on-surface-variant">Showing {((currentPage - 1) * 3) + 1}-{Math.min(currentPage * 3, 142)} of 142</span>
<div className="flex gap-1">
<button className="p-1 rounded bg-surface-container border border-outline-variant/50 text-outline disabled:opacity-50" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
<button className="p-1 rounded bg-surface-container-lowest border border-outline-variant/50 hover:bg-surface-container text-on-surface" onClick={() => setCurrentPage(p => p + 1)}><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
</div>
</div>
</div>
</section>
</div>
</div>
</div>
</main>

<div className="fixed inset-0 z-[100]" id="generateModal" style={{ display: showModal ? "block" : "none" }}>

<div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>

<div className="absolute inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-surface-container-lowest md:rounded-2xl shadow-2xl flex flex-col w-full h-full md:h-auto md:max-h-[870px] md:w-[600px] border border-outline-variant overflow-hidden">

<div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface">
<h2 className="font-headline-md text-headline-md text-on-surface">Generate Custom Report</h2>
<button className="text-on-surface-variant hover:text-error hover:bg-error-container/20 p-1.5 rounded-full transition-colors" onClick={() => setShowModal(false)}>
<span className="material-symbols-outlined">close</span>
</button>
</div>

<div className="flex-1 overflow-y-auto p-lg space-y-xl bg-surface-container-lowest">

<div className="space-y-sm">
<label className="font-label-md text-label-md text-on-surface-variant block">1. Select Data Source / Template</label>
<div className="grid grid-cols-2 gap-sm">
<div className="border-2 border-primary bg-primary-container/5 rounded-lg p-sm cursor-pointer relative">
<span className="material-symbols-outlined absolute top-2 right-2 text-primary text-[18px]">check_circle</span>
<span className="material-symbols-outlined text-primary mb-1">payments</span>
<div className="font-body-md text-body-md font-semibold text-on-surface">Financial Metrics</div>
</div>
<div className="border border-outline-variant hover:border-primary/50 rounded-lg p-sm cursor-pointer transition-colors">
<span className="material-symbols-outlined text-outline mb-1">group</span>
<div className="font-body-md text-body-md font-semibold text-on-surface">User/Host Activity</div>
</div>
</div>
</div>

<div className="space-y-sm">
<label className="font-label-md text-label-md text-on-surface-variant block">2. Configure Parameters</label>
<div className="space-y-md">
<div>
<label className="font-label-md text-[11px] text-outline mb-1 block">Date Range</label>
<select className="w-full bg-surface-container border border-outline-variant rounded-md py-2 px-3 text-body-md font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none">
<option>Last 30 Days</option>
<option>Year to Date</option>
<option>Previous Quarter</option>
<option>Custom Range...</option>
</select>
</div>
<div>
<label className="font-label-md text-[11px] text-outline mb-1 block">Regions to Include</label>
<div className="flex flex-wrap gap-2 items-center">
{activeRegions.map(region => (
<span key={region} className="inline-flex items-center gap-1 bg-surface-container-high px-2 py-1 rounded text-sm text-on-surface border border-outline-variant/50">
                                    {region} <button className="hover:text-error" onClick={() => setActiveRegions(r => r.filter(x => x !== region))}><span className="material-symbols-outlined text-[14px]">close</span></button>
</span>
))}
<div className="relative">
<button className="inline-flex items-center gap-1 bg-surface border border-dashed border-outline-variant px-2 py-1 rounded text-sm text-primary hover:bg-surface-container-low transition-colors" onClick={() => setShowRegionDropdown(!showRegionDropdown)}>
<span className="material-symbols-outlined text-[14px]">add</span> Add Region
                                </button>
{showRegionDropdown && (
    <div className="absolute top-full mt-1 left-0 bg-surface border border-outline-variant rounded-md shadow-lg z-10 w-32">
        {['APAC', 'LATAM'].filter(r => !activeRegions.includes(r)).map(region => (
            <button key={region} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-surface-container-low text-on-surface" onClick={() => { setActiveRegions([...activeRegions, region]); setShowRegionDropdown(false); }}>
                {region}
            </button>
        ))}
    </div>
)}
</div>
</div>
</div>
</div>
</div>

<div className="space-y-sm">
<label className="font-label-md text-label-md text-on-surface-variant block">3. Output Format</label>
<div className="flex gap-md">
<label className="flex items-center gap-2 cursor-pointer">
<input defaultChecked className="text-primary focus:ring-primary h-4 w-4 border-outline-variant" name="format" type="radio"/>
<span className="font-body-md text-body-md">PDF Presentation</span>
</label>
<label className="flex items-center gap-2 cursor-pointer">
<input className="text-primary focus:ring-primary h-4 w-4 border-outline-variant" name="format" type="radio"/>
<span className="font-body-md text-body-md">Raw CSV Extract</span>
</label>
</div>
</div>
</div>

<div className="px-lg py-md border-t border-outline-variant bg-surface flex justify-end gap-sm">
<button className="px-md py-2 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors" onClick={() => setShowModal(false)}>
                    Cancel
                </button>
<button className="px-md py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2" onClick={() => { setToast({message: 'Report generation started!', type: 'success'}); setShowModal(false); }}>
                    Run Report Now <span className="material-symbols-outlined text-[18px]">play_arrow</span>
</button>
</div>
</div>
</div>


            {/* Filters Drawer */}
            {showFilters && (
                <>
                    <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[40]" onClick={() => setShowFilters(false)}></div>
                    <div className="fixed inset-y-0 right-0 w-80 z-50 shadow-xl bg-surface border-l border-outline-variant flex flex-col transform transition-transform translate-x-0">
                        <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center">
                            <h2 className="font-headline-md text-headline-md text-on-surface">Filters</h2>
                            <button className="text-on-surface-variant hover:text-error p-1.5 rounded-full" onClick={() => setShowFilters(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 p-lg space-y-md overflow-y-auto">
                            <div>
                                <label className="font-label-md text-sm text-outline mb-1 block">Date Range</label>
                                <select className="w-full bg-surface-container border border-outline-variant rounded-md py-2 px-3 text-body-md">
                                    <option>Last 7 Days</option>
                                    <option>Last 30 Days</option>
                                    <option>This Quarter</option>
                                </select>
                            </div>
                            <div>
                                <label className="font-label-md text-sm text-outline mb-1 block">Department</label>
                                <select className="w-full bg-surface-container border border-outline-variant rounded-md py-2 px-3 text-body-md">
                                    <option>All Departments</option>
                                    <option>Finance</option>
                                    <option>Operations</option>
                                    <option>Support</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-md border-t border-outline-variant flex gap-sm">
                            <button className="flex-1 py-2 border border-outline-variant rounded-lg font-label-md hover:bg-surface-container-low" onClick={() => setShowFilters(false)}>Clear</button>
                            <button className="flex-1 py-2 bg-primary text-on-primary rounded-lg font-label-md hover:bg-primary/90" onClick={() => setShowFilters(false)}>Apply</button>
                        </div>
                    </div>
                </>
            )}

            {/* Schedules Modal */}
            {showSchedulesModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setShowSchedulesModal(false)}></div>
                    <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl flex flex-col w-full max-w-lg border border-outline-variant overflow-hidden">
                        <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface">
                            <h2 className="font-headline-md text-headline-md text-on-surface">Manage Schedules</h2>
                            <button className="text-on-surface-variant hover:text-error p-1.5 rounded-full" onClick={() => setShowSchedulesModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-md bg-surface-container-lowest">
                            <div className="space-y-sm">
                                {[
                                    { name: "Daily Revenue Sync", schedule: "Every day at 00:00" },
                                    { name: "Weekly Ops Summary", schedule: "Every Monday at 09:00" }
                                ].map((sch, i) => (
                                    <div key={i} className="flex items-center justify-between p-sm border border-outline-variant/50 rounded-lg hover:bg-surface-container-low">
                                        <div>
                                            <p className="font-data-mono text-on-surface">{sch.name}</p>
                                            <p className="text-xs text-on-surface-variant">{sch.schedule}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="text-outline hover:text-primary"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                                            <button className="text-outline hover:text-error"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="px-lg py-md border-t border-outline-variant bg-surface flex justify-end gap-sm">
                            <button className="px-md py-2 bg-primary text-on-primary rounded-lg font-label-md" onClick={() => setShowSchedulesModal(false)}>Done</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
