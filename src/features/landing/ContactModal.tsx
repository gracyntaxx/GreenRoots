import { useState } from "react";
import { Mail, MapPin, Phone, Send, ShieldCheck, X } from "lucide-react";

export function ContactModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#101A12]/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        className="relative z-10 w-full max-w-lg rounded-[20px] bg-white p-6 sm:p-8 shadow-[0_16px_40px_rgba(16,26,18,0.14)] border border-[#E7ECE8]"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DFF1E5] px-3 py-1 text-xs font-bold text-[#0E4D2F] uppercase tracking-wider">
              Get in Touch
            </span>
            <h3 id="contact-modal-title" className="font-heading mt-2 text-xl font-bold text-[#101A12]">
              Contact GreenRoots Support
            </h3>
            <p className="mt-1 text-xs text-[#5C6B60]">
              Village hubs across Haryana & Punjab · 24/7 Helpline
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5C6B60] hover:bg-[#F3F7F4] hover:text-[#101A12] transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submitted ? (
          <div className="mt-8 text-center py-6">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#DFF1E5] text-[#0E4D2F]">
              <ShieldCheck className="h-8 w-8" />
            </span>
            <h4 className="font-heading mt-4 text-lg font-bold text-[#101A12]">Thank you!</h4>
            <p className="mt-1 text-sm text-[#5C6B60]">
              Our regional agricultural coordinator will call you back shortly.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="mt-6 px-7 py-3 rounded-full bg-[#0E4D2F] text-white font-semibold text-sm hover:bg-[#0A3A24] transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#101A12] mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Yadav"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-[#DCE5DE] px-3.5 py-2.5 text-sm text-[#101A12] placeholder-[#5C6B60]/50 focus:border-[#0E4D2F] focus:outline-none focus:ring-1 focus:ring-[#0E4D2F]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#101A12] mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 98123 45670"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-[#DCE5DE] px-3.5 py-2.5 text-sm text-[#101A12] placeholder-[#5C6B60]/50 focus:border-[#0E4D2F] focus:outline-none focus:ring-1 focus:ring-[#0E4D2F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#101A12] mb-1">Inquiry or Crop Residue Detail</label>
              <textarea
                rows={3}
                required
                placeholder="I have 20 tonnes of paddy straw in Rewari / I represent a biomass boiler plant..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-[#DCE5DE] px-3.5 py-2.5 text-sm text-[#101A12] placeholder-[#5C6B60]/50 focus:border-[#0E4D2F] focus:outline-none focus:ring-1 focus:ring-[#0E4D2F]"
              />
            </div>

            <div className="rounded-xl bg-[#F3F7F4] p-3 text-xs text-[#5C6B60] space-y-1.5">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-[#0E4D2F]" />
                <span>Helpline: <strong className="text-[#101A12]">+91 98123 45670</strong> (Toll Free)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#0E4D2F]" />
                <span>Email: <strong className="text-[#101A12]">support@greenroots.agri</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#0E4D2F]" />
                <span>Hubs: Rewari Central, Panipat Yard, Sangrur Mandi</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-[#DCE5DE] text-xs font-semibold text-[#101A12] hover:bg-[#F3F7F4] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0E4D2F] text-white text-xs font-semibold hover:bg-[#0A3A24] transition-colors shadow-sm"
              >
                <Send className="h-3.5 w-3.5" /> Send Message
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

