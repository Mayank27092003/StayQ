const fs = require('fs');
const path = require('path');
const { Resvg } = require('./backend/node_modules/@resvg/resvg-js');

const logoBuf = fs.readFileSync('assets/images/logo_sq.png');
const b64 = logoBuf.toString('base64');
const desktopDir = path.join(process.env.USERPROFILE || 'C:\\Users\\Hp', 'Desktop');

// Variant 1: Solid Royal Purple (#4A1578) with pure crisp white logo
const svgSolidPurple = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#43146B" />
  <image href="data:image/png;base64,${b64}" x="56" y="56" width="400" height="400" preserveAspectRatio="xMidYMid meet" />
</svg>
`;

// Variant 2: Deep Midnight Purple (#2D0A4E) with pure crisp white logo
const svgMidnightPurple = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2E0854" />
  <image href="data:image/png;base64,${b64}" x="56" y="56" width="400" height="400" preserveAspectRatio="xMidYMid meet" />
</svg>
`;

// Variant 3: Rich Brand Gradient Purple (#5A31F4 to #351363) with pure crisp white logo
const svgGradientPurple = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#552288" />
      <stop offset="100%" stop-color="#2D0A4E" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#purpleGrad)" />
  <image href="data:image/png;base64,${b64}" x="56" y="56" width="400" height="400" preserveAspectRatio="xMidYMid meet" />
</svg>
`;

// Variant 4: Vibrant Royal Violet (#4E1D7C)
const svgVibrantPurple = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#4B1E7B" />
  <image href="data:image/png;base64,${b64}" x="56" y="56" width="400" height="400" preserveAspectRatio="xMidYMid meet" />
</svg>
`;

function renderAndSave(svg, filename) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 512 } });
  const pngData = resvg.render().asPng();
  
  // Save to project assets
  fs.writeFileSync(path.join('assets/images', filename), pngData);
  // Also save directly to Desktop for instant Play Console upload
  fs.writeFileSync(path.join(desktopDir, filename), pngData);
  console.log(`Saved: ${filename} (512x512, ${pngData.length} bytes) to Desktop and assets/images`);
}

renderAndSave(svgSolidPurple, 'stayq_logo_512x512_solid_purple.png');
renderAndSave(svgMidnightPurple, 'stayq_logo_512x512_midnight_purple.png');
renderAndSave(svgGradientPurple, 'stayq_logo_512x512_gradient_purple.png');
renderAndSave(svgVibrantPurple, 'stayq_logo_512x512_vibrant_purple.png');
// Set the main recommended one as stayq_playstore_512.png
renderAndSave(svgSolidPurple, 'stayq_playstore_512.png');
