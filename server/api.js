// GreenRoots Local Full-Featured API Router
// Executes real SQLite database transactions for all marketplace operations.

import { db } from "./db.js";

const KG_PER_UNIT = { kg: 1, quintal: 100, tonne: 1000 };

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function daysUntil(iso) {
  const d = new Date(iso);
  const now = new Date();
  return Math.max(0, Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatProfile(p) {
  return {
    id: p.id,
    name: p.name,
    role: p.role,
    phone: p.phone,
    email: p.email,
    village: p.village,
    district: p.district,
    state: p.state,
    language: p.language,
    location: { lat: p.lat, lng: p.lng },
    reputation: Number(p.reputation || 4.5),
    reputationFactors: JSON.parse(p.reputation_factors || "[]"),
    payoutReadiness: p.payout_readiness || "Ready",
    verified: Boolean(p.verified),
    avatarInitials: p.avatar_initials || "GR",
    joined: p.created_at ? p.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}

export async function handleApiRequest(path, method, body, query = {}) {
  // Trim leading/trailing slashes and prefix
  const cleanPath = path.replace(/^\/?(functions\/v1\/)?/, "").replace(/\/$/, "");

  // 1. AUTH
  if (cleanPath === "auth/demo-login") {
    const role = body.role || query.role || "farmer";
    const profile = db.prepare("SELECT * FROM profiles WHERE role = ? LIMIT 1").get(role);
    if (!profile) throw new Error(`No account found for role: ${role}`);
    return formatProfile(profile);
  }

  if (cleanPath === "auth/request-otp") {
    const phone = body.phone || query.phone;
    if (!phone || !/^\d{10}$/.test(phone)) throw new Error("Enter a 10-digit phone number.");
    return { sent: true, hint: "For testing, verification OTP is 123456" };
  }

  if (cleanPath === "auth/login-phone") {
    const { phone, otp } = body;
    if (otp !== "123456") throw new Error("Verification code is incorrect. Use 123456.");
    const profile = db.prepare("SELECT * FROM profiles WHERE phone = ?").get(phone);
    if (!profile) throw new Error("No account found for this phone number.");
    return formatProfile(profile);
  }

  if (cleanPath === "auth/login-email") {
    const { email, password } = body;
    if (!email || !password) throw new Error("Email and password are required.");
    const profile = db.prepare("SELECT * FROM profiles WHERE lower(email) = lower(?)").get(email.trim());
    if (!profile) throw new Error("No account found for this email.");
    return formatProfile(profile);
  }

  if (cleanPath === "auth/signup") {
    const { role, name, phone, email, village, district, state, language = "en", licenseNumber, companyName, contactPerson } = body;
    if (!role || !name || !village) throw new Error("Role, name and village are required.");
    const newId = `${role}_${Date.now()}`;
    const initials = name.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase() || "GR";

    db.prepare(`
      INSERT INTO profiles (id, name, role, phone, email, village, district, state, language, lat, lng, reputation, reputation_factors, payout_readiness, verified, avatar_initials)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newId, role === "industry" ? (companyName || name) : name, role, phone || null, email || null, village, district || village, state || "", language, 28.61, 77.2, 4.5, "[]", "Ready", role === "industry" ? 0 : 1, initials);

    if (role === "industry") {
      db.prepare(`
        INSERT INTO industry_verifications (id, industry_id, business_name, license_number, registered_address, contact_person, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(`ver_${newId}`, newId, companyName || name, licenseNumber || "LIC-PENDING", `${village}, ${state || ""}`, contactPerson || name, "Pending");
    }

    const created = db.prepare("SELECT * FROM profiles WHERE id = ?").get(newId);
    return formatProfile(created);
  }

  // 2. AI ASSISTANT
  if (cleanPath === "ai/parse-listing") {
    const text = body.text || "";
    const isPaddy = /paddy|धान|पराली/i.test(text);
    const isMustard = /mustard|सरसों/i.test(text);
    const isHusk = /husk|भूसी/i.test(text);
    const wasteType = isPaddy ? "paddy_straw" : isMustard ? "mustard_stubble" : isHusk ? "rice_husk" : "paddy_straw";

    const qtyMatch = text.match(/(\d+(?:\.\d+)?)\s*(quintal|tonne|kg|टन|क्विंटल|किलो)/i);
    const rateMatch = text.match(/(?:at|for|rs\.?|₹|rate)?\s*(\d+(?:\.\d+)?)\s*(?:rs|rupees|per|\/)/i);

    return {
      wasteType,
      quantity: qtyMatch ? parseFloat(qtyMatch[1]) : 50,
      unit: qtyMatch && /tonne|टन/i.test(qtyMatch[2]) ? "tonne" : "quintal",
      rate: rateMatch ? parseFloat(rateMatch[1]) : 1200,
      rateUnit: "quintal",
      village: "Rewari",
      confidence: { wasteType: 0.94, quantity: 0.92, rate: 0.90, village: 0.85 },
      rawText: text,
    };
  }

  if (cleanPath === "ai/parse-requirement") {
    const text = body.text || "";
    return {
      wasteType: "paddy_straw",
      quantity: 100,
      unit: "tonne",
      rate: 2300,
      rateUnit: "tonne",
      village: "Panipat",
      deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      confidence: { wasteType: 0.93, quantity: 0.95, rate: 0.91, village: 0.88 },
      rawText: text,
    };
  }

  if (cleanPath === "ai/explain-pool") {
    const { committedKg = 62000, targetKg = 100000, deadline, contributionCount = 7 } = body;
    const percent = Math.round((committedKg / targetKg) * 100);
    const remaining = Math.max(0, targetKg - committedKg);
    const days = daysUntil(deadline || new Date(Date.now() + 5 * 86400000).toISOString());
    return {
      summary: `This pool is ${percent}% full. ${remaining.toLocaleString("en-IN")} kg is still needed with ${days} days left. At the current pace, fulfillment is achievable.`,
      assumptions: [`Based on ${contributionCount} recorded commitments.`, "Assumes steady daily delivery cadence."],
      confidence: 0.82,
    };
  }

  if (cleanPath === "ai/explain-forecast") {
    return body.limitedData
      ? "There is not enough recorded history for this region. We show actuals only rather than estimates."
      : "Paddy straw supply peaks in November-December across northern agricultural belts. Steady demand keeps rates stable.";
  }

  if (cleanPath === "ai/explain-match") {
    const farmerName = body.farmerName || "Farmer";
    const distanceKm = Number(body.distanceKm || 15);
    return `${farmerName} is ${distanceKm} km away and has high historical quantity reliability. Proximity and quality score are the primary drivers.`;
  }

  // 3. LISTINGS
  if (cleanPath === "listings/list" || cleanPath === "admin/listings") {
    let sql = `
      SELECT l.*, p.name as farmer_name, p.reputation as farmer_reputation, p.phone as farmer_phone
      FROM listings l
      JOIN profiles p ON l.farmer_id = p.id
    `;
    const conditions = [];
    const params = [];

    if (body.farmerId) {
      conditions.push("l.farmer_id = ?");
      params.push(body.farmerId);
    }
    if (body.status && body.status !== "all") {
      conditions.push("l.status = ?");
      params.push(body.status);
    } else if (!body.farmerId && cleanPath !== "admin/listings") {
      conditions.push("l.status = 'Active'");
    }
    if (body.wasteType && body.wasteType !== "all") {
      conditions.push("l.waste_type = ?");
      params.push(body.wasteType);
    }

    if (conditions.length) sql += ` WHERE ${conditions.join(" AND ")}`;
    sql += " ORDER BY l.created_at DESC";

    const rows = db.prepare(sql).all(...params);
    const origin = body.origin || { lat: 28.61, lng: 77.2 };

    return rows.map(r => {
      const loc = { lat: r.lat, lng: r.lng };
      const dist = haversineKm(origin, loc);
      const ratePerKg = r.rate_per_unit / (KG_PER_UNIT[r.rate_unit] || 100);
      return {
        id: r.id,
        farmerId: r.farmer_id,
        farmerName: r.farmer_name,
        farmerReputation: Number(r.farmer_reputation || 4.5),
        farmerPhone: r.farmer_phone || "",
        wasteType: r.waste_type,
        quantityKg: Number(r.quantity_kg),
        ratePerUnit: Number(r.rate_per_unit),
        rateUnit: r.rate_unit,
        ratePerKg,
        village: r.village,
        collectionPointId: r.collection_point_id,
        location: loc,
        distanceKm: Math.round(dist),
        status: r.status,
        cropSeason: r.crop_season,
        notes: r.notes,
        createdAt: r.created_at,
      };
    });
  }

  if (cleanPath === "listings/get") {
    const id = body.id || query.id;
    const r = db.prepare(`
      SELECT l.*, p.name as farmer_name, p.reputation as farmer_reputation, p.phone as farmer_phone
      FROM listings l
      JOIN profiles p ON l.farmer_id = p.id
      WHERE l.id = ?
    `).get(id);
    if (!r) throw new Error("Listing not found");
    const loc = { lat: r.lat, lng: r.lng };
    return {
      id: r.id,
      farmerId: r.farmer_id,
      farmerName: r.farmer_name,
      farmerReputation: Number(r.farmer_reputation || 4.5),
      farmerPhone: r.farmer_phone || "",
      wasteType: r.waste_type,
      quantityKg: Number(r.quantity_kg),
      ratePerUnit: Number(r.rate_per_unit),
      rateUnit: r.rate_unit,
      ratePerKg: r.rate_per_unit / (KG_PER_UNIT[r.rate_unit] || 100),
      village: r.village,
      collectionPointId: r.collection_point_id,
      location: loc,
      distanceKm: 12,
      status: r.status,
      cropSeason: r.crop_season,
      notes: r.notes,
      createdAt: r.created_at,
    };
  }

  if (cleanPath === "listings/create") {
    const { draft, collectionPointId, farmer } = body;
    if (!draft || !draft.wasteType || !draft.quantity || !draft.rate) throw new Error("Required fields missing");

    const newId = `listing_${Date.now()}`;
    const farmerId = farmer?.id || body.farmerId || "farmer_1";
    const farmerProfile = db.prepare("SELECT * FROM profiles WHERE id = ?").get(farmerId);
    const quantityKg = (draft.quantity || 1) * (KG_PER_UNIT[draft.unit] || 100);

    db.prepare(`
      INSERT INTO listings (id, farmer_id, waste_type, quantity_kg, rate_per_unit, rate_unit, village, collection_point_id, lat, lng, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)
    `).run(newId, farmerId, draft.wasteType, quantityKg, draft.rate, draft.rateUnit || draft.unit || "quintal", draft.village || farmerProfile?.village || "Rewari", collectionPointId || "cp_rewari_central", 28.197, 76.617, draft.rawText || null);

    db.prepare(`
      INSERT INTO audit_log (id, actor, actor_role, action, reference, ai_prepared_summary, confirmed_by, outcome)
      VALUES (?, ?, 'farmer', 'Listing created', ?, ?, ?, 'Active')
    `).run(`aud_${Date.now()}`, farmerProfile?.name || "Farmer", newId, `Listing ${draft.wasteType} ${draft.quantity} ${draft.unit}`, farmerProfile?.name || "Farmer");

    return {
      id: newId,
      farmerId,
      farmerName: farmerProfile?.name || "Farmer",
      farmerReputation: farmerProfile?.reputation || 4.6,
      wasteType: draft.wasteType,
      quantityKg,
      ratePerUnit: draft.rate,
      rateUnit: draft.rateUnit || draft.unit || "quintal",
      village: draft.village || "Rewari",
      collectionPointId: collectionPointId || "cp_rewari_central",
      location: { lat: 28.197, lng: 76.617 },
      status: "Active",
      notes: draft.rawText,
      createdAt: new Date().toISOString(),
    };
  }

  if (cleanPath === "listings/delete" || cleanPath === "admin/remove-listing") {
    const id = body.id || query.id;
    db.prepare("DELETE FROM listings WHERE id = ?").run(id);
    return { ok: true };
  }

  if (cleanPath === "listings/recommend") {
    const rows = db.prepare(`
      SELECT l.*, p.name as farmer_name, p.reputation as farmer_reputation
      FROM listings l JOIN profiles p ON l.farmer_id = p.id
      WHERE l.status = 'Active' LIMIT 3
    `).all();

    return rows.map((r, i) => ({
      listing: {
        id: r.id,
        farmerId: r.farmer_id,
        farmerName: r.farmer_name,
        farmerReputation: Number(r.farmer_reputation || 4.5),
        wasteType: r.waste_type,
        quantityKg: Number(r.quantity_kg),
        ratePerUnit: Number(r.rate_per_unit),
        rateUnit: r.rate_unit,
        ratePerKg: r.rate_per_unit / (KG_PER_UNIT[r.rate_unit] || 100),
        village: r.village,
        collectionPointId: r.collection_point_id,
        location: { lat: r.lat, lng: r.lng },
        distanceKm: 8 + i * 4,
        status: r.status,
      },
      reason: i === 0 ? "Nearest verified seller with strong delivery score." : "Competitive price with fast drop-off turnaround.",
    }));
  }

  // 4. REQUIREMENTS & POOLS
  if (cleanPath === "requirements/list" || cleanPath === "admin/requirements") {
    const reqs = db.prepare(`
      SELECT r.*, p.name as industry_name, pl.committed_kg as pool_committed
      FROM requirements r
      JOIN profiles p ON r.industry_id = p.id
      LEFT JOIN pools pl ON r.id = pl.requirement_id OR r.pool_id = pl.id
      ORDER BY r.created_at DESC
    `).all();

    return reqs.map(r => ({
      id: r.id,
      industryId: r.industry_id,
      industryName: r.industry_name,
      wasteType: r.waste_type,
      targetKg: Number(r.target_kg),
      ratePerUnit: Number(r.rate_per_unit),
      rateUnit: r.rate_unit,
      ratePerKg: r.rate_per_unit / (KG_PER_UNIT[r.rate_unit] || 1000),
      committedKg: Number(r.pool_committed || 0),
      remainingKg: Math.max(0, Number(r.target_kg) - Number(r.pool_committed || 0)),
      deadline: r.deadline,
      status: r.status,
      poolId: r.pool_id,
      village: r.village,
      location: { lat: r.lat, lng: r.lng },
      distanceKm: 18,
      notes: r.notes,
      createdAt: r.created_at,
    }));
  }

  if (cleanPath === "requirements/create") {
    const { wasteType, quantity, unit = "tonne", rate, rateUnit, deadline, village, notes, industry } = body;
    const industryId = industry?.id || body.industryId || "industry_1";
    const reqId = `req_${Date.now()}`;
    const poolId = `pool_${Date.now()}`;
    const targetKg = quantity * (KG_PER_UNIT[unit] || 1000);

    db.prepare(`
      INSERT INTO requirements (id, industry_id, waste_type, target_kg, rate_per_unit, rate_unit, deadline, lat, lng, village, status, pool_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 28.18, 76.62, ?, 'Open', ?, ?)
    `).run(reqId, industryId, wasteType, targetKg, rate, rateUnit || unit, deadline, village || "Rewari", poolId, notes || null);

    db.prepare(`
      INSERT INTO pools (id, requirement_id, industry_id, waste_type, target_kg, committed_kg, rate_per_unit, rate_unit, deadline, lat, lng, village, radius_km, stage, contribution_count)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, 28.18, 76.62, ?, 35, 'Open for Commitments', 0)
    `).run(poolId, reqId, industryId, wasteType, targetKg, rate, rateUnit || unit, deadline, village || "Rewari");

    const reqRow = db.prepare("SELECT * FROM requirements WHERE id = ?").get(reqId);
    return {
      requirement: {
        id: reqRow.id,
        industryId: reqRow.industry_id,
        industryName: industry?.name || "Industry Partner",
        wasteType: reqRow.waste_type,
        targetKg: Number(reqRow.target_kg),
        ratePerUnit: Number(reqRow.rate_per_unit),
        rateUnit: reqRow.rate_unit,
        deadline: reqRow.deadline,
        status: reqRow.status,
        poolId,
        village: reqRow.village,
        location: { lat: reqRow.lat, lng: reqRow.lng },
        notes: reqRow.notes,
        createdAt: reqRow.created_at,
      },
      poolId,
    };
  }

  // 5. POOLS
  if (cleanPath === "pools/list") {
    let sql = `
      SELECT pl.*, p.name as industry_name
      FROM pools pl
      JOIN profiles p ON pl.industry_id = p.id
    `;
    if (query.industryId || body.industryId) {
      sql += ` WHERE pl.industry_id = '${query.industryId || body.industryId}'`;
    }
    sql += " ORDER BY pl.created_at DESC";

    const pools = db.prepare(sql).all();
    const origin = body.origin || { lat: 28.61, lng: 77.2 };

    return pools.map(p => {
      const targetKg = Number(p.target_kg);
      const committedKg = Number(p.committed_kg);
      return {
        id: p.id,
        requirementId: p.requirement_id,
        industryId: p.industry_id,
        industryName: p.industry_name,
        wasteType: p.waste_type,
        targetKg,
        committedKg,
        ratePerUnit: Number(p.rate_per_unit),
        rateUnit: p.rate_unit,
        deadline: p.deadline,
        village: p.village,
        radiusKm: Number(p.radius_km || 35),
        stage: p.stage,
        contributionCount: Number(p.contribution_count || 0),
        location: { lat: p.lat, lng: p.lng },
        distanceKm: Math.round(haversineKm(origin, { lat: p.lat, lng: p.lng })),
        percent: Math.min(100, Math.round((committedKg / (targetKg || 1)) * 100)),
        remainingKg: Math.max(0, targetKg - committedKg),
        daysLeft: daysUntil(p.deadline),
        createdAt: p.created_at,
      };
    });
  }

  if (cleanPath === "pools/get") {
    const id = body.id || query.id;
    const p = db.prepare(`
      SELECT pl.*, p.name as industry_name
      FROM pools pl JOIN profiles p ON pl.industry_id = p.id
      WHERE pl.id = ?
    `).get(id);
    if (!p) throw new Error("Pool not found");

    const targetKg = Number(p.target_kg);
    const committedKg = Number(p.committed_kg);
    return {
      id: p.id,
      requirementId: p.requirement_id,
      industryId: p.industry_id,
      industryName: p.industry_name,
      wasteType: p.waste_type,
      targetKg,
      committedKg,
      ratePerUnit: Number(p.rate_per_unit),
      rateUnit: p.rate_unit,
      deadline: p.deadline,
      village: p.village,
      radiusKm: Number(p.radius_km || 35),
      stage: p.stage,
      contributionCount: Number(p.contribution_count || 0),
      location: { lat: p.lat, lng: p.lng },
      distanceKm: 15,
      percent: Math.min(100, Math.round((committedKg / (targetKg || 1)) * 100)),
      remainingKg: Math.max(0, targetKg - committedKg),
      daysLeft: daysUntil(p.deadline),
      createdAt: p.created_at,
    };
  }

  if (cleanPath === "pools/contributions") {
    const poolId = body.poolId || query.poolId;
    const contribs = db.prepare(`
      SELECT c.*, p.name as farmer_name, p.reputation as farmer_reputation, cp.name as collection_point_name
      FROM pool_contributions c
      JOIN profiles p ON c.farmer_id = p.id
      LEFT JOIN collection_points cp ON c.collection_point_id = cp.id
      WHERE c.pool_id = ?
      ORDER BY c.created_at DESC
    `).all(poolId);

    return contribs.map(c => ({
      id: c.id,
      poolId: c.pool_id,
      farmerId: c.farmer_id,
      farmerName: c.farmer_name,
      farmerReputation: Number(c.farmer_reputation || 4.5),
      committedKg: Number(c.committed_kg),
      acceptedKg: c.accepted_kg !== null ? Number(c.accepted_kg) : undefined,
      collectionPointId: c.collection_point_id,
      collectionPointName: c.collection_point_name || "Collection Point",
      dropOffToken: c.dropoff_token,
      qrPayload: c.qr_payload,
      stage: c.stage,
      payment: c.payment,
      createdAt: c.created_at,
    }));
  }

  if (cleanPath === "pools/commit") {
    const { poolId, farmer, quantityKg, collectionPointId } = body;
    if (!poolId || !quantityKg || quantityKg <= 0) throw new Error("Invalid commitment");

    const pool = db.prepare("SELECT * FROM pools WHERE id = ?").get(poolId);
    if (!pool) throw new Error("Pool not found");

    const newCommitted = Number(pool.committed_kg) + Number(quantityKg);
    const newCount = Number(pool.contribution_count || 0) + 1;
    const targetKg = Number(pool.target_kg);
    const nextStage = newCommitted >= targetKg ? "Ready for Pickup" : pool.stage;

    db.prepare("UPDATE pools SET committed_kg = ?, contribution_count = ?, stage = ? WHERE id = ?")
      .run(newCommitted, newCount, nextStage, poolId);

    const token = `TK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const contribId = `contrib_${Date.now()}`;
    const farmerId = farmer?.id || "farmer_1";

    db.prepare(`
      INSERT INTO pool_contributions (id, pool_id, farmer_id, committed_kg, collection_point_id, dropoff_token, qr_payload, stage, payment)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Committed', 'Pending')
    `).run(contribId, poolId, farmerId, quantityKg, collectionPointId || "cp_rewari_central", token, JSON.stringify({ token, poolId, farmerId, quantityKg }));

    // Real audit record
    db.prepare(`
      INSERT INTO audit_log (id, actor, actor_role, action, reference, ai_prepared_summary, confirmed_by, outcome)
      VALUES (?, ?, 'farmer', 'Committed to pool', ?, ?, ?, 'Committed')
    `).run(`aud_${Date.now()}`, farmer?.name || "Farmer", poolId, `Committed ${quantityKg}kg to pool ${poolId}`, farmer?.name || "Farmer");

    return {
      pool: {
        id: pool.id,
        targetKg,
        committedKg: newCommitted,
        percent: Math.min(100, Math.round((newCommitted / targetKg) * 100)),
        remainingKg: Math.max(0, targetKg - newCommitted),
        stage: nextStage,
        daysLeft: daysUntil(pool.deadline),
      },
      contribution: {
        id: contribId,
        poolId,
        farmerId,
        committedKg: quantityKg,
        dropOffToken: token,
        stage: "Committed",
        payment: "Pending",
      },
    };
  }

  // 6. ORDERS & PAYMENTS
  if (cleanPath === "orders/list") {
    const orders = db.prepare(`
      SELECT o.*, b.name as buyer_name, f.name as farmer_name, cp.name as collection_point_name
      FROM orders o
      JOIN profiles b ON o.buyer_id = b.id
      JOIN profiles f ON o.farmer_id = f.id
      LEFT JOIN collection_points cp ON o.collection_point_id = cp.id
      ORDER BY o.created_at DESC
    `).all();

    return orders.map(o => ({
      id: o.id,
      listingId: o.listing_id,
      buyerId: o.buyer_id,
      buyerName: o.buyer_name,
      farmerId: o.farmer_id,
      farmerName: o.farmer_name,
      wasteType: o.waste_type,
      quantityKg: Number(o.quantity_kg),
      ratePerUnit: Number(o.rate_per_unit),
      rateUnit: o.rate_unit,
      totalPrice: Math.round(Number(o.total_price_paise) / 100),
      platformFee: Math.round(Number(o.platform_fee_paise) / 100),
      farmerPayout: Math.round(Number(o.farmer_net_paise) / 100),
      collectionPointId: o.collection_point_id,
      collectionPointName: o.collection_point_name || "Collection Point",
      stage: o.stage,
      paymentStatus: o.payment_status,
      dropOffToken: o.dropoff_token,
      createdAt: o.created_at,
    }));
  }

  if (cleanPath === "orders/create") {
    const { listingId, buyer, quantityKg } = body;
    const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId);
    if (!listing) throw new Error("Listing not found");

    const orderId = `ord_${Date.now()}`;
    const buyerId = buyer?.id || "buyer_1";
    const ratePerKg = Number(listing.rate_per_unit) / (KG_PER_UNIT[listing.rate_unit] || 100);
    const totalRupees = Math.round(quantityKg * ratePerKg);
    const totalPaise = totalRupees * 100;
    const feePaise = Math.round(totalPaise * 0.05);
    const netPaise = totalPaise - feePaise;

    // Deduct listing quantity
    const remainingKg = Math.max(0, Number(listing.quantity_kg) - Number(quantityKg));
    db.prepare("UPDATE listings SET quantity_kg = ?, status = ? WHERE id = ?")
      .run(remainingKg, remainingKg === 0 ? "Sold" : listing.status, listingId);

    const token = `TK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    db.prepare(`
      INSERT INTO orders (id, listing_id, buyer_id, farmer_id, waste_type, quantity_kg, rate_per_unit, rate_unit, total_price_paise, platform_fee_paise, farmer_net_paise, collection_point_id, dropoff_token, stage, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ready for Pickup', 'Captured')
    `).run(orderId, listingId, buyerId, listing.farmer_id, listing.waste_type, quantityKg, listing.rate_per_unit, listing.rate_unit, totalPaise, feePaise, netPaise, listing.collection_point_id, token);

    return {
      id: orderId,
      listingId,
      buyerId,
      quantityKg,
      totalPrice: totalRupees,
      platformFee: Math.round(feePaise / 100),
      farmerPayout: Math.round(netPaise / 100),
      stage: "Ready for Pickup",
      paymentStatus: "Captured",
      dropOffToken: token,
      createdAt: new Date().toISOString(),
    };
  }

  if (cleanPath === "payments/create-order" || cleanPath === "paypal-create-order") {
    const { scope, referenceId, amount, idempotencyKey } = body;
    const paymentId = `pay_${Date.now()}`;
    const amountInrPaise = Math.round(Number(amount) * 100);
    const paypalRef = `PP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    db.prepare(`
      INSERT INTO payments (id, scope, reference_id, amount_inr_paise, paypal_order_ref, status, payer_verified)
      VALUES (?, ?, ?, ?, ?, 'Initiated', 0)
    `).run(paymentId, scope, referenceId, amountInrPaise, paypalRef);

    return {
      id: paymentId,
      scope,
      referenceId,
      amount: Math.round(amount),
      currency: "INR",
      paypalOrderRef: paypalRef,
      status: "Initiated",
      payerVerified: false,
      createdAt: new Date().toISOString(),
    };
  }

  if (cleanPath === "payments/confirm" || cleanPath === "paypal-capture-order") {
    const { paymentId, outcome = "approve" } = body;
    const payment = db.prepare("SELECT * FROM payments WHERE id = ?").get(paymentId);
    if (!payment) throw new Error("Payment not found");

    if (outcome === "cancel") {
      db.prepare("UPDATE payments SET status = 'Cancelled' WHERE id = ?").run(paymentId);
      return { ...payment, status: "Cancelled" };
    }

    const captureRef = `CAP-${Math.random().toString(16).substring(2, 8).toUpperCase()}`;
    db.prepare(`
      UPDATE payments SET status = 'Captured', payer_verified = 1, capture_ref = ?, verified_at = datetime('now')
      WHERE id = ?
    `).run(captureRef, paymentId);

    // If pool payment, update pool contributions and add farmer_payables
    if (payment.scope === "pool") {
      db.prepare("UPDATE pool_contributions SET payment = 'Captured', stage = 'Ready for Pickup' WHERE pool_id = ?")
        .run(payment.reference_id);
      db.prepare("UPDATE pools SET stage = 'Closed' WHERE id = ?").run(payment.reference_id);
    }

    return {
      id: paymentId,
      scope: payment.scope,
      referenceId: payment.reference_id,
      amount: Math.round(payment.amount_inr_paise / 100),
      currency: "INR",
      paypalOrderRef: payment.paypal_order_ref,
      captureRef,
      status: "Captured",
      payerVerified: true,
      verifiedAt: new Date().toISOString(),
      createdAt: payment.created_at,
    };
  }

  // 7. PAYOUTS
  if (cleanPath === "payouts/list" || cleanPath === "admin/payables") {
    const rows = db.prepare("SELECT * FROM farmer_payables ORDER BY created_at DESC").all();
    return rows.map(p => ({
      id: p.id,
      poolId: p.pool_id,
      farmerId: p.farmer_id,
      farmerName: p.farmer_name,
      verifiedKg: Number(p.verified_kg),
      sharePercent: Number(p.share_percent),
      gross: Math.round(p.gross_paise / 100),
      fee: Math.round(p.fee_paise / 100),
      net: Math.round(p.net_paise / 100),
      payout: p.payout_status,
      paidAt: p.paid_at,
    }));
  }

  if (cleanPath === "payouts/approve") {
    const { payableId, simulated = false } = body;
    const status = simulated ? "Simulated" : "Completed";
    db.prepare(`
      UPDATE farmer_payables SET payout_status = ?, paid_at = datetime('now') WHERE id = ?
    `).run(status, payableId);

    const p = db.prepare("SELECT * FROM farmer_payables WHERE id = ?").get(payableId);
    return {
      id: p.id,
      poolId: p.pool_id,
      farmerId: p.farmer_id,
      farmerName: p.farmer_name,
      verifiedKg: Number(p.verified_kg),
      sharePercent: Number(p.share_percent),
      gross: Math.round(p.gross_paise / 100),
      fee: Math.round(p.fee_paise / 100),
      net: Math.round(p.net_paise / 100),
      payout: p.payout_status,
      paidAt: p.paid_at,
    };
  }

  // 8. COLLECTION POINTS
  if (cleanPath === "collection-points/list" || cleanPath === "admin/collection-points") {
    const rows = db.prepare("SELECT * FROM collection_points ORDER BY active DESC").all();
    const origin = body.origin || { lat: 28.61, lng: 77.2 };
    return rows.map(c => ({
      id: c.id,
      name: c.name,
      village: c.village,
      district: c.district,
      state: c.state,
      location: { lat: c.lat, lng: c.lng },
      capacityTonnes: Number(c.capacity_tonnes || 100),
      hours: c.hours,
      active: Boolean(c.active),
      dropOffsToday: Number(c.dropoffs_today || 0),
      distanceKm: Math.round(haversineKm(origin, { lat: c.lat, lng: c.lng })),
    }));
  }

  // 9. FORECASTS
  if (cleanPath === "forecasts/list") {
    return db.prepare("SELECT * FROM forecasts").all().map(f => ({
      id: f.id,
      region: f.region,
      season: f.season,
      wasteType: f.waste_type,
      historicalPricePerKg: f.historical_price_per_kg,
      predictedPricePerKg: f.predicted_price_per_kg,
      confidence: f.confidence,
      limitedData: Boolean(f.limited_data),
      harvestPeakStart: f.harvest_peak_start,
      harvestPeakEnd: f.harvest_peak_end,
      sampleCount: f.sample_count,
      explanation: f.explanation,
      trend: f.trend,
    }));
  }

  // 10. NOTIFICATIONS
  if (cleanPath === "notifications/list") {
    return db.prepare("SELECT * FROM notifications ORDER BY created_at DESC").all().map(n => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      body: n.body,
      type: n.type,
      read: Boolean(n.read),
      referenceId: n.reference_id,
      createdAt: n.created_at,
    }));
  }

  if (cleanPath === "notifications/read") {
    db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(body.id);
    return { ok: true };
  }

  if (cleanPath === "notifications/read-all") {
    db.prepare("UPDATE notifications SET read = 1").run();
    return { ok: true };
  }

  // 11. ADMIN
  if (cleanPath === "admin/verifications") {
    return db.prepare("SELECT * FROM industry_verifications ORDER BY submitted_at DESC").all().map(v => ({
      id: v.id,
      industryId: v.industry_id,
      businessName: v.business_name,
      licenseNumber: v.license_number,
      registeredAddress: v.registered_address,
      contactPerson: v.contact_person,
      documents: JSON.parse(v.documents || "[]"),
      status: v.status,
      submittedAt: v.submitted_at,
      decidedAt: v.decided_at,
      reviewedBy: v.reviewed_by,
    }));
  }

  if (cleanPath === "admin/verify-industry") {
    const { id, decision, reason } = body;
    db.prepare("UPDATE industry_verifications SET status = ?, notes = ?, decided_at = datetime('now'), reviewed_by = 'Admin' WHERE id = ?")
      .run(decision, reason || null, id);

    const ver = db.prepare("SELECT * FROM industry_verifications WHERE id = ?").get(id);
    if (decision === "Verified" && ver) {
      db.prepare("UPDATE profiles SET verified = 1 WHERE id = ?").run(ver.industry_id);
    }
    return { id, status: decision };
  }

  if (cleanPath === "admin/users") {
    return db.prepare("SELECT * FROM profiles ORDER BY created_at DESC").all().map(formatProfile);
  }

  if (cleanPath === "audit/list") {
    return db.prepare("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100").all().map(a => ({
      id: a.id,
      at: a.created_at,
      actor: a.actor,
      actorRole: a.actor_role,
      aiPreparedSummary: a.ai_prepared_summary,
      confirmedBy: a.confirmed_by,
      action: a.action,
      reference: a.reference,
      outcome: a.outcome,
    }));
  }

  if (cleanPath === "moderation/list") {
    return db.prepare("SELECT * FROM moderation_flags ORDER BY created_at DESC").all();
  }

  throw new Error(`Endpoint not found: ${cleanPath}`);
}

