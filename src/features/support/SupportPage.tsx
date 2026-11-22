import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Headphones,
  HelpCircle,
  LifeBuoy,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  User,
} from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { cn } from "@/lib/utils";

interface SupportTicket {
  id: string;
  category: string;
  subject: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Open" | "In Progress" | "Resolved";
  createdAt: string;
  region: string;
  orderRef?: string;
  lastReply?: string;
}

interface CommunityFeedback {
  id: string;
  author: string;
  role: string;
  location: string;
  rating: number;
  category: string;
  comment: string;
  date: string;
  verified: boolean;
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "TKT-GOA-2026-1042",
    category: "Weighbridge & Collection Point",
    subject: "Moisture calibration confirmation at Margao APMC Hub",
    description: "Farmer batch delivering 12 tonnes of paddy straw requested sensor test verification before unloading.",
    priority: "Medium",
    status: "Resolved",
    createdAt: "2 hours ago",
    region: "Margao, South Goa",
    orderRef: "ORD-8841",
    lastReply: "Field Officer Fernandes verified calibration at Margao Hub. Weight ticket stamped and approved.",
  },
  {
    id: "TKT-GOA-2026-1039",
    category: "Payment & Buy Query",
    subject: "Direct escrow capture inquiry for Vasco bio-energy pool",
    description: "Buyer inquired about automated payment clearance upon receipt at Vasco Port Agro Depot.",
    priority: "Low",
    status: "Resolved",
    createdAt: "Yesterday",
    region: "Vasco, South Goa",
    lastReply: "Payment captured successfully and held in safe escrow until final weighbridge confirmation.",
  },
  {
    id: "TKT-GOA-2026-1031",
    category: "Collection Point Access",
    subject: "Truck pickup schedule at Verna Industrial Biomass Depot",
    description: "Aggregator truck loading schedule confirmation for 40-tonne cashew shell shipment.",
    priority: "High",
    status: "In Progress",
    createdAt: "3 days ago",
    region: "Verna, South Goa",
    lastReply: "Logistics desk assigned pickup bay #3 at Verna Depot. Coordinator contact sent via SMS.",
  },
];

const INITIAL_FEEDBACK: CommunityFeedback[] = [
  {
    id: "fb-1",
    author: "Ramesh Yadav",
    role: "Farmer",
    location: "Margao, Goa",
    rating: 5,
    category: "Farmer Payouts",
    comment:
      "The payment was credited directly after weighbridge verification at the Margao APMC Hub. No middlemen, no deductions. Best platform for farmers in Goa!",
    date: "Nov 20, 2026",
    verified: true,
  },
  {
    id: "fb-2",
    author: "Sunita Devi",
    role: "Farmer",
    location: "Vasco, Goa",
    rating: 5,
    category: "Voice Assistant",
    comment:
      "Listing 5 tonnes of mustard stubble took less than 2 minutes using spoken Hindi voice. The nearest collection point in Vasco was auto-suggested.",
    date: "Nov 18, 2026",
    verified: true,
  },
  {
    id: "fb-3",
    author: "Procurement Desk",
    role: "Green Industry",
    location: "Verna, Goa",
    rating: 5,
    category: "Buying Experience",
    comment:
      "Clicking 'Buy' is instant and straightforward. Tonnage pooled across Panjim, Mapusa and Vasco arrived exactly on schedule.",
    date: "Nov 16, 2026",
    verified: true,
  },
  {
    id: "fb-4",
    author: "Amit Kumar",
    role: "Buyer",
    location: "Panjim, Goa",
    rating: 4,
    category: "Marketplace Lots",
    comment:
      "Great selection of dry cashew shells and paddy residue. Escrow protection gives complete peace of mind.",
    date: "Nov 12, 2026",
    verified: true,
  },
];

const FAQS = [
  {
    q: "How does the 'Buy' action and payment escrow work?",
    a: "When you click 'Buy' on any farm listing or pool, your funds are safely reserved in an escrow vault. The farmer is notified to prepare the residue for delivery to the designated local collection point (such as Vasco Port, Margao APMC, or Verna Depot). Payout is released to the seller only once the digital weighbridge confirms accepted weight and moisture tolerance.",
  },
  {
    q: "Where are the local Goa collection points located?",
    a: "GreenRoots maintains active regional collection hubs across Goa including: Vasco Port Agro Depot, Margao APMC Central Hub, Panjim Central Market Yard, Mapusa Sub-Yard Co-op, Verna Industrial Biomass Depot, Ponda Farm Residue Hub, Bicholim Agri Center, Curchorem Biomass Depot, and Canacona Eco Yard, plus border hubs in Belagavi and Kolhapur.",
  },
  {
    q: "What residue varieties are accepted across Goa and neighboring regions?",
    a: "We currently accept paddy straw, cashew shells, rice husk, bagasse, sugarcane trash, mustard stubble, cotton stalks, and groundnut shells. Moisture should ideally stay below 18% for optimal market value.",
  },
  {
    q: "How quickly are farmer payouts released after weighbridge check-in?",
    a: "As soon as your lot is weighed at the collection point weighbridge and the digital weight slip is scanned, the escrow release triggers automatically. Payouts typically settle in the farmer's registered account within minutes.",
  },
  {
    q: "How do I report a discrepancy or request an order cancellation?",
    a: "You can submit a ticket in the 'Contact Support' tab on this page or call our 24/7 Goa helpline at +91 832 250 1234. If the residue is inspected at the weighbridge and fails agreed quality checks, buyers receive an instant full refund.",
  },
  {
    q: "How can industries verify their Pollution Control Board consent?",
    a: "Industries can submit their state pollution control board (GSPCB/MPCB/KSPCB) consent document during onboarding or through Portal → Company Profile. Our admin team verifies licenses within 24 business hours.",
  },
];

export default function SupportPage() {
  const { t } = useTranslation();
  const profile = useSession((s) => s.profile);
  const pushToast = useUi((s) => s.pushToast);

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [ticketCategory, setTicketCategory] = useState("Payment & Buy Query");
  const [ticketPriority, setTicketPriority] = useState<"Low" | "Medium" | "High" | "Urgent">("Medium");
  const [ticketChannel, setTicketChannel] = useState("Phone Call");
  const [ticketRegion, setTicketRegion] = useState("Vasco");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketOrderRef, setTicketOrderRef] = useState("");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccessId, setTicketSuccessId] = useState<string | null>(null);

  // Feedback state
  const [feedbackList, setFeedbackList] = useState<CommunityFeedback[]>(INITIAL_FEEDBACK);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackCategory, setFeedbackCategory] = useState("Overall Platform Experience");
  const [feedbackLike, setFeedbackLike] = useState("");
  const [feedbackImprove, setFeedbackImprove] = useState("");
  const [feedbackRecommend, setFeedbackRecommend] = useState(true);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // FAQ Search state
  const [faqSearch, setFaqSearch] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const filteredFaqs = useMemo(() => {
    if (!faqSearch.trim()) return FAQS;
    const term = faqSearch.toLowerCase();
    return FAQS.filter(
      (f) => f.q.toLowerCase().includes(term) || f.a.toLowerCase().includes(term)
    );
  }, [faqSearch]);

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) return;

    setTicketSubmitting(true);
    setTimeout(() => {
      const generatedId = `TKT-GOA-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTicket: SupportTicket = {
        id: generatedId,
        category: ticketCategory,
        subject: ticketSubject.trim(),
        description: ticketDesc.trim(),
        priority: ticketPriority,
        status: "Open",
        createdAt: "Just now",
        region: `${ticketRegion}, Goa`,
        orderRef: ticketOrderRef.trim() || undefined,
        lastReply: `Ticket logged. Our Goa regional coordinator has been notified via ${ticketChannel.toLowerCase()}.`,
      };

      setTickets([newTicket, ...tickets]);
      setTicketSuccessId(generatedId);
      setTicketSubject("");
      setTicketDesc("");
      setTicketOrderRef("");
      setTicketSubmitting(false);

      pushToast({
        title: "Support ticket logged",
        description: `Ticket #${generatedId} created. A regional agent will respond shortly.`,
        variant: "success",
      });
    }, 400);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackImprove.trim() && !feedbackLike.trim()) return;

    setFeedbackSubmitting(true);
    setTimeout(() => {
      const newFb: CommunityFeedback = {
        id: `fb-${Date.now()}`,
        author: profile?.name || "Community Member",
        role: profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : "Farmer",
        location: `${profile?.village || "Panjim"}, ${profile?.state || "Goa"}`,
        rating,
        category: feedbackCategory,
        comment: feedbackLike.trim() ? `${feedbackLike.trim()} ${feedbackImprove.trim() ? "· Note: " + feedbackImprove.trim() : ""}` : feedbackImprove.trim(),
        date: "Today",
        verified: true,
      };

      setFeedbackList([newFb, ...feedbackList]);
      setFeedbackSubmitted(true);
      setFeedbackLike("");
      setFeedbackImprove("");
      setFeedbackSubmitting(false);

      pushToast({
        title: "Feedback received",
        description: "Thank you for helping us improve GreenRoots for local farmers & buyers!",
        variant: "success",
      });
    }, 400);
  };

  const ratingLabels: Record<number, string> = {
    1: "Needs urgent improvement",
    2: "Fair",
    3: "Good",
    4: "Very good",
    5: "Exceptional experience!",
  };

  return (
    <PageContainer className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-line/80 bg-gradient-to-br from-[#0E4D2F] via-[#153D2A] to-[#1B2A20] p-6 text-white shadow-md dark:border-portal-line sm:p-8">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-[#78E0A0]" />
            <span>24/7 Regional Assistance Desk · Goa, Karnataka &amp; Maharashtra</span>
          </div>

          <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Customer Support &amp; Feedback Hub
          </h1>

          <p className="text-sm text-white/80 leading-relaxed sm:text-base">
            Dedicated assistance for farmers, agro-buyers, and green industries across Vasco, Margao, Panjim, Mapusa,
            Verna, and all Goa agricultural clusters.
          </p>

          {/* Contact Fast-Pills */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs">
            <a
              href="tel:18008904733"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 font-semibold text-white transition-colors hover:bg-white/25"
            >
              <Phone className="h-3.5 w-3.5 text-[#78E0A0]" />
              <span>Toll-Free: <strong>1800-890-GREEN</strong></span>
            </a>

            <a
              href="tel:+918322501234"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 font-semibold text-white transition-colors hover:bg-white/25"
            >
              <Building2 className="h-3.5 w-3.5 text-[#78E0A0]" />
              <span>Goa Desk: <strong>+91 832 250 1234</strong></span>
            </a>

            <a
              href="https://wa.me/919822154321"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366]/20 border border-[#25D366]/40 px-3 py-2 font-semibold text-white transition-colors hover:bg-[#25D366]/30"
            >
              <MessageSquare className="h-3.5 w-3.5 text-[#25D366]" />
              <span>WhatsApp: <strong>+91 98221 54321</strong></span>
            </a>

            <a
              href="mailto:support@greenroots.org"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 font-semibold text-white transition-colors hover:bg-white/25"
            >
              <Mail className="h-3.5 w-3.5 text-[#78E0A0]" />
              <span>Email: <strong>support@greenroots.org</strong></span>
            </a>
          </div>
        </div>

        {/* Decorative Watermark */}
        <LifeBuoy
          className="pointer-events-none absolute -bottom-6 -right-6 h-56 w-56 text-white/5"
          aria-hidden="true"
        />
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="support" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-canvas/80 p-1.5 dark:bg-portal-surface">
          <TabsTrigger value="support" className="flex items-center gap-2 font-bold py-2.5">
            <Headphones className="h-4 w-4" />
            <span>Contact Support</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2 font-bold py-2.5">
            <Star className="h-4 w-4" />
            <span>Feedback &amp; Rating</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2 font-bold py-2.5">
            <HelpCircle className="h-4 w-4" />
            <span>Help Center &amp; FAQs</span>
          </TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/* TAB 1: CUSTOMER SUPPORT & TICKETS                              */}
        {/* ============================================================== */}
        <TabsContent value="support" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left 7 Cols: Ticket submission form */}
            <div className="lg:col-span-7">
              <Card className="p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-line pb-4 dark:border-portal-line">
                  <div>
                    <h2 className="text-lg font-bold text-ink dark:text-portal-ink">Open a Support Ticket</h2>
                    <p className="mt-0.5 text-xs text-muted dark:text-portal-muted">
                      Direct escalation to regional coordinators stationed across Goa collection points.
                    </p>
                  </div>
                  <span className="rounded-full bg-meadow px-2.5 py-1 text-[11px] font-bold text-forest">
                    Average response &lt; 15 mins
                  </span>
                </div>

                {ticketSuccessId && (
                  <div className="mt-4 rounded-xl border border-forest/30 bg-meadow/50 p-4 text-forest">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-forest mt-0.5" />
                      <div>
                        <p className="font-bold text-sm">Ticket Successfully Logged!</p>
                        <p className="mt-0.5 text-xs text-forest/90">
                          Your ticket reference ID is{" "}
                          <strong className="font-mono font-bold text-moss underline">{ticketSuccessId}</strong>.
                          A field officer in {ticketRegion} has been assigned to your request.
                        </p>
                        <button
                          type="button"
                          onClick={() => setTicketSuccessId(null)}
                          className="mt-2 text-xs font-bold text-forest underline hover:opacity-80"
                        >
                          Submit another inquiry
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleTicketSubmit} className="mt-5 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="tkt-category" className="text-xs font-bold">
                        Category
                      </Label>
                      <select
                        id="tkt-category"
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none dark:border-portal-line dark:bg-portal-surface dark:text-portal-ink"
                      >
                        <option value="Payment & Buy Query">Payment &amp; Buy Query</option>
                        <option value="Weighbridge & Collection Point">Weighbridge &amp; Collection Point</option>
                        <option value="Listing & Residue Quality">Listing &amp; Residue Quality</option>
                        <option value="Order & Transport">Order &amp; Transport Logistics</option>
                        <option value="Account & Verification">Account &amp; Business Verification</option>
                        <option value="Dispute Resolution">Dispute Resolution</option>
                        <option value="General Inquiry">General Inquiry</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="tkt-priority" className="text-xs font-bold">
                        Urgency Level
                      </Label>
                      <select
                        id="tkt-priority"
                        value={ticketPriority}
                        onChange={(e) => setTicketPriority(e.target.value as any)}
                        className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none dark:border-portal-line dark:bg-portal-surface dark:text-portal-ink"
                      >
                        <option value="Low">Low · General query</option>
                        <option value="Medium">Medium · Normal processing</option>
                        <option value="High">High · Today's scheduled delivery</option>
                        <option value="Urgent">Urgent · Vehicle at weighbridge</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="tkt-region" className="text-xs font-bold">
                        Local Goa Hub / Region
                      </Label>
                      <select
                        id="tkt-region"
                        value={ticketRegion}
                        onChange={(e) => setTicketRegion(e.target.value)}
                        className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none dark:border-portal-line dark:bg-portal-surface dark:text-portal-ink"
                      >
                        <option value="Vasco">Vasco da Gama (Vasco Port)</option>
                        <option value="Margao">Margao (Margao APMC Central)</option>
                        <option value="Panjim">Panjim (Panjim Central Yard)</option>
                        <option value="Mapusa">Mapusa (Mapusa Sub-Yard)</option>
                        <option value="Verna">Verna (Industrial Biomass Depot)</option>
                        <option value="Ponda">Ponda (Agro Residue Point)</option>
                        <option value="Bicholim">Bicholim (Agri Collection Center)</option>
                        <option value="Curchorem">Curchorem (Biomass Depot)</option>
                        <option value="Canacona">Canacona (Eco Yard)</option>
                        <option value="Porvorim">Porvorim</option>
                        <option value="Cuncolim">Cuncolim</option>
                        <option value="Valpoi">Valpoi</option>
                        <option value="Pernem">Pernem</option>
                        <option value="Belagavi">Belagavi (Karnataka Border)</option>
                        <option value="Kolhapur">Kolhapur (Maharashtra Hub)</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="tkt-order-ref" className="text-xs font-bold">
                        Order / Listing ID (Optional)
                      </Label>
                      <Input
                        id="tkt-order-ref"
                        value={ticketOrderRef}
                        onChange={(e) => setTicketOrderRef(e.target.value)}
                        placeholder="e.g. ORD-8841 or listing_cashew_1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tkt-subject" className="text-xs font-bold">
                      Subject
                    </Label>
                    <Input
                      id="tkt-subject"
                      required
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tkt-desc" className="text-xs font-bold">
                      Detailed Description
                    </Label>
                    <textarea
                      id="tkt-desc"
                      rows={4}
                      required
                      value={ticketDesc}
                      onChange={(e) => setTicketDesc(e.target.value)}
                      placeholder="Please specify weights, residue type, truck number, or any specific question..."
                      className="w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink placeholder:text-muted focus:border-forest focus:outline-none dark:border-portal-line dark:bg-portal-surface dark:text-portal-ink"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold mb-1.5 block">Preferred Resolution Channel</Label>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {["Phone Call", "WhatsApp Message", "Email Response"].map((ch) => (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => setTicketChannel(ch)}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 font-medium transition-colors",
                            ticketChannel === ch
                              ? "border-forest bg-meadow text-forest font-bold dark:bg-[#123524] dark:text-growth"
                              : "border-line bg-surface text-muted hover:text-ink dark:border-portal-line dark:bg-portal-surface"
                          )}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="field"
                    className="w-full font-bold shadow-sm"
                    disabled={ticketSubmitting}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {ticketSubmitting ? "Logging Ticket..." : "Submit Support Ticket"}
                  </Button>
                </form>
              </Card>
            </div>

            {/* Right 5 Cols: Active Tickets & Contact Cards */}
            <div className="space-y-4 lg:col-span-5">
              <Card className="p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-line pb-3 dark:border-portal-line">
                  <h3 className="font-bold text-sm text-ink dark:text-portal-ink flex items-center gap-2">
                    <Clock className="h-4 w-4 text-forest" />
                    <span>Recent Support Tickets</span>
                  </h3>
                  <span className="num text-xs font-bold text-muted">{tickets.length} total</span>
                </div>

                <div className="mt-3 space-y-3">
                  {tickets.map((tkt) => (
                    <div
                      key={tkt.id}
                      className="rounded-xl border border-line/80 bg-canvas p-3.5 text-xs transition-colors hover:border-forest/40 dark:border-portal-line dark:bg-portal-surface"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono font-bold text-moss dark:text-growth">{tkt.id}</span>
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                            tkt.status === "Resolved"
                              ? "bg-meadow text-forest dark:bg-[#123524] dark:text-growth"
                              : tkt.status === "In Progress"
                              ? "bg-[#FEF3C7] text-[#92400E]"
                              : "bg-escrow/20 text-navy dark:text-[#8FB4FF]"
                          )}
                        >
                          {tkt.status}
                        </span>
                      </div>

                      <p className="mt-1 font-bold text-ink dark:text-portal-ink">{tkt.subject}</p>
                      <p className="mt-0.5 text-muted dark:text-portal-muted line-clamp-2">{tkt.description}</p>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted border-t border-line/60 pt-2 dark:border-portal-line/60">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-forest" /> {tkt.region}
                        </span>
                        <span>{tkt.createdAt}</span>
                      </div>

                      {tkt.lastReply && (
                        <div className="mt-2 rounded-lg bg-surface p-2 text-[11px] text-moss dark:bg-portal-bg dark:text-portal-muted">
                          <strong className="text-ink dark:text-portal-ink font-semibold">Response:</strong>{" "}
                          {tkt.lastReply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Physical Office & Field Station Info */}
              <Card className="p-4 sm:p-5 shadow-sm space-y-3 bg-[#F8FAF9] dark:bg-portal-surface">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted">Goa Field Liaison Network</h4>
                <div className="space-y-2 text-xs text-muted dark:text-portal-muted">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-forest shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-ink dark:text-portal-ink">State Headquarters:</strong>
                      <p>GreenRoots Regional Desk, EDC Complex, Patto Plaza, Panjim, Goa 403001</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-forest shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-ink dark:text-portal-ink">South Goa Hub:</strong>
                      <p>Margao APMC Yard Office &amp; Vasco Port Agro Liaison Bay</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-forest shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-ink dark:text-portal-ink">Weighbridge Operating Hours:</strong>
                      <p>6:00 AM – 8:30 PM (Mon – Sun)</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: FEEDBACK & RATINGS                                      */}
        {/* ============================================================== */}
        <TabsContent value="feedback" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left 6 Cols: Submit Feedback Form */}
            <div className="lg:col-span-6">
              <Card className="p-5 sm:p-6 shadow-sm">
                <div className="border-b border-line pb-4 dark:border-portal-line">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-terracotta" />
                    <h2 className="text-lg font-bold text-ink dark:text-portal-ink">Share Your Feedback</h2>
                  </div>
                  <p className="mt-1 text-xs text-muted dark:text-portal-muted">
                    Your insights directly shape our collection schedules, weighbridge services, and pricing transparency.
                  </p>
                </div>

                {feedbackSubmitted ? (
                  <div className="mt-6 rounded-2xl border border-forest/30 bg-meadow/50 p-6 text-center text-forest">
                    <ThumbsUp className="mx-auto h-10 w-10 text-forest" />
                    <h3 className="mt-3 font-heading text-lg font-bold">Thank You for Your Feedback!</h3>
                    <p className="mt-1 text-xs text-forest/90">
                      Your review has been shared with the GreenRoots agricultural product and field operations team.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 bg-white text-forest"
                      onClick={() => setFeedbackSubmitted(false)}
                    >
                      Leave another review
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="mt-5 space-y-4">
                    {/* Interactive Star Rating */}
                    <div>
                      <Label className="text-xs font-bold block mb-1">Rate Your Overall Experience</Label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 text-terracotta transition-transform hover:scale-110 focus:outline-none"
                            aria-label={`${star} star`}
                          >
                            <Star
                              className={cn(
                                "h-8 w-8",
                                (hoverRating || rating) >= star
                                  ? "fill-terracotta text-terracotta"
                                  : "text-line dark:text-portal-line"
                              )}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-xs font-bold text-moss dark:text-portal-ink">
                          {ratingLabels[hoverRating || rating]}
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="fb-cat" className="text-xs font-bold">
                        What are you reviewing?
                      </Label>
                      <select
                        id="fb-cat"
                        value={feedbackCategory}
                        onChange={(e) => setFeedbackCategory(e.target.value)}
                        className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none dark:border-portal-line dark:bg-portal-surface dark:text-portal-ink"
                      >
                        <option value="Overall Platform Experience">Overall Platform Experience</option>
                        <option value="Buying & Checkout Experience">Buying &amp; Checkout Experience</option>
                        <option value="Farmer Payout Timing & Transparency">Farmer Payout Timing &amp; Transparency</option>
                        <option value="Weighbridge & Moisture Accuracy">Weighbridge &amp; Moisture Testing</option>
                        <option value="Collection Point Cleanliness & Access">Collection Hubs (Vasco, Margao, Panjim, etc.)</option>
                        <option value="AI Voice Assistant">AI Voice Assistant in Marathi/Konkani/Hindi</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="fb-like" className="text-xs font-bold">
                        What went particularly well?
                      </Label>
                      <Input
                        id="fb-like"
                        value={feedbackLike}
                        onChange={(e) => setFeedbackLike(e.target.value)}
                        placeholder="e.g. Simple checkout, fast weighbridge clearance, prompt payout"
                      />
                    </div>

                    <div>
                      <Label htmlFor="fb-improve" className="text-xs font-bold">
                        What could we improve?
                      </Label>
                      <textarea
                        id="fb-improve"
                        rows={3}
                        required
                        value={feedbackImprove}
                        onChange={(e) => setFeedbackImprove(e.target.value)}
                        placeholder="Share any friction, feature suggestions, or feedback..."
                        className="w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink placeholder:text-muted focus:border-forest focus:outline-none dark:border-portal-line dark:bg-portal-surface dark:text-portal-ink"
                      />
                    </div>

                    {/* Recommendation Toggle */}
                    <div className="flex items-center justify-between rounded-xl border border-line bg-canvas p-3 dark:border-portal-line dark:bg-portal-surface">
                      <span className="text-xs font-medium text-ink dark:text-portal-ink">
                        Would you recommend GreenRoots to fellow farmers or buyers?
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFeedbackRecommend(true)}
                          className={cn(
                            "rounded-lg px-3 py-1 text-xs font-bold transition-colors",
                            feedbackRecommend
                              ? "bg-forest text-white"
                              : "border border-line bg-surface text-muted"
                          )}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedbackRecommend(false)}
                          className={cn(
                            "rounded-lg px-3 py-1 text-xs font-bold transition-colors",
                            !feedbackRecommend
                              ? "bg-terracotta text-white"
                              : "border border-line bg-surface text-muted"
                          )}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="field"
                      className="w-full font-bold shadow-sm"
                      disabled={feedbackSubmitting}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {feedbackSubmitting ? "Submitting..." : "Send Feedback"}
                    </Button>
                  </form>
                )}
              </Card>
            </div>

            {/* Right 6 Cols: Recent Community Feedback */}
            <div className="space-y-4 lg:col-span-6">
              <Card className="p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-line pb-3 dark:border-portal-line">
                  <div>
                    <h3 className="font-bold text-sm text-ink dark:text-portal-ink">Recent Community Voices</h3>
                    <p className="text-[11px] text-muted dark:text-portal-muted">
                      Feedback from certified farmers, buyers, and green industries
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-terracotta">
                    <Star className="h-4 w-4 fill-terracotta text-terracotta" />
                    <span>4.9 / 5.0</span>
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  {feedbackList.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-line/80 bg-canvas p-4 text-xs transition-colors dark:border-portal-line dark:bg-portal-surface"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-xs font-bold text-white">
                            {item.author.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-bold text-ink dark:text-portal-ink flex items-center gap-1.5">
                              {item.author}
                              {item.verified && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-forest" aria-label="Verified participant" />
                              )}
                            </p>
                            <p className="text-[11px] text-muted dark:text-portal-muted">
                              {item.role} · {item.location}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 text-terracotta">
                          {Array.from({ length: item.rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-terracotta text-terracotta" />
                          ))}
                        </div>
                      </div>

                      <p className="mt-2 text-ink dark:text-portal-ink leading-relaxed">
                        "{item.comment}"
                      </p>

                      <div className="mt-2.5 flex items-center justify-between border-t border-line/60 pt-2 text-[10px] text-muted dark:border-portal-line/60">
                        <span className="rounded bg-surface px-2 py-0.5 font-medium text-moss dark:bg-portal-bg dark:text-growth">
                          {item.category}
                        </span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 3: HELP CENTER & FAQS                                      */}
        {/* ============================================================== */}
        <TabsContent value="faq" className="mt-6 space-y-6">
          <Card className="p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4 dark:border-portal-line">
              <div>
                <h2 className="text-lg font-bold text-ink dark:text-portal-ink">Frequently Asked Questions</h2>
                <p className="mt-0.5 text-xs text-muted dark:text-portal-muted">
                  Quick solutions regarding payments, weighbridge drop-offs, and local Goa operations.
                </p>
              </div>

              {/* FAQ Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                <Input
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="Search questions or topics..."
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {filteredFaqs.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted">
                  <HelpCircle className="mx-auto h-8 w-8 text-muted/60 mb-2" />
                  <p>No matching questions found for "{faqSearch}".</p>
                  <button
                    type="button"
                    onClick={() => setFaqSearch("")}
                    className="mt-2 text-forest underline font-bold"
                  >
                    View all questions
                  </button>
                </div>
              ) : (
                filteredFaqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-line/80 bg-surface transition-all dark:border-portal-line dark:bg-portal-surface"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between p-4 text-left font-bold text-sm text-ink dark:text-portal-ink hover:text-forest"
                      >
                        <span className="flex items-center gap-2.5 pr-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-meadow text-xs font-bold text-forest dark:bg-[#123524] dark:text-growth">
                            {idx + 1}
                          </span>
                          {faq.q}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-muted transition-transform duration-200",
                            isOpen && "rotate-180 text-forest"
                          )}
                        />
                      </button>

                      {isOpen && (
                        <div className="border-t border-line/60 px-4 pb-4 pt-3 text-xs leading-relaxed text-muted dark:border-portal-line/60 dark:text-portal-muted">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Quick Help Channels Card */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-4 flex flex-col justify-between space-y-3 border-l-4 border-l-forest shadow-xs">
              <div>
                <p className="font-bold text-sm text-ink dark:text-portal-ink flex items-center gap-2">
                  <Phone className="h-4 w-4 text-forest" />
                  <span>Call Toll-Free Helpline</span>
                </p>
                <p className="mt-1 text-xs text-muted">Speak immediately to a Goa agricultural coordinator.</p>
              </div>
              <a
                href="tel:18008904733"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:underline"
              >
                Call 1800-890-GREEN <ExternalLink className="h-3 w-3" />
              </a>
            </Card>

            <Card className="p-4 flex flex-col justify-between space-y-3 border-l-4 border-l-[#25D366] shadow-xs">
              <div>
                <p className="font-bold text-sm text-ink dark:text-portal-ink flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[#25D366]" />
                  <span>WhatsApp Helpdesk</span>
                </p>
                <p className="mt-1 text-xs text-muted">Chat, send weighbridge photos, or share location pins.</p>
              </div>
              <a
                href="https://wa.me/919822154321"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:underline"
              >
                Chat on WhatsApp <ExternalLink className="h-3 w-3" />
              </a>
            </Card>

            <Card className="p-4 flex flex-col justify-between space-y-3 border-l-4 border-l-terracotta shadow-xs">
              <div>
                <p className="font-bold text-sm text-ink dark:text-portal-ink flex items-center gap-2">
                  <Mail className="h-4 w-4 text-terracotta" />
                  <span>Email Support Desk</span>
                </p>
                <p className="mt-1 text-xs text-muted">For enterprise contract inquiries, billing &amp; licensing.</p>
              </div>
              <a
                href="mailto:support@greenroots.org"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-terracotta hover:underline"
              >
                support@greenroots.org <ExternalLink className="h-3 w-3" />
              </a>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
