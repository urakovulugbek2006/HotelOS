import { create } from "zustand";
import { bookingsApi } from "@/lib/api";
import type { BookingResponse, BookingStatus } from "@/types";

interface BookingState {
  bookings: BookingResponse[];
  loading: boolean;
  filter: BookingStatus | "";
  fetchBookings: (status?: BookingStatus) => Promise<void>;
  setFilter: (filter: BookingStatus | "") => void;
  updateBooking: (booking: BookingResponse) => void;
  handleBookingStatusUpdated: (bookingId: string, newStatus: string) => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  loading: false,
  filter: "",

  fetchBookings: async (status) => {
    set({ loading: true });
    try {
      const bookings = await bookingsApi.getAll(status);
      set({ bookings, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setFilter: (filter) => {
    set({ filter });
    const status = filter || undefined;
    get().fetchBookings(status as BookingStatus | undefined);
  },

  updateBooking: (booking) =>
    set((s) => ({
      bookings: s.bookings.map((b) => (b.id === booking.id ? booking : b)),
    })),

  // Called by SignalRProvider when BookingStatusUpdated arrives
  handleBookingStatusUpdated: (bookingId, newStatus) =>
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: newStatus as BookingStatus } : b
      ),
    })),
}));
