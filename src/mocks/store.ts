import type {
  AiActionAudit,
  AppNotification,
  CollectionPoint,
  FarmerPayable,
  Forecast,
  IndustryVerification,
  Listing,
  ListingDraft,
  ModerationFlag,
  Order,
  Payment,
  Pool,
  PoolContribution,
  Profile,
  Requirement,
} from "@/types";
import { KG_PER_UNIT } from "@/lib/units";
import { commissionFor, netAfterCommission } from "@/lib/fees";
import { clamp, sleep, uid } from "@/lib/utils";
import {
  AUDIT_LOG,
  COLLECTION_POINTS,
  CONTRIBUTIONS,
  DEMO_ACCOUNTS,
  FLAGS,
  FORECASTS,
  LISTINGS,
  NOTIFICATIONS,
  ORDERS,
  PAYABLES,
  PAYMENTS,
  POOLS,
  PROFILES,
  REQUIREMENTS,
  VERIFICATIONS,
} from "./seed";

export interface MockState {
  profiles: Profile[];
  listings: Listing[];
  requirements: Requirement[];
  pools: Pool[];
  contributions: PoolContribution[];
  collectionPoints: CollectionPoint[];
  orders: Order[];
  payments: Payment[];
  payables: FarmerPayable[];
  forecasts: Forecast[];
  notifications: AppNotification[];
  verifications: IndustryVerification[];
  flags: ModerationFlag[];
  audit: AiActionAudit[];
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function freshState(): MockState {
  return {
    profiles: clone(PROFILES),
    listings: clone(LISTINGS),
    requirements: clone(REQUIREMENTS),
    pools: clone(POOLS),
    contributions: clone(CONTRIBUTIONS),
    collectionPoints: clone(COLLECTION_POINTS),
    orders: clone(ORDERS),
    payments: clone(PAYMENTS),
    payables: clone(PAYABLES),
    forecasts: clone(FORECASTS),
    notifications: clone(NOTIFICATIONS),
    verifications: clone(VERIFICATIONS),
    flags: clone(FLAGS),
    audit: clone(AUDIT_LOG),
  };
}

let state: MockState = freshState();

const config = {
  failureRate: 0,
  offline: false,
  latencyMin: 400,
  latencyMax: 900,
};

export function setMockConfig(patch: Partial<typeof config>) {
  Object.assign(config, patch);
}
export function getMockConfig() {
  return { ...config };
}

export function getState() {
  return state;
}

export function resetMockState() {
  state = freshState();
  emit({ type: "reset" });
}

/** Simulate a network round trip. Mutations never run when the client is "offline". */
export async function withLatency<T>(fn: () => T | Promise<T>, opts?: { mutation?: boolean }): Promise<T> {
  const delay = config.latencyMin + Math.random() * (config.latencyMax - config.latencyMin);
  await sleep(delay);
  if (config.offline) {
    throw new MockError("You appear to be offline. Reconnect to continue.", "OFFLINE");
  }
  if (config.failureRate > 0 && Math.random() < config.failureRate) {
    throw new MockError("The service did not respond. Please try again.", "TIMEOUT");
  }
  return fn();
}

export class MockError extends Error {
  code: string;
  constructor(message: string, code = "UNKNOWN") {
    super(message);
    this.name = "MockError";
    this.code = code;
  }
}

/* ------------------------------ realtime ------------------------------ */

type StoreEvent =
  | { type: "reset" }
  | { type: "pool-updated"; poolId: string }
  | { type: "notification"; id: string };

type Listener = (e: StoreEvent) => void;
const listeners = new Set<Listener>();

export function subscribeStore(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(e: StoreEvent) {
  listeners.forEach((l) => l(e));
}

const TICK_MS = 8000;
let tickTimer: ReturnType<typeof setInterval> | null = null;

export function startRealtime() {
  if (tickTimer) return;
  tickTimer = setInterval(() => {
    if (config.offline) return;
    const open = state.pools.filter(
      (p) => p.status === "Open" && p.committedKg < p.targetKg
    );
    if (!open.length) return;
    const pool = open[Math.floor(Math.random() * open.length)];
    const remaining = pool.targetKg - pool.committedKg;
    const qty = Math.min(remaining, (1 + Math.floor(Math.random() * 5)) * 500);
    const farmers = state.profiles.filter((p) => p.role === "farmer");
    const farmer = farmers[Math.floor(Math.random() * farmers.length)];
    const ratePerKg = pool.ratePerUnit / KG_PER_UNIT[pool.rateUnit];
    const cp = state.collectionPoints.find((c) => c.active) ?? state.collectionPoints[0];
    const c: PoolContribution = {
      id: uid("pc"),
      poolId: pool.id,
      farmerId: farmer.id,
      farmerName: farmer.name,
      farmerVillage: farmer.village,
      farmerReputation: farmer.reputation,
      committedKg: qty,
      agreedRatePerKg: ratePerKg,
      collectionPointId: cp.id,
      fulfilment: "Pending",
      payment: "Initiated",
      payout: "Not Yet Due",
      createdAt: new Date().toISOString(),
    };
    state.contributions.push(c);
    pool.committedKg = Math.min(pool.targetKg, pool.committedKg + qty);
    pool.contributionCount += 1;
    if (pool.committedKg >= pool.targetKg) {
      pool.status = "Ready for Pickup";
      state.contributions
        .filter((x) => x.poolId === pool.id && x.fulfilment === "Pending")
        .forEach((x) => (x.fulfilment = "Ready for Pickup"));
    }
    const note: AppNotification = {
      id: uid("n"),
      group: "Pool",
      title: `${farmer.name} committed ${qty.toLocaleString("en-IN")} kg`,
      body: `${pool.industryName} · ${pool.village} pool is now ${Math.round((pool.committedKg / pool.targetKg) * 100)}% full.`,
      at: new Date().toISOString(),
      read: false,
      link: `/pools/${pool.id}`,
    };
    state.notifications.unshift(note);
    emit({ type: "pool-updated", poolId: pool.id });
    emit({ type: "notification", id: note.id });
  }, TICK_MS);
}

export function stopRealtime() {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = null;
}

/* ------------------------------ lookups ------------------------------ */

export function findProfile(id: string) {
  return state.profiles.find((p) => p.id === id);
}

export function findPool(id: string) {
  return state.pools.find((p) => p.id === id);
}

export function contributionsForPool(poolId: string) {
  return state.contributions.filter((c) => c.poolId === poolId);
}

export function payablesForPool(poolId: string) {
  return state.payables.filter((p) => p.poolId === poolId);
}

export function demoAccounts() {
  return DEMO_ACCOUNTS;
}

/* ------------------------------ mutations ------------------------------ */

const idempotency = new Map<string, unknown>();

export function idempotent<T>(key: string, fn: () => T): T {
  if (idempotency.has(key)) return idempotency.get(key) as T;
  const result = fn();
  idempotency.set(key, result);
  return result;
}

export function clearIdempotency() {
  idempotency.clear();
}

export function addListing(input: {
  farmer: Profile;
  draft: ListingDraft;
  collectionPointId: string;
}): Listing {
  const { farmer, draft } = input;
  const cp = state.collectionPoints.find((c) => c.id === input.collectionPointId);
  const qty = draft.quantity ?? 0;
  const unit = draft.unit ?? "kg";
  const rate = draft.rate ?? 0;
  const rateUnit = draft.rateUnit ?? unit;
  const listing: Listing = {
    id: uid("listing"),
    farmerId: farmer.id,
    farmerName: farmer.name,
    farmerVillage: farmer.village,
    farmerReputation: farmer.reputation,
    wasteType: draft.wasteType ?? "paddy_straw",
    quantityKg: qty * KG_PER_UNIT[unit],
    unit,
    ratePerUnit: rate,
    rateUnit,
    location: cp?.location ?? farmer.location,
    village: cp?.village ?? farmer.village,
    collectionPointId: input.collectionPointId,
    status: "Active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: draft.rawText ? "voice" : "manual",
    aiConfidence: Math.min(...Object.values(draft.confidence).filter((n) => n > 0), 0.95),
    notes: draft.notes,
  };
  state.listings.unshift(listing);
  state.audit.unshift({
    id: uid("aud"),
    at: new Date().toISOString(),
    actor: farmer.name,
    actorRole: "farmer",
    aiPreparedSummary: `Listing draft: ${qty} ${unit} ${listing.wasteType.replace("_", " ")} at ₹${rate}/${rateUnit}`,
    confirmedBy: farmer.name,
    action: "Listing published",
    reference: listing.id,
    outcome: "Active",
  });
  return listing;
}

export function updateListing(id: string, patch: Partial<Listing>): Listing {
  const l = state.listings.find((x) => x.id === id);
  if (!l) throw new MockError("Listing not found", "NOT_FOUND");
  Object.assign(l, patch, { updatedAt: new Date().toISOString() });
  return l;
}

export function deleteListing(id: string) {
  state.listings = state.listings.filter((l) => l.id !== id);
  return { ok: true };
}

export function createRequirement(input: {
  industry: Profile;
  wasteType: Requirement["wasteType"];
  targetKg: number;
  ratePerUnit: number;
  rateUnit: Requirement["rateUnit"];
  deadline: string;
  village: string;
  location: Requirement["location"];
  notes?: string;
  moisturePreference?: string;
}): { requirement: Requirement; pool: Pool } {
  if (!input.industry.verified) {
    throw new MockError("Your industry account is awaiting admin verification.", "FORBIDDEN");
  }
  const id = uid("req");
  const poolId = uid("pool");
  const ratePerKg = input.ratePerUnit / KG_PER_UNIT[input.rateUnit];
  const req: Requirement = {
    id,
    industryId: input.industry.id,
    industryName: input.industry.name,
    industryVerified: input.industry.verified,
    wasteType: input.wasteType,
    targetKg: input.targetKg,
    ratePerUnit: input.ratePerUnit,
    rateUnit: input.rateUnit,
    deadline: input.deadline,
    location: input.location,
    village: input.village,
    notes: input.notes,
    moisturePreference: input.moisturePreference,
    status: "Open",
    createdAt: new Date().toISOString(),
    poolId,
  };
  const pool: Pool = {
    id: poolId,
    requirementId: id,
    industryId: input.industry.id,
    industryName: input.industry.name,
    industryVerified: input.industry.verified,
    wasteType: input.wasteType,
    targetKg: input.targetKg,
    committedKg: 0,
    ratePerUnit: input.ratePerUnit,
    rateUnit: input.rateUnit,
    deadline: input.deadline,
    location: input.location,
    village: input.village,
    status: "Open",
    radiusKm: 35,
    expanded: false,
    contributionCount: 0,
    createdAt: new Date().toISOString(),
  };
  state.requirements.unshift(req);
  state.pools.unshift(pool);
  state.audit.unshift({
    id: uid("aud"),
    at: new Date().toISOString(),
    actor: input.industry.name,
    actorRole: "industry",
    aiPreparedSummary: `Requirement: ${input.targetKg} kg ${input.wasteType.replace("_", " ")} at ₹${input.ratePerUnit}/${input.rateUnit}, ${input.village}`,
    confirmedBy: input.industry.name,
    action: "Requirement published",
    reference: id,
    outcome: "Open",
  });
  emit({ type: "pool-updated", poolId });
  return { requirement: req, pool };
}

export function commitToPool(input: {
  pool: Pool;
  farmer: Profile;
  quantityKg: number;
  collectionPointId: string;
}): { pool: Pool; contribution: PoolContribution } {
  const pool = state.pools.find((p) => p.id === input.pool.id);
  if (!pool) throw new MockError("Pool not found", "NOT_FOUND");
  if (pool.status !== "Open") throw new MockError("This pool is no longer accepting commitments.", "POOL_CLOSED");
  const remaining = pool.targetKg - pool.committedKg;
  if (remaining <= 0) throw new MockError("This pool is full.", "POOL_FULL");
  const qty = clamp(Math.round(input.quantityKg), 1, remaining);
  const ratePerKg = pool.ratePerUnit / KG_PER_UNIT[pool.rateUnit];
  const c: PoolContribution = {
    id: uid("pc"),
    poolId: pool.id,
    farmerId: input.farmer.id,
    farmerName: input.farmer.name,
    farmerVillage: input.farmer.village,
    farmerReputation: input.farmer.reputation,
    committedKg: qty,
    agreedRatePerKg: ratePerKg,
    collectionPointId: input.collectionPointId,
    fulfilment: "Pending",
    payment: "Initiated",
    payout: "Not Yet Due",
    createdAt: new Date().toISOString(),
  };
  state.contributions.push(c);
  pool.committedKg += qty;
  pool.contributionCount += 1;
  if (pool.committedKg >= pool.targetKg) {
    pool.status = "Ready for Pickup";
    state.contributions
      .filter((x) => x.poolId === pool.id && x.fulfilment === "Pending")
      .forEach((x) => (x.fulfilment = "Ready for Pickup"));
  }
  state.audit.unshift({
    id: uid("aud"),
    at: new Date().toISOString(),
    actor: input.farmer.name,
    actorRole: "farmer",
    aiPreparedSummary: `Pool commitment: ${qty} kg to ${pool.industryName}`,
    confirmedBy: input.farmer.name,
    action: "Pool commitment",
    reference: c.id,
    outcome: "Pending",
  });
  emit({ type: "pool-updated", poolId: pool.id });
  return { pool, contribution: c };
}

export function expandPool(poolId: string, km: number) {
  const pool = findPool(poolId);
  if (!pool) throw new MockError("Pool not found", "NOT_FOUND");
  pool.expanded = true;
  pool.expandedToKm = km;
  pool.radiusKm = km;
  const req = state.requirements.find((r) => r.id === pool.requirementId);
  if (req) req.status = "Open";
  state.audit.unshift({
    id: uid("aud"),
    at: new Date().toISOString(),
    actor: pool.industryName,
    actorRole: "industry",
    aiPreparedSummary: `Area expansion suggestion to ${km} km`,
    confirmedBy: "Industry",
    action: "Area expansion approved",
    reference: pool.id,
    outcome: `Radius ${km} km`,
  });
  emit({ type: "pool-updated", poolId });
  return pool;
}

export function extendDeadline(poolId: string, deadline: string) {
  const pool = findPool(poolId);
  if (!pool) throw new MockError("Pool not found", "NOT_FOUND");
  pool.deadline = deadline;
  const req = state.requirements.find((r) => r.id === pool.requirementId);
  if (req) req.deadline = deadline;
  emit({ type: "pool-updated", poolId });
  return pool;
}

export function createOrder(input: {
  listing: Listing;
  buyer: Profile;
  quantityKg: number;
  payment: Payment;
}): Order {
  const ratePerKg = input.listing.ratePerUnit / KG_PER_UNIT[input.listing.rateUnit];
  const total = Math.round(input.quantityKg * ratePerKg);
  const order: Order = {
    id: uid("order"),
    listingId: input.listing.id,
    buyerId: input.buyer.id,
    buyerName: input.buyer.name,
    farmerId: input.listing.farmerId,
    farmerName: input.listing.farmerName,
    wasteType: input.listing.wasteType,
    quantityKg: input.quantityKg,
    ratePerUnit: input.listing.ratePerUnit,
    rateUnit: input.listing.rateUnit,
    totalAmount: total,
    collectionPointId: input.listing.collectionPointId,
    fulfilment: "Pending",
    payment: "Captured",
    payout: "Not Yet Due",
    paypalOrderRef: input.payment.paypalOrderRef,
    paypalCaptureRef: input.payment.paypalCaptureRef,
    createdAt: new Date().toISOString(),
    timeline: [
      { id: uid("t"), at: new Date().toISOString(), label: "Order placed", detail: "Buyer confirmed the order", state: "done" },
      { id: uid("t"), at: new Date().toISOString(), label: "Payment captured", detail: "Verified directly with PayPal Sandbox", state: "done" },
      { id: uid("t"), at: "", label: "Awaiting drop-off", detail: "Farmer has not delivered yet", state: "current" },
      { id: uid("t"), at: "", label: "Payout to farmer", detail: "Due after verified delivery", state: "upcoming" },
    ],
  };
  state.orders.unshift(order);
  input.listing.status = input.quantityKg >= input.listing.quantityKg ? "Sold" : "Reserved";
  state.payments.unshift(input.payment);
  state.notifications.unshift({
    id: uid("n"),
    group: "Order",
    title: "New order received",
    body: `${input.buyer.name} ordered ${input.quantityKg} kg ${input.listing.wasteType.replace("_", " ")}.`,
    at: new Date().toISOString(),
    read: false,
    link: `/orders/${order.id}`,
  });
  return order;
}

export function createPaymentRecord(input: {
  scope: "order" | "pool";
  referenceId: string;
  amount: number;
  paypalOrderRef: string;
  status: Payment["status"];
  idempotencyKey: string;
}): Payment {
  return idempotent(input.idempotencyKey, () => {
    const existing = state.payments.find((p) => p.paypalOrderRef === input.paypalOrderRef);
    if (existing) return existing;
    const nowIso = new Date().toISOString();
    const p: Payment = {
      id: uid("pay"),
      scope: input.scope,
      referenceId: input.referenceId,
      amount: input.amount,
      status: input.status,
      paypalOrderRef: input.paypalOrderRef,
      createdAt: nowIso,
      updatedAt: nowIso,
      history: [{ at: nowIso, status: input.status, note: "PayPal order created in sandbox" }],
    };
    state.payments.unshift(p);
    return p;
  });
}

export function updatePaymentStatus(
  paymentId: string,
  status: Payment["status"],
  note: string,
  captureRef?: string
): Payment {
  const p = state.payments.find((x) => x.id === paymentId);
  if (!p) throw new MockError("Payment not found", "NOT_FOUND");
  p.status = status;
  p.updatedAt = new Date().toISOString();
  if (captureRef) p.paypalCaptureRef = captureRef;
  p.history.push({ at: p.updatedAt, status, note });
  if (p.scope === "order") {
    const o = state.orders.find((x) => x.id === p.referenceId);
    if (o) {
      o.payment = status;
      o.paypalOrderRef = p.paypalOrderRef;
      if (captureRef) o.paypalCaptureRef = captureRef;
      o.timeline.unshift({
        id: uid("t"),
        at: p.updatedAt,
        label: `Payment ${status.toLowerCase()}`,
        detail: note,
        state: status === "Captured" ? "done" : status === "Failed" || status === "Cancelled" ? "error" : "current",
      });
    }
  } else {
    state.contributions
      .filter((c) => c.poolId === p.referenceId)
      .forEach((c) => {
        if (status === "Captured") c.payment = "Captured";
        else if (status === "Approved") c.payment = "Approved";
        else if (status === "Failed") c.payment = "Failed";
        else if (status === "Cancelled") c.payment = "Cancelled";
      });
  }
  return p;
}

export function approvePayout(payableId: string, simulated = false) {
  const payable = state.payables.find((p) => p.id === payableId);
  if (!payable) throw new MockError("Payable not found", "NOT_FOUND");
  payable.payout = simulated ? "Simulated" : "Completed";
  payable.simulated = simulated;
  const contribution = state.contributions.find(
    (c) => c.farmerId === payable.farmerId && c.poolId === payable.poolId
  );
  if (contribution) contribution.payout = payable.payout;
  state.audit.unshift({
    id: uid("aud"),
    at: new Date().toISOString(),
    actor: "Priya Menon",
    actorRole: "admin",
    aiPreparedSummary: `Payout prepared for ${payable.farmerName}: ₹${payable.net.toLocaleString("en-IN")}`,
    confirmedBy: "Priya Menon",
    action: simulated ? "Payout simulated" : "Payout approved",
    reference: payable.id,
    outcome: payable.payout,
  });
  return payable;
}

export function decideFlag(flagId: string, decision: ModerationFlag["status"], reason: string) {
  const flag = state.flags.find((f) => f.id === flagId);
  if (!flag) throw new MockError("Flag not found", "NOT_FOUND");
  flag.status = decision;
  state.audit.unshift({
    id: uid("aud"),
    at: new Date().toISOString(),
    actor: "Priya Menon",
    actorRole: "admin",
    aiPreparedSummary: flag.evidence,
    confirmedBy: "Priya Menon",
    action: `Moderation: ${decision}`,
    reference: flag.id,
    outcome: reason,
  });
  return flag;
}

export function decideVerification(id: string, decision: "Verified" | "Rejected", reason?: string) {
  const v = state.verifications.find((x) => x.id === id);
  if (!v) throw new MockError("Verification not found", "NOT_FOUND");
  v.status = decision;
  v.rejectionReason = reason;
  const profile = state.profiles.find((p) => p.id === v.industryId);
  if (profile) profile.verified = decision === "Verified";
  state.audit.unshift({
    id: uid("aud"),
    at: new Date().toISOString(),
    actor: "Priya Menon",
    actorRole: "admin",
    aiPreparedSummary: `Verification review for ${v.businessName}`,
    confirmedBy: "Priya Menon",
    action: `Industry ${decision.toLowerCase()}`,
    reference: v.id,
    outcome: decision,
  });
  return v;
}

export function addPayablesForPool(poolId: string) {
  const pool = findPool(poolId);
  if (!pool) return [];
  const existing = state.payables.filter((p) => p.poolId === poolId);
  if (existing.length) return existing;
  const created = state.contributions
    .filter((c) => c.poolId === poolId)
    .map((c) => {
      const accepted = c.acceptedKg ?? c.committedKg;
      const gross = Math.round(accepted * c.agreedRatePerKg);
      const commission = commissionFor(gross);
      const payout: FarmerPayable["payout"] = c.payout === "Not Yet Due" ? "Pending" : c.payout;
      c.payout = payout;
      const p: FarmerPayable = {
        id: uid("payable"),
        poolId,
        poolLabel: `${pool.wasteType.replace("_", " ")} pool · ${pool.village}`,
        farmerId: c.farmerId,
        farmerName: c.farmerName,
        farmerMasked: `${c.farmerName.slice(0, 1)} ${c.farmerId.slice(-2)}`,
        acceptedKg: accepted,
        agreedRatePerKg: c.agreedRatePerKg,
        gross,
        commission,
        net: netAfterCommission(gross),
        payout,
      };
      state.payables.push(p);
      return p;
    });
  return created;
}

export function updateNotificationRead(id: string, read: boolean) {
  const n = state.notifications.find((x) => x.id === id);
  if (n) n.read = read;
  return n;
}

export function markAllNotificationsRead() {
  state.notifications.forEach((n) => (n.read = true));
  return state.notifications;
}
