import type {
  Forecast,
  Language,
  ListingDraft,
  Pool,
  QtyUnit,
  RequirementDraft,
  WasteType,
} from "@/types";
import { call } from "./http";
import { MockError } from "@/mocks/store";
import { daysUntil } from "@/lib/utils";

const WASTE_KEYWORDS: { type: WasteType; words: string[] }[] = [
  { type: "paddy_straw", words: ["paddy straw", "paddy", "धान", "पराली", "भाताचे काड", "भात"] },
  { type: "rice_husk", words: ["rice husk", "husk", "भूसी", "चावल की भूसी", "भूस", "भाताची भूस"] },
  { type: "mustard_stubble", words: ["mustard stubble", "mustard", "सरसों", "मोहरी", "मोहरीचे"] },
  { type: "wheat_straw", words: ["wheat straw", "wheat", "गेहूं", "गेहूँ", "गहू"] },
  { type: "sugarcane_trash", words: ["sugarcane trash", "sugarcane", "गन्ना", "ऊस", "ऊसाचा"] },
  { type: "cashew_shell", words: ["cashew shell", "cashew", "काजू"] },
  { type: "cotton_stalk", words: ["cotton stalk", "cotton", "कपास", "कापूस"] },
  { type: "groundnut_shell", words: ["groundnut shell", "groundnut", "मूंगफली", "भुईमूग"] },
  { type: "bagasse", words: ["bagasse", "बगास", "शेवाळ"] },
];

const VILLAGES: { names: string[]; village: string; state: string }[] = [
  { names: ["rewari", "रेवाड़ी", "रेवाडी"], village: "Rewari", state: "Haryana" },
  { names: ["bawal", "बावल"], village: "Bawal", state: "Haryana" },
  { names: ["panipat", "पानीपत"], village: "Panipat", state: "Haryana" },
  { names: ["karnal", "करनाल"], village: "Karnal", state: "Haryana" },
  { names: ["ludhiana", "लुधियाना"], village: "Ludhiana", state: "Punjab" },
  { names: ["jagraon", "जगराओं"], village: "Jagraon", state: "Punjab" },
  { names: ["sangrur", "संगरूर"], village: "Sangrur", state: "Punjab" },
  { names: ["nashik", "nasik", "नाशिक"], village: "Nashik", state: "Maharashtra" },
  { names: ["kolhapur", "कोल्हापूर", "कोल्हापुर"], village: "Kolhapur", state: "Maharashtra" },
  { names: ["ratnagiri", "रत्नागिरी"], village: "Ratnagiri", state: "Maharashtra" },
];

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, "जनवरी": 0,
  feb: 1, february: 1, "फरवरी": 1, "फेब्रुवारी": 1,
  mar: 2, march: 2, "मार्च": 2,
  apr: 3, april: 3, "अप्रैल": 3, "एप्रिल": 3,
  may: 4, "मई": 4, "मे": 4,
  jun: 5, june: 5, "जून": 5,
  jul: 6, july: 6, "जुलाई": 6, "जुलै": 6,
  aug: 7, august: 7, "अगस्त": 7, "ऑगस्ट": 7,
  sep: 8, sept: 8, september: 8, "सितंबर": 8, "सप्टेंबर": 8,
  oct: 9, october: 9, "अक्टूबर": 9, "ऑक्टोबर": 9,
  nov: 10, november: 10, "नवंबर": 10, "नोव्हेंबर": 10,
  dec: 11, december: 11, "दिसंबर": 11, "डिसेंबर": 11,
};

const UNIT_WORDS: { re: string; unit: QtyUnit }[] = [
  { re: "quintals?|क्विंटल", unit: "quintal" },
  { re: "tonnes?|tons?|टन", unit: "tonne" },
  { re: "kgs?|kilograms?|किलो|किलोग्राम", unit: "kg" },
];

function normalizeNumbers(s: string) {
  return s.replace(/(\d),(?=\d{3}(\D|$))/g, "$1");
}

function parseNumbersWithUnits(text: string) {
  const normalized = normalizeNumbers(text);
  const results: { value: number; unit: QtyUnit; isRate: boolean; index: number }[] = [];
  for (const u of UNIT_WORDS) {
    const re = new RegExp(
      `([\\d][\\d,]*(?:\\.\\d+)?)\\s*(?:रुपये|rs\\.?|rupees?)?\\s*(?:per|प्रति|\\/)?\\s*(?:${u.re})`,
      "gi"
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(normalized))) {
      const before = normalized.slice(Math.max(0, m.index - 8), m.index).toLowerCase();
      const whole = m[0].toLowerCase();
      const isRate =
        /per|प्रति|रुपये|rs|rupees|\/|₹/.test(whole) ||
        /₹|at\s*$|@\s*$/.test(before);
      results.push({
        value: Number(m[1].replace(/,/g, "")),
        unit: u.unit,
        isRate,
        index: m.index,
      });
    }
  }
  return results.sort((a, b) => a.index - b.index);
}

function detectWaste(text: string): WasteType | undefined {
  const t = text.toLowerCase();
  let best: { type: WasteType; len: number } | undefined;
  for (const entry of WASTE_KEYWORDS) {
    for (const w of entry.words) {
      if (w && t.includes(w.toLowerCase()) && (!best || w.length > best.len)) {
        best = { type: entry.type, len: w.length };
      }
    }
  }
  return best?.type;
}

function detectVillage(text: string) {
  const t = text.toLowerCase();
  return VILLAGES.find((v) => v.names.some((n) => t.includes(n.toLowerCase())));
}

function detectDeadline(text: string): string | undefined {
  const t = text.toLowerCase();
  const monthNames = Object.keys(MONTHS).join("|");
  const m = t.match(new RegExp(`(?:by|before|तक|पर्यंत)?\\s*(\\d{1,2})\\s*(${monthNames})`, "i"));
  if (!m) return undefined;
  const day = Number(m[1]);
  const month = MONTHS[m[2].toLowerCase()];
  if (month === undefined) return undefined;
  const now = new Date();
  let year = now.getFullYear();
  let date = new Date(year, month, day, 18, 0, 0);
  if (date.getTime() < now.getTime()) {
    year += 1;
    date = new Date(year, month, day, 18, 0, 0);
  }
  return date.toISOString();
}

export const aiAssistantService = {
  parseListingText(text: string, _language: Language = "en"): Promise<ListingDraft> {
    return call("ai/parse-listing", { method: "POST", body: JSON.stringify({ text }) }, () => {
      if (!text.trim()) throw new MockError("No speech or text was received.", "NO_INPUT");
      const nums = parseNumbersWithUnits(text);
      const quantity = nums.find((n) => !n.isRate);
      const rate = nums.find((n) => n.isRate);
      const waste = detectWaste(text);
      const village = detectVillage(text);
      const confidence: Record<string, number> = {
        wasteType: waste ? 0.93 : 0.05,
        quantity: quantity ? 0.95 : 0.05,
        rate: rate ? 0.88 : 0.05,
        village: village ? 0.84 : 0.1,
        collectionPointId: village ? 0.7 : 0.1,
      };
      return {
        wasteType: waste,
        quantity: quantity?.value,
        unit: quantity?.unit,
        rate: rate?.value,
        rateUnit: rate?.unit,
        village: village?.village,
        confidence,
        rawText: text,
      };
    });
  },

  parseRequirementText(text: string): Promise<RequirementDraft> {
    return call("ai/parse-requirement", { method: "POST", body: JSON.stringify({ text }) }, () => {
      if (!text.trim()) throw new MockError("No text was received.", "NO_INPUT");
      const nums = parseNumbersWithUnits(text);
      const quantity = nums.find((n) => !n.isRate) ?? nums[0];
      const rate = nums.find((n) => n.isRate);
      const waste = detectWaste(text);
      const village = detectVillage(text);
      const deadline = detectDeadline(text);
      const confidence: Record<string, number> = {
        wasteType: waste ? 0.93 : 0.05,
        quantity: quantity ? 0.94 : 0.05,
        rate: rate ? 0.9 : 0.05,
        village: village ? 0.86 : 0.1,
        deadline: deadline ? 0.88 : 0.05,
      };
      return {
        wasteType: waste,
        quantity: quantity?.value,
        unit: quantity?.unit,
        rate: rate?.value,
        rateUnit: rate?.unit,
        village: village?.village,
        deadline,
        confidence,
        rawText: text,
      };
    });
  },

  explainPool(pool: Pool): Promise<{ summary: string; assumptions: string[]; confidence: number }> {
    return call("ai/explain-pool", undefined, () => {
      const percent = Math.round((pool.committedKg / pool.targetKg) * 100);
      const remaining = pool.targetKg - pool.committedKg;
      const days = daysUntil(pool.deadline);
      const perDayNeeded = days > 0 ? Math.round(remaining / days) : remaining;
      const feasible = days > 0 && perDayNeeded < 6000;
      return {
        summary: feasible
          ? `This pool is ${percent}% full. ${remaining.toLocaleString("en-IN")} kg is still needed with ${days} day${days === 1 ? "" : "s"} left. At the current pace it looks achievable, but more farmers in the area would help.`
          : `This pool is ${percent}% full. ${remaining.toLocaleString("en-IN")} kg is still needed with ${days} day${days === 1 ? "" : "s"} left. The deadline looks tight. Expanding the area or extending the deadline is worth considering.`,
        assumptions: [
          `Based on ${pool.contributionCount} recorded contributions.`,
          "Assumes similar daily commitment pace until the deadline.",
          "This is an estimate, not a guarantee.",
        ],
        confidence: days > 0 ? 0.72 : 0.4,
      };
    });
  },

  explainForecast(forecast: Forecast): Promise<string> {
    return call("ai/explain-forecast", undefined, () => {
      if (forecast.limitedData) {
        return "There is not enough history for this region and season. I have not produced a number because that would be a guess.";
      }
      return forecast.explanation;
    });
  },

  explainMatch(farmerName: string, distanceKm: number, pastDeals: number): Promise<string> {
    return call("ai/explain-match", undefined, () =>
      `${farmerName} is ${distanceKm.toFixed(0)} km from the pool and has ${pastDeals} past deal${pastDeals === 1 ? "" : "s"} with you. The quantity fit and trust score are the main reasons for this rank.`
    );
  },
};
