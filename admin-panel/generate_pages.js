const fs = require('fs');
const path = require('path');

const tasks = [
    { src: 'qube_ai_hub', dest: 'qube/page.tsx', endpoint: '/api/v1/admin/qube' },
    { src: 'access_management', dest: 'access/page.tsx', endpoint: '/api/v1/admin/access' },
    { src: 'system_audit_logs', dest: 'audit/page.tsx', endpoint: '/api/v1/admin/audit' },
    { src: 'bulk_operations', dest: 'bulk/page.tsx', endpoint: '/api/v1/admin/bulk' },
    { src: 'security_settings', dest: 'security/page.tsx', endpoint: '/api/v1/admin/security' },
    { src: 'api_management', dest: 'api-keys/page.tsx', endpoint: '/api/v1/admin/api-keys' }
];

const baseSrc = 'D:/Stay Q/stitch_export/stitch_stay_q_command_center';
const baseDest = 'd:/Stay Q/admin-panel/src/app';

tasks.forEach(task => {
    const srcHtmlPath = path.join(baseSrc, task.src, 'code.html');
    let html = '<div>Placeholder</div>';
    if (fs.existsSync(srcHtmlPath)) {
        const fullHtml = fs.readFileSync(srcHtmlPath, 'utf8');
        const mainMatch = fullHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
        if (mainMatch) {
            html = '<main className="flex-1 p-6">' + mainMatch[1] + '</main>';
        } else {
            html = '<div className="p-6">' + fullHtml.substring(0, 5000) + '</div>'; // fallback
        }
    }
    
    // Quick html to jsx cleanup - dangerouslySetInnerHTML takes pure HTML! We don't need JSX format.
    // Actually, React dangerouslySetInnerHTML works with pure HTML.
    
    // Instead of using dangerouslySetInnerHTML which might be messy, I will just dump it.
    // Wait, to be safe from React hydration or random syntax errors, dangerouslySetInnerHTML is safer.
    
    const componentCode = `"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ${task.src.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Page() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('${task.endpoint}');
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
                    <div dangerouslySetInnerHTML={{ __html: \`${'`' + '${JSON.stringify(html).slice(1, -1)}' + '`'}\` }} />
                )}
            </div>
            {/* Safe navigation */}
            {data?.items && <div className="hidden">{data.items.length}</div>}
        </div>
    );
}
`;

    const destPath = path.join(baseDest, task.dest);
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(destPath, componentCode, 'utf8');
    console.log('Wrote', destPath);
});
