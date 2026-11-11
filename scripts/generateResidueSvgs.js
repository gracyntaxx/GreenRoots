import fs from "fs";
import path from "path";

const residues = {
  paddy_straw: { title: "Paddy Straw", color: "#D97706", icon: "🌾", desc: "Harvested Rice Straw & Bales" },
  wheat_straw: { title: "Wheat Straw", color: "#CA8A04", icon: "🌾", desc: "Golden Harvested Wheat Biomass" },
  rice_husk: { title: "Rice Husk", color: "#B45309", icon: "🌾", desc: "Milled Rice Chaff & Hulls" },
  mustard_stubble: { title: "Mustard Stubble", color: "#65A30D", icon: "🌱", desc: "Post-Harvest Mustard Stalks" },
  sugarcane_trash: { title: "Sugarcane Trash", color: "#15803D", icon: "🌿", desc: "Dry Sugarcane Field Leaves" },
  cashew_shell: { title: "Cashew Shell", color: "#854D0E", icon: "🌰", desc: "Hard Outer Cashew Shells" },
  cotton_stalk: { title: "Cotton Stalk", color: "#0284C7", icon: "🪵", desc: "Dry Woody Cotton Plant Residue" },
  groundnut_shell: { title: "Groundnut Shell", color: "#9A3412", icon: "🥜", desc: "Crushed Peanut / Groundnut Pods" },
  bagasse: { title: "Sugarcane Bagasse", color: "#166534", icon: "🎋", desc: "Fibrous Cane Bio-Refinery Residue" },
};

const dir = path.resolve("public/images/residues");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

for (const [key, r] of Object.entries(residues)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bg_${key}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F281E"/>
      <stop offset="100%" stop-color="#081812"/>
    </linearGradient>
    <radialGradient id="glow_${key}" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${r.color}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${r.color}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg_${key})"/>
  <rect width="100%" height="100%" fill="url(#glow_${key})"/>
  <circle cx="400" cy="240" r="100" fill="${r.color}" fill-opacity="0.15" stroke="${r.color}" stroke-width="2" stroke-dasharray="6 6"/>
  <text x="400" y="265" font-size="76" text-anchor="middle">${r.icon}</text>
  <text x="400" y="395" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="-0.5">${r.title}</text>
  <text x="400" y="435" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="500" fill="#A7F3D0" text-anchor="middle" opacity="0.9">${r.desc}</text>
  <rect x="290" y="470" width="220" height="34" rx="17" fill="#0E4D2F" stroke="#10B981" stroke-width="1.5"/>
  <text x="400" y="492" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">GREENROOTS RESIDUE</text>
</svg>`;
  fs.writeFileSync(path.join(dir, `${key}.svg`), svg, "utf8");
}
console.log("SVGs successfully generated for 9 residues!");

