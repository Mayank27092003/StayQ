"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function QubeAiHubPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/v1/admin/qube');
                setData(response.data);
            } catch (err: any) {
                setError(err.message || 'An error occurred');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <div className="flex-1 overflow-auto">
                {loading && <div className="p-4">Loading...</div>}
                {error && <div className="p-4 text-red-500">Error: {error}</div>}
                {!loading && !error && (
                    <div className="p-lg">
                        <h2 className="font-display-lg text-display-lg text-on-background">Qube AI Hub</h2>
                        <p className="mt-4">Page content coming soon.</p>
                    </div>
                )}
            </div>
            {/* Safe navigation */}
            {data?.items && <div className="hidden">{data.items.length}</div>}
        </div>
    );
}
