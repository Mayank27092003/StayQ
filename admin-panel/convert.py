import os
from bs4 import BeautifulSoup
import re

def html_to_jsx(html):
    # Basic replacements
    jsx = html.replace('class="', 'className="')
    jsx = jsx.replace('for="', 'htmlFor="')
    
    # Close img and input tags
    jsx = re.sub(r'(<img[^>]*?)(?<!/)>', r'\1 />', jsx)
    jsx = re.sub(r'(<input[^>]*?)(?<!/)>', r'\1 />', jsx)
    jsx = re.sub(r'(<br[^>]*?)(?<!/)>', r'\1 />', jsx)
    jsx = re.sub(r'(<hr[^>]*?)(?<!/)>', r'\1 />', jsx)
    
    # Inline styles
    def style_replacer(match):
        style_str = match.group(1)
        # simplistic conversion for standard styles like "font-variation-settings: 'FILL' 1;"
        rules = style_str.split(';')
        react_styles = []
        for rule in rules:
            if not rule.strip(): continue
            parts = rule.split(':', 1)
            if len(parts) == 2:
                key = parts[0].strip()
                val = parts[1].strip()
                # camelCase key
                key = re.sub(r'-([a-z])', lambda m: m.group(1).upper(), key)
                react_styles.append(f'{key}: "{val}"')
        return 'style={{' + ', '.join(react_styles) + '}}'
        
    jsx = re.sub(r'style="([^"]*)"', style_replacer, jsx)
    
    # Replace html comments
    jsx = re.sub(r'<!--(.*?)-->', r'{/*\1*/}', jsx, flags=re.DOTALL)
    
    return jsx

configs = [
    {
        "src": r"D:\Stay Q\stitch_export\stitch_stay_q_command_center\booking_ledger\code.html",
        "dest": r"d:\Stay Q\admin-panel\src\app\bookings\page.tsx",
        "name": "BookingsPage",
        "api": "/api/v1/admin/bookings"
    },
    {
        "src": r"D:\Stay Q\stitch_export\stitch_stay_q_command_center\people_management\code.html",
        "dest": r"d:\Stay Q\admin-panel\src\app\people\page.tsx",
        "name": "PeoplePage",
        "api": "/api/v1/admin/users"
    },
    {
        "src": r"D:\Stay Q\stitch_export\stitch_stay_q_command_center\system_health\code.html",
        "dest": r"d:\Stay Q\admin-panel\src\app\health\page.tsx",
        "name": "HealthPage",
        "api": "/api/v1/admin/health"
    },
    {
        "src": r"D:\Stay Q\stitch_export\stitch_stay_q_command_center\dashboard_overview\code.html",
        "dest": r"d:\Stay Q\admin-panel\src\app\executive\page.tsx",
        "name": "ExecutivePage",
        "api": "/api/v1/admin/analytics/overview"
    }
]

for cfg in configs:
    with open(cfg["src"], "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")
        
    main_tag = soup.find("main")
    if not main_tag:
        # Some might not have <main>, find the main container instead.
        # But looking at the HTML, all of them have <main> except maybe dashboard if it's different.
        main_tag = soup.find("body") # fallback
        
    # extract innerHTML of the tag, or just the tag itself. We'll take the tag itself.
    html_content = str(main_tag)
    
    # Convert to JSX
    jsx_content = html_to_jsx(html_content)
    
    # Generate Page component
    page_code = f"""\"use client\";

import React, {{ useEffect, useState }} from 'react';
import axios from 'axios';

export default function {cfg['name']}() {{
  const [data, setData] = useState<any>(null);

  useEffect(() => {{
    axios.get('{cfg['api']}')
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }}, []);

  return (
    <>
      {{/* data points can be wired below using data?.field etc. */}}
      {jsx_content}
    </>
  );
}}
"""
    os.makedirs(os.path.dirname(cfg["dest"]), exist_ok=True)
    with open(cfg["dest"], "w", encoding="utf-8") as f:
        f.write(page_code)
    print(f"Generated {cfg['dest']}")
