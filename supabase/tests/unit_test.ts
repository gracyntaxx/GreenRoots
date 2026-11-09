// GreenRoots Deno Unit Test Suite
// Run with: deno test supabase/tests/unit_test.ts

import { assertEquals, assert, assertAlmostEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { toKg, fromKg, KG_PER_UNIT } from "../functions/_shared/units.ts";
import { splitPoolCommission, calculatePlatformFee } from "../functions/_shared/fees.ts";
import { paiseToPaypalCharge, paypalChargeToPaise } from "../functions/_shared/money.ts";
import { generateHexGrid, farmersInHex } from "../functions/_shared/hex.ts";
import { haversineKm, nearestNeighbourRoute, twoOptOptimization } from "../functions/_shared/tsp.ts";
import { renderNotification } from "../functions/_shared/i18n.ts";

// 1. Units conversion
Deno.test("Units: converts toKg and fromKg accurately", () => {
  assertEquals(toKg(1, "tonne"), 1000);
  assertEquals(toKg(5, "quintal"), 500);
  assertEquals(toKg(50, "kg"), 50);

  assertEquals(fromKg(1000, "tonne"), 1);
  assertEquals(fromKg(500, "quintal"), 5);
  assertEquals(fromKg(50, "kg"), 50);
});

// 2. Financial fee calculation & Largest-Remainder commission split
Deno.test("Fees: calculates 5% platform fee correctly", () => {
  const { feePaise, netPaise } = calculatePlatformFee(100000); // ₹1,000.00
  assertEquals(feePaise, 5000); // ₹50.00
  assertEquals(netPaise, 95000); // ₹950.00
  assertEquals(feePaise + netPaise, 100000);
});

Deno.test("Fees: largest-remainder splits sum to EXACT net total without lost paise", () => {
  const totalPoolPaise = 100003; // ₹1,000.03 (odd number to test rounding)
  const contributors = [
    { id: "c1", farmerId: "f1", farmerName: "Farmer 1", kg: 333 },
    { id: "c2", farmerId: "f2", farmerName: "Farmer 2", kg: 333 },
    { id: "c3", farmerId: "f3", farmerName: "Farmer 3", kg: 334 },
  ];

  const { splits, totalNetPaise } = splitPoolCommission(totalPoolPaise, contributors);

  const sumNet = splits.reduce((s, c) => s + c.netPaise, 0);
  const sumFee = splits.reduce((s, c) => s + c.feePaise, 0);

  assertEquals(sumNet, totalNetPaise);
  assertEquals(sumNet + sumFee, totalPoolPaise);
  assert(splits.length === 3);
});

// 3. Money and PayPal FX conversions
Deno.test("Money: paiseToPaypalCharge snapshots USD cents with fx rate", () => {
  const paise = 840000; // ₹8,400.00
  const charge = paiseToPaypalCharge(paise, "USD", 84.0);

  assertEquals(charge.chargeCurrency, "USD");
  assertEquals(charge.chargeAmountMinor, 10000); // $100.00 in cents
  assertEquals(charge.fxRate, 84.0);

  const backToPaise = paypalChargeToPaise(charge.chargeAmountMinor, 84.0);
  assertEquals(backToPaise, paise);
});

// 4. Hex geometry & deterministic farmer counting
Deno.test("Hex: generates 2 rings with correct counts and deterministic farmers", () => {
  const center = { lat: 28.61, lng: 77.20 };
  const cells = generateHexGrid(center, 5, 2);

  // A 2-ring axial hex grid has 18 outer cells (ring 1 has 6, ring 2 has 12)
  assertEquals(cells.length, 18);

  const ring1Cells = cells.filter((c) => c.ring === 1);
  const ring2Cells = cells.filter((c) => c.ring === 2);
  assertEquals(ring1Cells.length, 6);
  assertEquals(ring2Cells.length, 12);

  // Determinism check: same id produces same farmer count
  const countA = farmersInHex("hex-1-0", 1);
  const countB = farmersInHex("hex-1-0", 1);
  assertEquals(countA, countB);
  assert(countA >= 9 && countA <= 27);
});

// 5. TSP & Routing
Deno.test("TSP: 2-opt optimization produces valid non-empty route", () => {
  const start = { lat: 28.199, lng: 76.618 };
  const stops = [
    { id: "s1", name: "Stop 1", location: { lat: 28.071, lng: 76.589 } },
    { id: "s2", name: "Stop 2", location: { lat: 29.388, lng: 76.971 } },
    { id: "s3", name: "Stop 3", location: { lat: 29.691, lng: 76.988 } },
  ];

  const result = twoOptOptimization(start, stops);
  assertEquals(result.order.length, 3);
  assert(result.totalKm > 0);
});

// 6. Multilingual notification rendering
Deno.test("i18n: renders notification across all 6 languages without errors", () => {
  const langs = ["en", "hi", "mr", "pa", "ta", "te"] as const;
  for (const lang of langs) {
    const notif = renderNotification("pool_open", lang, {
      wasteType: "paddy straw",
      village: "Rewari",
      rate: "2.3",
    });
    assert(notif.title.length > 0);
    assert(notif.body.length > 0);
    assert(notif.body.includes("Rewari"));
  }
});

