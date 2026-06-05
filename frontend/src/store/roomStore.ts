import { create } from "zustand";
import { roomsApi } from "@/lib/api";
import type { RoomResponse, RoomStatus } from "@/types";

interface RoomState {
  rooms: RoomResponse[];
  loading: boolean;
  fetchRooms: () => Promise<void>;
  updateRoomStatus: (roomId: string, newStatus: RoomStatus) => void;
  addRoom: (room: RoomResponse) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  loading: false,

  fetchRooms: async () => {
    set({ loading: true });
    try {
      const rooms = await roomsApi.getAll();
      set({ rooms, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  updateRoomStatus: (roomId, newStatus) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id === roomId ? { ...r, status: newStatus } : r
      ),
    })),

  addRoom: (room) =>
    set((s) => ({ rooms: [...s.rooms, room] })),
}));
