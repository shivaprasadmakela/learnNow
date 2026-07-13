const fs = require('fs');

const base64Data = fs.readFileSync('/Users/shivaprasad/.gemini/antigravity-ide/brain/073e04f6-b1b1-4857-8e36-a6fa37adb612/scratch/owl-celebrate-base64.txt', 'utf8').trim();

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- Transparent background: Owl celebration logo directly rendered -->
  <image href="data:image/png;base64,${base64Data}" x="0" y="0" width="512" height="512" />
</svg>`;

fs.writeFileSync('/Users/shivaprasad/Documents/Projects/learn-with-shiva/ui/public/favicon.svg', svgContent, 'utf8');
console.log('Favicon SVG successfully created with transparent background!');
