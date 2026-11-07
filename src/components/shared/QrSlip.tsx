import { Printer } from "lucide-react";
import type { Order } from "@/types";
import { qrMatrix, qrSvgPath } from "@/lib/qr";
import { formatNumber } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function QrSlip({ order, collectionPointName }: { order: Order; collectionPointName: string }) {
  const payload = `GREENROOTS|${order.id}|${order.farmerId}|${order.quantityKg}kg`;
  const grid = qrMatrix(payload);
  const code = `GR-${order.id.slice(-6).toUpperCase()}`;
  const size = grid.length * 4;

  return (
    <div className="overflow-hidden rounded-field border-[1.5px] border-line bg-surface">
      <div className="flex items-center justify-between border-b border-dashed border-line bg-canvas px-4 py-2.5">
        <p className="text-sm font-bold text-ink">Drop-off slip</p>
        <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted">
          Show at collection point
        </span>
      </div>
      <div className="flex gap-4 p-4">
        <div className="shrink-0 rounded-lg border border-line bg-white p-1.5">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`QR code for verification code ${code}`}>
            <rect width={size} height={size} fill="#fff" />
            <path d={qrSvgPath(grid)} fill="#0F172A" />
          </svg>
        </div>
        <div className="min-w-0 space-y-1.5 text-[13px]">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Verification code</p>
          <p className="num text-lg font-bold text-ink">{code}</p>
          <p className="font-semibold text-ink">{order.wasteType.replace("_", " ")}</p>
          <p className="num text-muted">{formatNumber(order.quantityKg)} kg</p>
          <p className="text-muted">{collectionPointName}</p>
          <p className="text-muted">Farmer: {order.farmerName}</p>
          <p className="text-muted">{formatDate(order.createdAt)}</p>
        </div>
      </div>
      <div className="border-t border-dashed border-line px-4 py-2.5">
        <p className="text-[11px] leading-snug text-muted">
          The collection point checks the accepted weight. Your final payout uses that verified quantity, not the declared quantity.
        </p>
      </div>
      <div className="no-print border-t border-line px-4 py-2.5">
        <Button variant="outline" size="sm" onClick={() => window.print()} className="w-full">
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print slip
        </Button>
      </div>
    </div>
  );
}
