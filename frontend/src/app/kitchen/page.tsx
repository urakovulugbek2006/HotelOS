"use client";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { ordersApi } from "@/lib/api";
import type { OrderResponse, OrderStatus } from "@/types";
import Button from "@/components/ui/Button";
import { startConnection, joinChannel } from "@/lib/signalr";
import { useAuthStore } from "@/store/authStore";

const ALL_COLUMNS: { status: OrderStatus; label: string }[] = [
  { status: "Received", label: "Received" },
  { status: "Preparing", label: "Preparing" },
  { status: "OutForDelivery", label: "Out for Delivery" },
  { status: "Delivered", label: "Delivered" },
];

const KITCHEN_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  Received: "Preparing",
  Preparing: "OutForDelivery",
};

const SERVER_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  OutForDelivery: "Delivered",
};

export default function KitchenPage() {
  const { user } = useAuthStore();
  const isServer = user?.role === "Server";
  const isKitchen = user?.role === "KitchenStaff";
  const isManager = user?.role === "Manager";

  const NEXT_STATUS = isServer ? SERVER_NEXT : isKitchen ? KITCHEN_NEXT : { ...KITCHEN_NEXT, ...SERVER_NEXT };
  const COLUMNS = isServer
    ? ALL_COLUMNS.filter((c) => ["OutForDelivery", "Delivered"].includes(c.status))
    : ALL_COLUMNS;

  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState<string | null>(null);

  const loadOrders = useCallback(() => {
    ordersApi.getActive().then(setOrders).catch(() => toast.error("Failed to load orders")).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    let conn: Awaited<ReturnType<typeof startConnection>> | null = null;
    const setup = async () => {
      try {
        conn = await startConnection();
        await joinChannel("kitchen");
        conn.on("OrderCreated", () => {
          toast("New order received");
          loadOrders();
        });
        conn.on("OrderUpdated", () => { loadOrders(); });
      } catch { /* SignalR unavailable */ }
    };
    setup();
    return () => {
      conn?.off("OrderCreated");
      conn?.off("OrderUpdated");
    };
  }, [loadOrders]);

  const advanceOrder = async (order: OrderResponse) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setAdvancing(order.id);
    try {
      const updated = await ordersApi.updateStatus(order.id, next);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      toast.success(`Order moved to ${next}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setAdvancing(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isServer ? "Delivery Board" : "Kitchen Order Board"}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {isServer ? "Handle deliveries — OutForDelivery → Delivered" : "Manage orders from receipt to delivery"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live updates
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.status} className="bg-navy-800 border border-navy-700 rounded-xl p-4">
              <div className="h-5 bg-navy-700 rounded w-2/3 mb-4 animate-pulse" />
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-24 bg-navy-700 rounded-lg mb-3 animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-4 ${COLUMNS.length === 2 ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4"}`}>
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.status);
            return (
              <div
                key={col.status}
                className="bg-navy-800 border border-navy-700 rounded-xl p-4 min-h-[300px]"
              >
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-semibold text-white">{col.label}</h2>
                  <span className="ml-auto bg-navy-700 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                    {colOrders.length}
                  </span>
                </div>

                {colOrders.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-sm">No orders</div>
                ) : (
                  <div className="space-y-3">
                    {colOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onAdvance={() => advanceOrder(order)}
                        advancing={advancing === order.id}
                        nextStatus={NEXT_STATUS[order.status]}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  onAdvance,
  advancing,
  nextStatus,
}: {
  order: OrderResponse;
  onAdvance: () => void;
  advancing: boolean;
  nextStatus?: OrderStatus;
}) {
  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg p-3">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-white text-xs font-semibold">
            Order #{order.id.slice(0, 6).toUpperCase()}
          </p>
          <p className="text-slate-500 text-xs">
            {format(new Date(order.createdAt), "h:mm a")}
          </p>
        </div>
        <p className="text-gold-400 text-xs font-semibold">
          ${order.totalPrice.toFixed(2)}
        </p>
      </div>

      <ul className="space-y-0.5 mb-3">
        {order.items.map((item) => (
          <li key={item.menuItemId} className="text-xs text-slate-400">
            {item.quantity}× {item.menuItemName}
          </li>
        ))}
      </ul>

      {nextStatus && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onAdvance}
          loading={advancing}
          className="w-full text-xs"
        >
          → {nextStatus}
        </Button>
      )}
    </div>
  );
}
