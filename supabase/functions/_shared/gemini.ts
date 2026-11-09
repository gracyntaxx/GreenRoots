import { ApiError } from "./errors.ts";
import type { QtyUnit, WasteType } from "./units.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-1.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export interface ParsedListing {
  wasteType?: WasteType;
  quantity?: number;
  unit?: QtyUnit;
  rate?: number;
  rateUnit?: QtyUnit;
  village?: string;
  confidence: Record<string, number>;
  rawText: string;
}

export interface ParsedRequirement {
  wasteType?: WasteType;
  quantity?: number;
  unit?: QtyUnit;
  rate?: number;
  rateUnit?: QtyUnit;
  village?: string;
  deadline?: string;
  confidence: Record<string, number>;
  rawText: string;
}

export interface ExplainPoolResult {
  summary: string;
  assumptions: string[];
  confidence: number;
}

/**
 * Call Gemini REST API with structured prompt.
 */
export async function callGemini(
  prompt: string,
  systemInstruction?: string,
  responseSchema?: Record<string, unknown>
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new ApiError(500, "GEMINI_API_KEY is not configured", "AI_NOT_CONFIGURED");
  }

  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody: Record<string, unknown> = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      ...(responseSchema ? { responseMimeType: "application/json", responseSchema } : {}),
    },
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[Gemini] API error:", res.status, errorText);
    throw new ApiError(502, `Gemini API error: ${res.statusText}`, "GEMINI_API_ERROR");
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) {
    throw new ApiError(502, "Gemini returned empty response", "GEMINI_EMPTY_RESPONSE");
  }

  return text;
}

// Fallback regex parsers matching frontend src/services/aiAssistantService.ts
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

const UNIT_WORDS: { re: string; unit: QtyUnit }[] = [
  { re: "quintals?|क्विंटल", unit: "quintal" },
  { re: "tonnes?|tons?|टन", unit: "tonne" },
  { re: "kgs?|kilograms?|किलो|किलोग्राम", unit: "kg" },
];

function fallbackDetectWaste(text: string): WasteType | undefined {
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

function fallbackDetectVillage(text: string) {
  const t = text.toLowerCase();
  return VILLAGES.find((v) => v.names.some((n) => t.includes(n.toLowerCase())));
}

function fallbackParseUnits(text: string) {
  const results: { value: number; unit: QtyUnit; isRate: boolean; index: number }[] = [];
  for (const u of UNIT_WORDS) {
    const re = new RegExp(
      `([\\d][\\d,]*(?:\\.\\d+)?)\\s*(?:रुपये|rs\\.?|rupees?)?\\s*(?:per|प्रति|\\/)?\\s*(?:${u.re})`,
      "gi"
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const before = text.slice(Math.max(0, m.index - 8), m.index).toLowerCase();
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

/**
 * Parse listing text using Gemini or deterministic NLP fallback.
 */
export async function parseListingText(text: string): Promise<ParsedListing> {
  if (!text || !text.trim()) {
    throw new ApiError(400, "No speech or text was received.", "NO_INPUT");
  }

  if (GEMINI_API_KEY) {
    try {
      const prompt = `You are GreenRoots Agri AI parser for Indian agricultural crop residue listings.
Extract the waste type, quantity, quantity unit, price rate, rate unit, and village from the text below.
Waste types must be one of: paddy_straw, rice_husk, mustard_stubble, wheat_straw, sugarcane_trash, cashew_shell, cotton_stalk, groundnut_shell, bagasse.
Units must be: quintal, tonne, or kg.
Input text: "${text}"

Respond in valid JSON matching this schema:
{
  "wasteType": string | null,
  "quantity": number | null,
  "unit": "quintal" | "tonne" | "kg" | null,
  "rate": number | null,
  "rateUnit": "quintal" | "tonne" | "kg" | null,
  "village": string | null,
  "confidence": {
    "wasteType": number (0-1),
    "quantity": number (0-1),
    "rate": number (0-1),
    "village": number (0-1)
  }
}`;
      const jsonStr = await callGemini(prompt, "Output only strict JSON.");
      const parsed = JSON.parse(jsonStr.replace(/```json/g, "").replace(/```/g, "").trim());
      return {
        wasteType: parsed.wasteType || fallbackDetectWaste(text),
        quantity: parsed.quantity,
        unit: parsed.unit || "quintal",
        rate: parsed.rate,
        rateUnit: parsed.rateUnit || parsed.unit || "quintal",
        village: parsed.village || fallbackDetectVillage(text)?.village,
        confidence: parsed.confidence || {
          wasteType: 0.9,
          quantity: 0.9,
          rate: 0.85,
          village: 0.8,
        },
        rawText: text,
      };
    } catch (err) {
      console.warn("[Gemini parseListing] Falling back to heuristic parser:", err);
    }
  }

  // Deterministic fallback
  const nums = fallbackParseUnits(text);
  const quantity = nums.find((n) => !n.isRate);
  const rate = nums.find((n) => n.isRate);
  const waste = fallbackDetectWaste(text);
  const village = fallbackDetectVillage(text);

  return {
    wasteType: waste,
    quantity: quantity?.value,
    unit: quantity?.unit || "quintal",
    rate: rate?.value,
    rateUnit: rate?.unit || quantity?.unit || "quintal",
    village: village?.village,
    confidence: {
      wasteType: waste ? 0.93 : 0.05,
      quantity: quantity ? 0.95 : 0.05,
      rate: rate ? 0.88 : 0.05,
      village: village ? 0.84 : 0.1,
      collectionPointId: village ? 0.7 : 0.1,
    },
    rawText: text,
  };
}

/**
 * Parse requirement text using Gemini or deterministic NLP fallback.
 */
export async function parseRequirementText(text: string): Promise<ParsedRequirement> {
  if (!text || !text.trim()) {
    throw new ApiError(400, "No text was received.", "NO_INPUT");
  }

  if (GEMINI_API_KEY) {
    try {
      const prompt = `You are GreenRoots Agri AI parser for industry crop residue procurement requirements.
Extract waste type, quantity, unit, price rate, rate unit, village, and ISO deadline from the text.
Waste types: paddy_straw, rice_husk, mustard_stubble, wheat_straw, sugarcane_trash, cashew_shell, cotton_stalk, groundnut_shell, bagasse.
Units: quintal, tonne, kg.
Text: "${text}"

JSON schema:
{
  "wasteType": string | null,
  "quantity": number | null,
  "unit": "quintal" | "tonne" | "kg" | null,
  "rate": number | null,
  "rateUnit": "quintal" | "tonne" | "kg" | null,
  "village": string | null,
  "deadline": string | null,
  "confidence": {
    "wasteType": number,
    "quantity": number,
    "rate": number,
    "village": number,
    "deadline": number
  }
}`;
      const jsonStr = await callGemini(prompt, "Output only strict JSON.");
      const parsed = JSON.parse(jsonStr.replace(/```json/g, "").replace(/```/g, "").trim());
      return {
        wasteType: parsed.wasteType || fallbackDetectWaste(text),
        quantity: parsed.quantity,
        unit: parsed.unit || "tonne",
        rate: parsed.rate,
        rateUnit: parsed.rateUnit || parsed.unit || "tonne",
        village: parsed.village || fallbackDetectVillage(text)?.village,
        deadline: parsed.deadline,
        confidence: parsed.confidence || {
          wasteType: 0.92,
          quantity: 0.94,
          rate: 0.88,
          village: 0.85,
          deadline: 0.8,
        },
        rawText: text,
      };
    } catch (err) {
      console.warn("[Gemini parseRequirement] Falling back to heuristic parser:", err);
    }
  }

  // Deterministic fallback
  const nums = fallbackParseUnits(text);
  const quantity = nums.find((n) => !n.isRate) ?? nums[0];
  const rate = nums.find((n) => n.isRate);
  const waste = fallbackDetectWaste(text);
  const village = fallbackDetectVillage(text);

  return {
    wasteType: waste,
    quantity: quantity?.value,
    unit: quantity?.unit || "tonne",
    rate: rate?.value,
    rateUnit: rate?.unit || quantity?.unit || "tonne",
    village: village?.village,
    deadline: undefined,
    confidence: {
      wasteType: waste ? 0.93 : 0.05,
      quantity: quantity ? 0.94 : 0.05,
      rate: rate ? 0.9 : 0.05,
      village: village ? 0.86 : 0.1,
      deadline: 0.1,
    },
    rawText: text,
  };
}

/**
 * Generate pool progress explanation.
 */
export async function explainPoolProgress(pool: {
  committedKg: number;
  targetKg: number;
  deadline: string;
  contributionCount: number;
}): Promise<ExplainPoolResult> {
  const percent = Math.round((pool.committedKg / pool.targetKg) * 100);
  const remaining = Math.max(0, pool.targetKg - pool.committedKg);
  const deadlineDate = new Date(pool.deadline);
  const now = new Date();
  const days = Math.max(0, Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const feasible = days > 0 && (remaining / days) < 6000;

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
}

