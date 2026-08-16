"use client";
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

export default function CatalogTaxonomyPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCatalog = () => {
    setLoading(true);
    axios.get('/api/admin/catalog/categories')
      .then(res => setData(res.data))
      .catch(err => console.error("Error fetching catalog:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const filteredItems = useMemo(() => {
    return (data?.items || []).filter((cat: any) => (cat.name || "").toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);

  const confirmDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
        alert("Deleted " + id);
    }
  };

  return (
    <div className="p-gutter md:p-margin max-w-[1440px] mx-auto w-full flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-margin gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface md:font-display-lg font-headline-lg-mobile">Catalog Taxonomy</h2>
        </div>
        <div className="flex gap-sm">
          <button onClick={() => alert('New Category')} className="px-lg py-3 bg-primary text-on-primary rounded-xl font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center">
            <span className="material-symbols-outlined mr-2 text-[18px]" data-icon="add">add</span>
            New Category
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <div className="md:col-span-3 bg-surface-container-lowest p-lg rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-surface-container">
          <div className="flex justify-between items-start mb-md">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Categories</p>
          </div>
          <div>
            <p className="font-display-lg text-display-lg text-on-surface">{loading ? '-' : data?.totalCategories ?? '-'}</p>
          </div>
        </div>

        <div className="md:col-span-3 bg-surface-container-lowest p-lg rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-surface-container">
          <div className="flex justify-between items-start mb-md">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Global Amenities</p>
          </div>
          <div>
            <p className="font-display-lg text-display-lg text-on-surface">{loading ? '-' : data?.totalAmenities ?? '-'}</p>
          </div>
        </div>

        <div className="md:col-span-3 bg-surface-container-lowest p-lg rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-surface-container">
          <div className="flex justify-between items-start mb-md">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Needs Review</p>
          </div>
          <div>
            <p className="font-display-lg text-display-lg text-on-surface">{loading ? '-' : data?.needsReview ?? '-'}</p>
          </div>
        </div>

        <div className="md:col-span-3 bg-primary text-on-primary p-lg rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <p className="font-headline-md text-headline-md mb-2">Taxonomy Sync</p>
            {data?.lastSynced && <p className="font-body-md text-body-md opacity-80 mb-4">Last synced {data.lastSynced}</p>}
          </div>
          <button onClick={() => { alert('Syncing...'); fetchCatalog(); }} className="relative z-10 w-full py-2 bg-on-primary text-primary font-label-md text-label-md rounded-lg hover:bg-primary-fixed-dim transition-colors">
            Force Sync Now
          </button>
        </div>

        {/* Main Table Section */}
        <div className="md:col-span-12 bg-surface-container-lowest rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-surface-container overflow-hidden flex flex-col">
          <div className="p-lg border-b border-surface-container flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-bright">
            <h3 className="font-headline-md text-headline-md text-on-surface">Property Categories</h3>
            <div className="flex gap-sm w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-body-md font-body-md transition-all h-[40px]" placeholder="Filter categories..." type="text" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-container text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                  <th className="px-lg py-3 font-semibold">Category Name</th>
                  <th className="px-lg py-3 font-semibold hidden sm:table-cell">Slug</th>
                  <th className="px-lg py-3 font-semibold text-center">Status</th>
                  <th className="px-lg py-3 font-semibold hidden md:table-cell text-right">Properties</th>
                  <th className="px-lg py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface divide-y divide-surface-container">
                {loading ? (
                    Array.from({length: 3}).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                            <td className="px-lg py-3"><div className="w-24 h-4 bg-surface-variant rounded"></div></td>
                            <td className="px-lg py-3 hidden sm:table-cell"><div className="w-24 h-4 bg-surface-variant rounded"></div></td>
                            <td className="px-lg py-3 text-center"><div className="w-16 h-4 bg-surface-variant rounded mx-auto"></div></td>
                            <td className="px-lg py-3 hidden md:table-cell text-right"><div className="w-8 h-4 bg-surface-variant rounded float-right"></div></td>
                            <td className="px-lg py-3 text-right"><div className="w-16 h-4 bg-surface-variant rounded float-right"></div></td>
                        </tr>
                    ))
                ) : filteredItems.length > 0 ? (
                    filteredItems.map((cat: any, idx: number) => (
                      <tr key={idx} className="hover:bg-surface-container-low transition-colors group h-[56px]">
                        <td className="px-lg py-3 font-medium text-primary">{cat.name ?? "-"}</td>
                        <td className="px-lg py-3 hidden sm:table-cell text-outline font-data-mono text-data-mono">{cat.slug ?? "-"}</td>
                        <td className="px-lg py-3 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container">
                            {cat.status ?? "-"}
                          </span>
                        </td>
                        <td className="px-lg py-3 hidden md:table-cell text-right font-data-mono text-data-mono">{cat.count ?? "-"}</td>
                        <td className="px-lg py-3 text-right">
                          <button onClick={() => alert('Edit ' + cat.id)} className="p-1 text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                            <span className="material-symbols-outlined text-[20px]" data-icon="edit">edit</span>
                          </button>
                          <button onClick={() => confirmDelete(cat.id)} className="p-1 text-on-surface-variant hover:text-tertiary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 ml-1">
                            <span className="material-symbols-outlined text-[20px]" data-icon="delete">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                ) : (
                    <tr><td colSpan={5} className="p-xl text-center text-on-surface-variant">No categories found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
