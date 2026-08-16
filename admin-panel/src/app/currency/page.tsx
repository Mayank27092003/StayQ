"use client";
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

export default function Page() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        axios.get('/api/v1/admin/currencies')
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const filteredRates = useMemo(() => {
        return (data?.rates || []).filter((rate: any) => (rate.code || "").toLowerCase().includes(search.toLowerCase()) || (rate.name || "").toLowerCase().includes(search.toLowerCase()));
    }, [data, search]);

    return (
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <div className="flex-1 overflow-y-auto p-gutter bg-background">
                <div className="max-w-[1440px] mx-auto space-y-gutter">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-md">
                        <div>
                            <h1 className="font-display-lg text-display-lg text-on-surface">Multi-Currency Hub</h1>
                        </div>
                        <div className="flex gap-sm">
                            <button onClick={() => alert('Add Currency')} className="px-md py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-surface-tint transition-colors shadow-sm flex items-center gap-xs">
                                <span className="material-symbols-outlined text-[18px]">add</span> Add Currency
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-gutter">
                        <div className="col-span-12 md:col-span-4 bg-surface rounded-xl p-lg border border-outline-variant/30 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Base Currency</span>
                                    <div className="mt-2 flex items-baseline gap-xs">
                                        <span className="font-display-lg text-display-lg text-on-surface">{loading ? "-" : data?.baseCurrencyCode ?? "-"}</span>
                                        <span className="font-body-md text-body-md text-on-surface-variant">{loading ? "-" : data?.baseCurrencyName ?? "-"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-lg pt-sm border-t border-outline-variant/50 flex justify-between items-center">
                                {data?.lastSynced && <span className="font-label-md text-label-md text-on-surface-variant">Last synced: {data.lastSynced}</span>}
                            </div>
                        </div>

                        <div className="col-span-12 md:col-span-4 bg-surface rounded-xl p-lg border border-outline-variant/30 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Active Markets</span>
                                    <div className="mt-2 flex items-baseline gap-xs">
                                        <span className="font-display-lg text-display-lg text-on-surface">{loading ? "-" : data?.activeMarkets ?? "-"}</span>
                                        <span className="font-body-md text-body-md text-on-surface-variant">Supported</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-12 md:col-span-4 bg-gradient-to-br from-primary to-surface-tint rounded-xl p-lg shadow-md text-on-primary flex flex-col justify-between">
                            <div className="relative z-10">
                                <h3 className="font-headline-md text-headline-md font-bold mb-xs">Conversion Markup</h3>
                                <div className="mt-md flex items-center gap-sm">
                                    <span className="font-display-lg text-display-lg font-bold">{loading ? "-" : data?.markup ?? "-"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-12 bg-surface rounded-xl border border-outline-variant/30 overflow-hidden">
                            <div className="p-md border-b border-outline-variant/50 flex justify-between items-center bg-surface-container-lowest">
                                <h2 className="font-headline-md text-headline-md text-on-surface">Exchange Rates</h2>
                                <div className="flex items-center gap-sm">
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                                        <input value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-3 py-1.5 bg-surface border border-outline-variant rounded-md font-body-md text-body-md text-sm w-48 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" placeholder="Filter..." type="text"/>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-surface-container-low/50">
                                            <th className="px-md py-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold border-b border-outline-variant/50">Currency</th>
                                            <th className="px-md py-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold border-b border-outline-variant/50">Rate</th>
                                            <th className="px-md py-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold border-b border-outline-variant/50 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-body-md text-body-md">
                                        {loading ? (
                                            Array.from({length: 3}).map((_, idx) => (
                                                <tr key={idx} className="animate-pulse h-[56px]">
                                                    <td className="px-md py-2"><div className="w-24 h-4 bg-surface-variant rounded"></div></td>
                                                    <td className="px-md py-2"><div className="w-16 h-4 bg-surface-variant rounded"></div></td>
                                                    <td className="px-md py-2"><div className="w-8 h-4 bg-surface-variant rounded float-right"></div></td>
                                                </tr>
                                            ))
                                        ) : filteredRates.length > 0 ? (
                                            filteredRates.map((rate: any, idx: number) => (
                                                <tr key={idx} className="border-b border-outline-variant/30 hover:bg-surface-container-lowest transition-colors h-[56px]">
                                                    <td className="px-md py-2">
                                                        <div className="flex items-center gap-sm">
                                                            <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center font-data-mono text-data-mono font-bold text-on-surface">{rate.code ?? "-"}</div>
                                                            <div>
                                                                <div className="font-semibold text-on-surface">{rate.name ?? "-"}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-md py-2 font-data-mono text-data-mono">{rate.value ?? "-"}</td>
                                                    <td className="px-md py-2 text-right">
                                                        <button onClick={() => alert('Edit ' + rate.code)} className="p-1 text-on-surface-variant hover:text-primary transition-colors">
                                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={3} className="p-xl text-center text-on-surface-variant">No rates found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
