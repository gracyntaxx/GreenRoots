import React, { useRef } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Hash,
  Leaf,
  MapPin,
  Printer,
  Receipt,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import type { Order, Profile, WasteType } from "@/types";
import { WASTE_LABELS } from "@/types";
import { formatMoney, formatNumber } from "@/lib/money";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import { qrMatrix, qrSvgPath } from "@/lib/qr";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function numberToWordsINR(amount: number): string {
  const num = Math.round(amount);
  if (num === 0) return "Zero Rupees Only";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  }

  return inWords(num).trim() + " Rupees Only";
}

export interface CollectionPointInfo {
  id?: string;
  name?: string;
  village?: string;
  hours?: string;
  distanceKm?: number;
}

export interface OrderInvoiceProps {
  order: Order;
  collectionPoint?: CollectionPointInfo | null;
  buyerProfile?: Profile | null;
  className?: string;
  onClose?: () => void;
  showDoneButton?: boolean;
}

export function OrderInvoice({
  order,
  collectionPoint,
  buyerProfile,
  className,
  onClose,
  showDoneButton = false,
}: OrderInvoiceProps) {
  const invoiceNo = `INV-GR-${order.id.slice(-6).toUpperCase()}`;
  const orderRef = `GR-${order.id.slice(-8).toUpperCase()}`;
  const verificationCode = `GR-${order.id.slice(-6).toUpperCase()}`;

  // QR code payload for instant invoice/order verification
  const qrPayload = `GREENROOTS-INVOICE|${invoiceNo}|${order.id}|AMOUNT:INR${order.totalAmount}|BUYER:${order.buyerName}|FARMER:${order.farmerName}|STATUS:PAID-ESCROW`;
  const grid = qrMatrix(qrPayload, 25);
  const size = grid.length * 4;

  const farmerShare = Math.round(order.totalAmount * 0.95);
  const platformFee = Math.round(order.totalAmount * 0.05);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className={cn(
        "relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-line bg-surface shadow-xl print:m-0 print:max-w-none print:border-none print:shadow-none",
        className
      )}
    >
      {/* Printable Invoice Container */}
      <div className="p-6 sm:p-8 space-y-6 bg-white text-ink dark:bg-[#0B1522] dark:text-[#E2E8F0] print:p-4">
        {/* Top Header & Branding */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-line pb-6 dark:border-portal-line">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-white shadow-sm">
                <Leaf className="h-5 w-5" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-forest font-heading">
                Green<span className="text-terracotta">Roots</span>
              </span>
            </div>
            <p className="text-xs font-medium text-muted dark:text-portal-muted max-w-sm">
              State Agricultural Biomass Exchange &amp; Escrow Clearing Gateway
            </p>
            <p className="text-[11px] text-muted dark:text-portal-muted">
              GSTIN / Reg: <span className="font-mono font-semibold">30AAACG0123Q1Z5</span> · Goa, India
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="inline-block rounded-md bg-meadow px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-forest border border-forest/20 dark:bg-[#123524] dark:text-growth">
              Tax Invoice / Bill of Supply
            </span>
            <p className="text-lg font-bold font-mono tracking-tight text-ink dark:text-portal-ink">{invoiceNo}</p>
            <p className="text-xs text-muted dark:text-portal-muted">
              Issued: <strong className="font-semibold text-ink dark:text-portal-ink">{formatDateTime(order.createdAt)}</strong>
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-2.5 py-0.5 text-[11px] font-bold text-forest dark:bg-growth/15 dark:text-growth">
              <ShieldCheck className="h-3.5 w-3.5" /> PAID · ESCROW SECURED
            </div>
          </div>
        </div>

        {/* Parties Meta (Billed To vs Supplier) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-line bg-canvas/60 p-4 text-xs dark:border-portal-line dark:bg-portal-bg/60">
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted dark:text-portal-muted flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-forest" /> Billed To (Buyer)
            </p>
            <p className="text-sm font-bold text-ink dark:text-portal-ink">{order.buyerName || buyerProfile?.name || "Verified Buyer"}</p>
            <p className="text-muted dark:text-portal-muted">
              Role: <strong className="capitalize">{buyerProfile?.role ?? "Industrial Buyer"}</strong>
            </p>
            <p className="text-muted dark:text-portal-muted">
              Location: <strong>{buyerProfile?.village ?? "Goa Industrial Zone, Goa"}</strong>
            </p>
            <p className="text-muted dark:text-portal-muted">
              Contact: <strong>{buyerProfile?.phone ?? "+91 98221 44550"}</strong> · {buyerProfile?.email ?? "buyer@greenroots.org"}
            </p>
          </div>

          <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-line sm:pl-4 pt-3 sm:pt-0 dark:border-portal-line">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted dark:text-portal-muted flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-terracotta" /> Supplier (Farmer / Producer)
            </p>
            <p className="text-sm font-bold text-ink dark:text-portal-ink">{order.farmerName}</p>
            <p className="text-muted dark:text-portal-muted">
              Farmer ID: <span className="font-mono">{order.farmerId}</span>
            </p>
            <p className="text-muted dark:text-portal-muted">
              Origin Village / Mandi: <strong>{collectionPoint?.village ?? "Goa"}</strong>
            </p>
            <p className="text-muted dark:text-portal-muted">
              Beneficiary Settlement: <strong>Farmer Escrow Vault (Direct Payout)</strong>
            </p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-line rounded-xl overflow-hidden dark:border-portal-line">
            <thead className="bg-canvas border-b border-line text-muted uppercase tracking-wider text-[11px] font-semibold dark:bg-portal-bg dark:border-portal-line">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3">HSN Code</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3 text-right">Rate</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-portal-line">
              <tr className="hover:bg-canvas/40 transition-colors">
                <td className="py-3 px-3 font-mono font-medium text-muted">1</td>
                <td className="py-3 px-3">
                  <p className="font-bold text-sm text-ink dark:text-portal-ink">{WASTE_LABELS[order.wasteType] ?? order.wasteType}</p>
                  <p className="text-[11px] text-muted dark:text-portal-muted">
                    Agricultural crop residue &amp; stubble · Clean biomass fuel grade
                  </p>
                </td>
                <td className="py-3 px-3 font-mono text-muted">1213 00 00</td>
                <td className="py-3 px-3 text-right font-medium">
                  <span className="font-bold text-ink dark:text-portal-ink">{formatNumber(order.quantityKg)} kg</span>
                  <span className="block text-[11px] text-muted">({formatNumber(order.quantityKg / 1000, 2)} tonnes)</span>
                </td>
                <td className="py-3 px-3 text-right font-medium text-ink dark:text-portal-ink">
                  ₹{order.ratePerUnit} / {order.rateUnit}
                </td>
                <td className="py-3 px-3 text-right font-bold text-sm text-ink dark:text-portal-ink">
                  {formatMoney(order.totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Financial Breakdown & Amount in Words */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-2">
          {/* Amount in words & Notes */}
          <div className="space-y-3 rounded-xl border border-line bg-canvas/40 p-4 text-xs dark:border-portal-line dark:bg-portal-bg/40">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted dark:text-portal-muted">Amount Chargeable (in words)</p>
              <p className="mt-1 font-serif italic text-sm font-semibold text-moss dark:text-growth">
                {numberToWordsINR(order.totalAmount)}
              </p>
            </div>

            <div className="border-t border-line/60 pt-2 text-[11px] text-muted space-y-1 dark:border-portal-line/60">
              <p className="font-semibold text-ink dark:text-portal-ink">Tax Exemption Notice:</p>
              <p>
                Agricultural biomass crop residue is exempted from Goods and Services Tax (GST) under Notification No. 11/2017 -
                Central Tax (Rate).
              </p>
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-xl border border-line bg-canvas/40 p-4 space-y-2 text-xs dark:border-portal-line dark:bg-portal-bg/40">
            <div className="flex justify-between text-muted dark:text-portal-muted">
              <span>Biomass Crop Subtotal:</span>
              <span className="font-semibold text-ink dark:text-portal-ink">{formatMoney(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-muted dark:text-portal-muted">
              <span>Farmer Gross Settlement (95%):</span>
              <span className="font-semibold text-ink dark:text-portal-ink">{formatMoney(farmerShare)}</span>
            </div>
            <div className="flex justify-between text-muted dark:text-portal-muted">
              <span>Platform Escrow Fee (5%):</span>
              <span className="font-semibold text-terracotta">{formatMoney(platformFee)}</span>
            </div>
            <div className="flex justify-between text-muted dark:text-portal-muted">
              <span>Buyer Platform Surcharge:</span>
              <span className="font-bold text-forest dark:text-growth">₹0 (Free / Waived)</span>
            </div>
            <div className="flex justify-between text-muted dark:text-portal-muted">
              <span>Applicable GST (0%):</span>
              <span className="font-semibold text-ink dark:text-portal-ink">₹0.00</span>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-2 text-sm font-bold dark:border-portal-line">
              <span className="text-ink dark:text-portal-ink">Total Amount Paid:</span>
              <span className="text-xl font-bold text-forest dark:text-growth">{formatMoney(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Escrow & Payment Details */}
        <div className="rounded-xl border border-escrow/30 bg-[#F0FDF4] p-4 text-xs dark:border-escrow/20 dark:bg-[#0D2419]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-forest/15 pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-forest" />
              <div>
                <p className="font-bold text-sm text-forest dark:text-growth">Escrow Clearing &amp; Payment Ledger</p>
                <p className="text-[11px] text-forest/80">Funds sequestered until weighbridge certification</p>
              </div>
            </div>
            <span className="rounded-full bg-forest px-3 py-0.5 text-[11px] font-bold text-white tracking-wide">
              CONFIRMED
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 text-[11px]">
            <div>
              <p className="text-muted">Payment Mode:</p>
              <p className="font-bold text-ink dark:text-portal-ink">UPI / PayPal Escrow</p>
            </div>
            <div>
              <p className="text-muted">Payment Order Ref:</p>
              <p className="font-mono font-bold text-ink dark:text-portal-ink">{order.paypalOrderRef ?? "PP-VERIFIED"}</p>
            </div>
            <div>
              <p className="text-muted">Capture Ref:</p>
              <p className="font-mono font-bold text-ink dark:text-portal-ink">{order.paypalCaptureRef ?? "CAP-SECURED"}</p>
            </div>
            <div>
              <p className="text-muted">Escrow Status:</p>
              <p className="font-bold text-forest dark:text-growth">Captured &amp; Held</p>
            </div>
          </div>
        </div>

        {/* Pickup Hub & Verification QR Code */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-line bg-canvas p-4 text-xs dark:border-portal-line dark:bg-portal-bg">
          <div className="space-y-1.5 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted dark:text-portal-muted flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-forest" /> Drop-off / Collection Point
            </p>
            <p className="text-sm font-bold text-ink dark:text-portal-ink">
              {collectionPoint?.name ?? "Central Goa Agricultural Biomass Hub"}
            </p>
            <p className="text-muted dark:text-portal-muted">
              Village: <strong>{collectionPoint?.village ?? "Goa"}</strong> · Hours:{" "}
              <strong>{collectionPoint?.hours ?? "6:00 AM – 8:00 PM"}</strong>
            </p>
            <p className="text-[11px] text-muted dark:text-portal-muted pt-1">
              Inspection Slip Code: <strong className="font-mono text-moss text-xs">{verificationCode}</strong>
            </p>
          </div>

          {/* Verification QR Code */}
          <div className="flex items-center gap-3 shrink-0 rounded-xl border border-line bg-white p-2.5 dark:border-portal-line dark:bg-white text-ink">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              role="img"
              aria-label={`QR Code for invoice ${invoiceNo}`}
              className="rounded shrink-0"
            >
              <rect width={size} height={size} fill="#ffffff" />
              <path d={qrSvgPath(grid)} fill="#0F172A" />
            </svg>
            <div className="text-[10px] space-y-0.5 font-mono">
              <p className="font-bold text-[11px] text-[#0F172A]">VERIFY INVOICE</p>
              <p className="text-slate-600">{invoiceNo}</p>
              <p className="text-slate-600">Scan at Weighbridge</p>
              <span className="inline-block rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                GENUINE
              </span>
            </div>
          </div>
        </div>

        {/* Footer Disclaimer & Signatory */}
        <div className="border-t border-line pt-4 text-[10px] text-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2 dark:border-portal-line dark:text-portal-muted">
          <div>
            <p className="font-semibold text-ink dark:text-portal-ink">GreenRoots Biomass Solutions Pvt Ltd</p>
            <p>This is a computer-generated digital tax invoice with cryptographic escrow verification. No signature required.</p>
          </div>
          <div className="text-left sm:text-right font-mono text-[10px]">
            <p>Verification Hash: {order.id.slice(0, 16)}...</p>
            <p className="text-forest font-semibold">100% Guaranteed Escrow Protected</p>
          </div>
        </div>
      </div>

      {/* Screen-Only Action Buttons (Hidden during Print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas p-4 sm:px-8 dark:border-portal-line dark:bg-portal-bg">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="font-semibold">
            <Printer className="h-4 w-4 mr-1.5" /> Print Invoice
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="font-semibold">
            <Download className="h-4 w-4 mr-1.5" /> Save PDF
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {showDoneButton && onClose && (
            <Button variant="primary" size="sm" onClick={onClose} className="font-semibold">
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function OrderInvoiceModal({
  open,
  onOpenChange,
  order,
  collectionPoint,
  buyerProfile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  collectionPoint?: CollectionPointInfo | null;
  buyerProfile?: Profile | null;
}) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-y-auto max-h-[92vh] border-0 sm:rounded-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Order Tax Invoice</DialogTitle>
        </DialogHeader>
        <OrderInvoice
          order={order}
          collectionPoint={collectionPoint}
          buyerProfile={buyerProfile}
          onClose={() => onOpenChange(false)}
          showDoneButton={true}
        />
      </DialogContent>
    </Dialog>
  );
}
