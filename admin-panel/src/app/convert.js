const fs = require('fs');
const path = require('path');

const screens = [
    { name: 'business_reports', out: 'reports/page.tsx', endpoint: '/api/v1/admin/reports' },
    { name: 'revenue_management', out: 'revenue/page.tsx', endpoint: '/api/v1/admin/revenue' },
    { name: 'multi_currency_hub', out: 'currency/page.tsx', endpoint: '/api/v1/admin/currencies' },
    { name: 'tax_compliance', out: 'taxes/page.tsx', endpoint: '/api/v1/admin/taxes' }
];

const baseSrc = 'D:/Stay Q/stitch_export/stitch_stay_q_command_center';
const baseDest = 'd:/Stay Q/admin-panel/src/app';

screens.forEach(s => {
    let html = fs.readFileSync(path.join(baseSrc, s.name, 'code.html'), 'utf-8');
    
    // Extract main and everything after it (like modals) but before </body>
    const mainStart = html.indexOf('<main');
    const bodyEnd = html.indexOf('</body>');
    let content = html.slice(mainStart, bodyEnd);
    
    // Remove header
    content = content.replace(/<header[\s\S]*?<\/header>/i, '');
    
    // Convert to JSX
    content = content.replace(/class=/g, 'className=');
    content = content.replace(/onclick=/g, 'onClick=');
    content = content.replace(/for=/g, 'htmlFor=');
    content = content.replace(/checked=\"\"/g, 'defaultChecked');
    content = content.replace(/disabled=\"\"/g, 'disabled');
    
    // Self-close tags
    content = content.replace(/<input([^>]*[^\/])>/g, '<input$1 />');
    content = content.replace(/<img([^>]*[^\/])>/g, '<img$1 />');
    content = content.replace(/<hr([^>]*[^\/])>/g, '<hr$1 />');
    content = content.replace(/<br([^>]*[^\/])>/g, '<br$1 />');
    
    // specific styles
    content = content.replace(/style=\"([^\"]*)\"/g, (match, p1) => {
        let styleObj = {};
        p1.split(';').forEach(rule => {
            let parts = rule.split(':');
            if (parts.length > 1) {
                let key = parts[0].trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
                let val = parts[1].trim();
                styleObj[key] = val.replace(/'/g, "");
            }
        });
        return `style={${JSON.stringify(styleObj)}}`;
    });
    
    // Fix viewBox, stroke-width, stroke-linecap, stroke-dasharray, stroke-dashoffset, preserveAspectRatio, linearGradient
    content = content.replace(/viewbox/g, 'viewBox');
    content = content.replace(/stroke-width/g, 'strokeWidth');
    content = content.replace(/stroke-linecap/g, 'strokeLinecap');
    content = content.replace(/stroke-dasharray/g, 'strokeDasharray');
    content = content.replace(/stroke-dashoffset/g, 'strokeDashoffset');
    content = content.replace(/preserveaspectratio/g, 'preserveAspectRatio');
    content = content.replace(/lineargradient/g, 'linearGradient');

    // Fix raw JS in onClick (just mock it)
    content = content.replace(/onClick=\"[^\"]*\"/g, 'onClick={() => {}}');
    
    // Fix <!-- --> comments (remove them)
    content = content.replace(/<!--[\s\S]*?-->/g, '');

    const jsx = `"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Page() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('${s.endpoint}')
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
            {/* You can use {data?.something || 'Fallback'} to render API data */}
            ${content}
        </>
    );
}
`;

    const destDir = path.join(baseDest, path.dirname(s.out));
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(path.join(baseDest, s.out), jsx);
});
console.log('Done!');
