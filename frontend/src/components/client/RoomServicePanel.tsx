"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { menuApi, ordersApi } from "@/lib/api";
import { useSignalR } from "@/hooks/useSignalR";
import type { MenuItemResponse, OrderResponse } from "@/types";
import { orderStatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const ORDER_STEPS = ["Received", "Preparing", "OutForDelivery", "Delivered"];

function OrderProgress({ status }: { status: string }) {
  const idx = ORDER_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1.5 mt-3">
      {ORDER_STEPS.map((s, i) => (
        <div key={s} className="flex-1">
          <div className={`h-1.5 rounded-full transition-colors ${i <= idx ? "bg-gold-sheen" : "bg-white/10"}`} />
          <p className={`text-[10px] mt-1 ${i <= idx ? "text-gold-300" : "text-slate-600"}`}>
            {s === "OutForDelivery" ? "On the way" : s}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function RoomServicePanel({ bookingId, roomId }: { bookingId: string; roomId: string }) {
  const [menu, setMenu] = useState<MenuItemResponse[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);

  const refetchOrders = useCallback(() => {
    ordersApi.getByBooking(bookingId).then(setOrders).catch(() => {});
  }, [bookingId]);

  useEffect(() => {
    Promise.all([
      menuApi.getAll().then((m) => setMenu(m.filter((x) => x.isAvailable))).catch(() => {}),
      ordersApi.getByBooking(bookingId).then(setOrders).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [bookingId]);

  // Live order status updates (degrades gracefully if the hub is unavailable)
  useSignalR("orders", {
    OrderStatusUpdated: refetchOrders,
    OrderCreated: refetchOrders,
  });

  const categories = useMemo(() => {
    const map: Record<string, MenuItemResponse[]> = {};
    menu.forEach((m) => {
      (map[m.category] ??= []).push(m);
    });
    return map;
  }, [menu]);

  const cartItems = useMemo(
    () => menu.filter((m) => cart[m.id] > 0),
    [menu, cart]
  );
  const cartTotal = cartItems.reduce((sum, m) => sum + m.price * cart[m.id], 0);

  const setQty = (id: string, delta: number) =>
    setCart((c) => {
      const next = Math.max(0, (c[id] ?? 0) + delta);
      const copy = { ...c };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });

  const placeOrder = async () => {
    if (cartItems.length === 0) return;
    setPlacing(true);
    try {
      await ordersApi.create({
        bookingId,
        roomId,
        items: cartItems.map((m) => ({ menuItemId: m.id, quantity: cart[m.id] })),
      });
      toast.success("Order placed — we're on it!");
      setCart({});
      refetchOrders();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return <div className="glass rounded-2xl p-6 h-40 animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Active orders */}
      {orders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Your orders</h3>
          {orders
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((o) => (
              <div key={o.id} className="glass rounded-xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-slate-300">
                    {o.items.map((i) => `${i.quantity}× ${i.menuItemName}`).join(", ")}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-white font-semibold tabular-nums">${o.totalPrice.toFixed(2)}</span>
                    {orderStatusBadge(o.status)}
                  </div>
                </div>
                {o.status !== "Delivered" && <OrderProgress status={o.status} />}
              </div>
            ))}
        </div>
      )}

      {/* Menu */}
      <div>
        <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">Menu</h3>
        {menu.length === 0 ? (
          <p className="text-slate-400 text-sm">The menu is currently unavailable.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(categories).map(([cat, items]) => (
              <div key={cat}>
                <p className="text-xs text-gold-300/80 uppercase tracking-[0.2em] font-semibold mb-3">{cat}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((m) => (
                    <div key={m.id} className="glass rounded-xl p-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm">{m.name}</p>
                        <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{m.description}</p>
                        <p className="text-gold-300 text-sm mt-1.5 tabular-nums">${m.price.toFixed(2)}</p>
                      </div>
                      {cart[m.id] ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => setQty(m.id, -1)} className="w-7 h-7 rounded-lg bg-white/[0.06] text-white hover:bg-white/10">−</button>
                          <span className="w-5 text-center text-white tabular-nums">{cart[m.id]}</span>
                          <button onClick={() => setQty(m.id, 1)} className="w-7 h-7 rounded-lg bg-gold-sheen text-navy-950 font-semibold">+</button>
                        </div>
                      ) : (
                        <button onClick={() => setQty(m.id, 1)} className="shrink-0 px-3 py-1.5 text-xs rounded-lg bg-white/[0.06] text-gold-300 hover:bg-white/10 transition-colors">
                          Add
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart bar */}
      {cartItems.length > 0 && (
        <div className="sticky bottom-4 glass-strong rounded-2xl p-4 shadow-glow flex items-center justify-between gap-4 animate-fade-up">
          <div>
            <p className="text-white font-medium text-sm">
              {cartItems.reduce((n, m) => n + cart[m.id], 0)} item(s)
            </p>
            <p className="text-gold-300 text-sm tabular-nums">${cartTotal.toFixed(2)}</p>
          </div>
          <Button onClick={placeOrder} loading={placing}>Place order</Button>
        </div>
      )}
    </div>
  );
}
