"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { bookingsApi, roomsApi, authApi } from "@/lib/api";
import type { RoomResponse } from "@/types";
import Button from "@/components/ui/Button";

function WalkInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const prefilledRoomId     = searchParams.get("roomId")     ?? "";
  const prefilledRoomNumber = searchParams.get("roomNumber") ?? "";

  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  const today    = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split("T")[0];

  const [guest, setGuest] = useState({
    firstName: "",
    lastName:  "",
    email:     "",
    phone:     "",
  });

  const [form, setForm] = useState({
    roomId:   prefilledRoomId,
    checkIn:  today,
    checkOut: tomorrow,
  });

  useEffect(() => {
    roomsApi.getAll("Available").then(setRooms).catch(() => {});
  }, []);

  const setGuest_ = (k: keyof typeof guest) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setGuest((g) => ({ ...g, [k]: e.target.value }));

  const setForm_ = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const resolveGuestId = async (): Promise<string> => {
    setLookingUp(true);
    try {
      const emailLower = guest.email.trim().toLowerCase();

      // Check ALL accounts first to detect staff/email conflicts
      const allUsers = await authApi.getAllUsers();
      const match = allUsers.find((u) => u.email.toLowerCase() === emailLower);

      if (match) {
        if (match.role !== "Client") {
          throw new Error(`This email belongs to a ${match.role} staff account`);
        }
        toast.success("Existing guest account found");
        return match.id;
      }

      // No account found — create a new Client
      const tempPw = "Guest" + Math.random().toString(36).slice(-6).toUpperCase() + "1!";
      const created = await authApi.registerClient({
        email:     emailLower,
        password:  tempPw,
        firstName: guest.firstName.trim(),
        lastName:  guest.lastName.trim(),
        phone:     guest.phone.trim(),
      });
      toast.success(`New guest account created (temp pw: ${tempPw})`);
      return created.id;
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const guestId = await resolveGuestId();
      await bookingsApi.walkIn({
        guestId,
        roomId:   form.roomId,
        checkIn:  new Date(form.checkIn).toISOString(),
        checkOut: new Date(form.checkOut).toISOString(),
      });
      toast.success("Walk-in booking created");
      router.push("/reception/bookings");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Walk-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-white mb-6">Walk-in Booking</h1>

      <form onSubmit={handleSubmit} className="bg-navy-800 border border-navy-700 rounded-xl p-6 space-y-5">
        {/* Guest details */}
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">Guest Details</p>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label>First Name</label>
              <input value={guest.firstName} onChange={setGuest_("firstName")} placeholder="Jane" required />
            </div>
            <div>
              <label>Last Name</label>
              <input value={guest.lastName} onChange={setGuest_("lastName")} placeholder="Smith" required />
            </div>
          </div>
          <div className="mb-3">
            <label>Email</label>
            <input
              type="email"
              value={guest.email}
              onChange={setGuest_("email")}
              placeholder="guest@example.com"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Existing account will be looked up; a new one created if not found.
            </p>
          </div>
          <div>
            <label>Phone</label>
            <input value={guest.phone} onChange={setGuest_("phone")} placeholder="+1 555 0100" required />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Check-in</label>
            <input type="date" value={form.checkIn} min={today} onChange={setForm_("checkIn")} required />
          </div>
          <div>
            <label>Check-out</label>
            <input type="date" value={form.checkOut} min={form.checkIn} onChange={setForm_("checkOut")} required />
          </div>
        </div>

        {/* Room */}
        <div>
          <label>Room</label>
          {prefilledRoomId ? (
            <div className="bg-navy-700 border border-navy-600 rounded-md px-3 py-2 text-white text-sm">
              Room {prefilledRoomNumber}
              <input type="hidden" value={form.roomId} />
            </div>
          ) : (
            <select value={form.roomId} onChange={setForm_("roomId")} required>
              <option value="">— Select available room —</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber} · {r.style} · ${r.pricePerNight}/night · Cap {r.capacity}
                </option>
              ))}
            </select>
          )}
          {rooms.length === 0 && !prefilledRoomId && (
            <p className="text-xs text-red-400 mt-1">No available rooms at the moment.</p>
          )}
        </div>

        <Button type="submit" loading={loading || lookingUp} className="w-full" size="lg">
          {lookingUp ? "Looking up guest…" : "Create Walk-in Booking"}
        </Button>
      </form>
    </div>
  );
}

export default function WalkInPage() {
  return (
    <Suspense>
      <WalkInForm />
    </Suspense>
  );
}
