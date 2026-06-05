"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { bookingsApi, paymentsApi, authApi } from "@/lib/api";
import type { BookingResponse, BookingStatus, PaymentResponse } from "@/types";
import { bookingStatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { SkeletonRow } from "@/components/ui/LoadingSkeleton";
import Modal from "@/components/ui/Modal";
import { useBookingStore } from "@/store/bookingStore";

const STATUSES: BookingStatus[] = [
  "PendingPayment", "Confirmed", "Active", "Cancelled", "TimedOut", "Completed",
];

type GuestInfo = { email: string; firstName: string | null; lastName: string | null };

function displayName(g: GuestInfo | null) {
  if (!g) return "Unknown";
  if (g.firstName || g.lastName) return `${g.firstName ?? ""} ${g.lastName ?? ""}`.trim();
  return g.email;
}

export default function ReceptionBookingsPage() {
  const { bookings, loading, filter, fetchBookings, setFilter, updateBooking } = useBookingStore();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm]       = useState("");

  // Info modal
  const [infoBooking, setInfoBooking]   = useState<BookingResponse | null>(null);
  const [guestInfo, setGuestInfo]       = useState<GuestInfo | null>(null);
  const [infoLoading, setInfoLoading]   = useState(false);

  // Checkout payment-gate modal
  const [checkoutBooking, setCheckoutBooking]   = useState<BookingResponse | null>(null);
  const [checkoutPayment, setCheckoutPayment]   = useState<PaymentResponse | null>(null);
  const [checkoutLoading, setCheckoutLoading]   = useState(false);

  useEffect(() => { fetchBookings(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displayedBookings = searchTerm.trim()
    ? bookings.filter(
        (bk) =>
          bk.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bk.id.toLowerCase().startsWith(searchTerm.toLowerCase())
      )
    : bookings;

  const openInfo = async (bk: BookingResponse) => {
    setInfoBooking(bk); setGuestInfo(null); setInfoLoading(true);
    try {
      const u = await authApi.getUserById(bk.guestId);
      setGuestInfo({ email: u.email, firstName: u.firstName, lastName: u.lastName });
    } catch { /* ignore */ }
    setInfoLoading(false);
  };

  // Checkout: verify payment is confirmed first, gate behind modal if not
  const doCheckout = async (bk: BookingResponse) => {
    setActionLoading(`checkout-${bk.id}`);
    try {
      const payment = await paymentsApi.getByBooking(bk.id).catch(() => null);
      if (payment && payment.status !== "Completed") {
        // Payment not yet confirmed — show gate modal
        setCheckoutBooking(bk);
        setCheckoutPayment(payment);
        return;
      }
      // No payment record (walk-in with cash already settled) or payment complete — proceed
      const updated = await bookingsApi.checkOut(bk.id);
      updateBooking(updated);
      toast.success("Checked out successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmPaymentAndCheckout = async () => {
    if (!checkoutBooking) return;
    setCheckoutLoading(true);
    try {
      if (checkoutPayment && checkoutPayment.status !== "Completed") {
        await paymentsApi.confirmManual(checkoutPayment.id);
        toast.success("Payment confirmed");
      }
      const updated = await bookingsApi.checkOut(checkoutBooking.id);
      updateBooking(updated);
      toast.success("Checked out successfully");
      setCheckoutBooking(null);
      setCheckoutPayment(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const doAction = async (action: "checkin" | "cancel" | "confirmed", bk: BookingResponse) => {
    setActionLoading(`${action}-${bk.id}`);
    try {
      let updated: BookingResponse;
      if (action === "checkin") updated = await bookingsApi.checkIn(bk.id);
      else if (action === "cancel") updated = await bookingsApi.cancel(bk.id);
      else {
        // confirm: mark booking + create + confirm payment record
        updated = await bookingsApi.confirm(bk.id);
        try {
          const payment = await paymentsApi.initiate({ bookingId: bk.id, amount: bk.totalPrice });
          await paymentsApi.confirmManual(payment.id);
          toast.success("Booking confirmed — payment record created");
        } catch {
          toast.success("Booking confirmed");
          toast("Payment record could not be created automatically", { icon: "⚠️" });
        }
      }
      updateBooking(updated);
      if (action !== "confirmed") toast.success(`${action} successful`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Bookings</h1>
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>

      <div className="bg-navy-800 border border-navy-700 rounded-xl p-4 mb-4">
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by room number…" className="w-full" />
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => { setFilter(""); setSearchTerm(""); }}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filter === "" ? "bg-gold-500 text-navy-900 font-semibold" : "bg-navy-700 text-slate-300 hover:text-white"}`}>
          All
        </button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => { setFilter(s); setSearchTerm(""); }}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filter === s ? "bg-gold-500 text-navy-900 font-semibold" : "bg-navy-700 text-slate-300 hover:text-white"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy-900/50">
            <tr>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Room</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Check-in</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Check-out</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Total</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700">
            {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : displayedBookings.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No bookings found</td></tr>
              ) : displayedBookings.map((bk) => (
                <tr key={bk.id} className="hover:bg-navy-700/30 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{bk.roomNumber}</td>
                  <td className="px-4 py-3 text-slate-300">{format(new Date(bk.checkIn), "MMM d")}</td>
                  <td className="px-4 py-3 text-slate-300">{format(new Date(bk.checkOut), "MMM d")}</td>
                  <td className="px-4 py-3 text-gold-400">${bk.totalPrice.toFixed(2)}</td>
                  <td className="px-4 py-3">{bookingStatusBadge(bk.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="ghost" onClick={() => openInfo(bk)}>Info</Button>
                      {bk.status === "PendingPayment" && (
                        <Button size="sm" onClick={() => doAction("confirmed", bk)}
                          loading={actionLoading === `confirmed-${bk.id}`}>Confirm</Button>
                      )}
                      {bk.status === "Confirmed" && (
                        <Button size="sm" onClick={() => doAction("checkin", bk)}
                          loading={actionLoading === `checkin-${bk.id}`}>Check In</Button>
                      )}
                      {bk.status === "Active" && (
                        <Button size="sm" onClick={() => doCheckout(bk)}
                          loading={actionLoading === `checkout-${bk.id}`}>Check Out</Button>
                      )}
                      {["PendingPayment", "Confirmed"].includes(bk.status) && (
                        <Button size="sm" variant="danger" onClick={() => doAction("cancel", bk)}
                          loading={actionLoading === `cancel-${bk.id}`}>Cancel</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Booking Info Modal */}
      <Modal open={!!infoBooking} onClose={() => { setInfoBooking(null); setGuestInfo(null); }}
        title={`Booking — Room ${infoBooking?.roomNumber}`}>
        {infoLoading ? (
          <p className="text-slate-400 text-sm py-4 text-center">Loading guest info…</p>
        ) : infoBooking && (
          <div className="space-y-3 text-sm">
            <InfoRow label="Guest"     value={displayName(guestInfo)} />
            {guestInfo?.email && <InfoRow label="Email"     value={guestInfo.email} />}
            <InfoRow label="Room"      value={infoBooking.roomNumber} />
            <InfoRow label="Check-in"  value={format(new Date(infoBooking.checkIn), "MMM d, yyyy")} />
            <InfoRow label="Check-out" value={format(new Date(infoBooking.checkOut), "MMM d, yyyy")} />
            <InfoRow label="Total"     value={`$${infoBooking.totalPrice.toFixed(2)}`} highlight />
            <InfoRow label="Status"    value={infoBooking.status} />
          </div>
        )}
      </Modal>

      {/* Checkout Payment Gate Modal */}
      <Modal
        open={!!checkoutBooking}
        onClose={() => { setCheckoutBooking(null); setCheckoutPayment(null); }}
        title="Confirm Payment Before Checkout">
        {checkoutBooking && (
          <div className="space-y-4 text-sm">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-yellow-300">
              Payment status: <strong>{checkoutPayment?.status ?? "Unknown"}</strong> — not yet confirmed.
            </div>
            <div className="space-y-2 text-slate-300">
              <InfoRow label="Room"    value={checkoutBooking.roomNumber} />
              <InfoRow label="Amount"  value={`$${checkoutBooking.totalPrice.toFixed(2)}`} highlight />
            </div>
            <p className="text-slate-400 text-xs">
              Confirm that cash / manual payment has been received, then proceed with checkout.
            </p>
            <div className="flex gap-3 pt-1">
              <Button onClick={handleConfirmPaymentAndCheckout} loading={checkoutLoading}>
                Confirm Payment &amp; Check Out
              </Button>
              <Button variant="ghost" onClick={() => { setCheckoutBooking(null); setCheckoutPayment(null); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={highlight ? "text-gold-400 font-semibold" : "text-white"}>{value}</span>
    </div>
  );
}
