const fs = require('fs');
const path = require('path');
const { Resvg } = require('./backend/node_modules/@resvg/resvg-js');

const logoBuf = fs.readFileSync('assets/images/logo_sq.png');
const b64 = logoBuf.toString('base64');

// High-precision SVG template for clean flat white logo on full purple
const makeSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#43146B" />
  <image href="data:image/png;base64,${b64}" x="${size * 0.1}" y="${size * 0.1}" width="${size * 0.8}" height="${size * 0.8}" preserveAspectRatio="xMidYMid meet" />
</svg>
`;

function renderSize(size) {
  const svg = makeSvg(size);
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  return resvg.render().asPng();
}

// 1. Update assets/images/logo_icon.png with 512x512 clean version
const icon512 = renderSize(512);
fs.writeFileSync('assets/images/logo_icon.png', icon512);
console.log('Updated assets/images/logo_icon.png');

// 2. Update Android mipmap launcher icons
const mipmaps = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

// 3. Update iOS AppIcon.appiconset
const iosIcons = [
  { name: 'Icon-App-20x20@1x.png', size: 20 },
  { name: 'Icon-App-20x20@2x.png', size: 40 },
  { name: 'Icon-App-20x20@3x.png', size: 60 },
  { name: 'Icon-App-29x29@1x.png', size: 29 },
  { name: 'Icon-App-29x29@2x.png', size: 58 },
  { name: 'Icon-App-29x29@3x.png', size: 87 },
  { name: 'Icon-App-40x40@1x.png', size: 40 },
  { name: 'Icon-App-40x40@2x.png', size: 80 },
  { name: 'Icon-App-40x40@3x.png', size: 120 },
  { name: 'Icon-App-60x60@2x.png', size: 120 },
  { name: 'Icon-App-60x60@3x.png', size: 180 },
  { name: 'Icon-App-76x76@1x.png', size: 76 },
  { name: 'Icon-App-76x76@2x.png', size: 152 },
  { name: 'Icon-App-83.5x83.5@2x.png', size: 167 },
  { name: 'Icon-App-1024x1024@1x.png', size: 1024 }
];

const iosDir = 'ios/Runner/Assets.xcassets/AppIcon.appiconset';
for (const icon of iosIcons) {
  const p = path.join(iosDir, icon.name);
  fs.writeFileSync(p, renderSize(icon.size));
  console.log(`Updated iOS ${icon.name} (${icon.size}x${icon.size})`);
}
