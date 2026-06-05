"use client";
import type { RoomResponse } from "@/types";
import { roomStyleMeta } from "@/lib/roomStyle";
import Button from "@/components/ui/Button";

interface Props {
  room: RoomResponse;
  nights?: number;
  onReserve?: (room: RoomResponse) => void;
  ctaLabel?: string;
}

export default function RoomCard({ room, nights, onReserve, ctaLabel = "Reserve" }: Props) {
  const meta = roomStyleMeta(room.style);
  const total = nights && nights > 0 ? room.pricePerNight * nights : null;

  return (
    <div className="group glass rounded-2xl overflow-hidden shadow-card transition-all duration-300 hover:border-white/15 hover:-translate-y-1 flex flex-col">
      {/* "Photography" placeholder */}
      <div className={`relative h-44 bg-gradient-to-br ${meta.gradient} overflow-hidden`}>
        <div className="absolute inset-0 bg-dot-grid opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 to-transparent" />
        <svg
          className="absolute right-4 top-4 w-9 h-9 text-white/25"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01" />
        </svg>
        <div className="absolute left-4 bottom-3">
          <span className="text-[11px] uppercase tracking-[0.2em] text-gold-300/90 font-semibold">
            {meta.label}
          </span>
          <p className="font-display text-2xl text-white leading-none mt-0.5">
            Room {room.roomNumber}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21a8 8 0 0116 0" />
            </svg>
            {room.capacity} {room.capacity === 1 ? "guest" : "guests"}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span>Floor {room.floor}</span>
          {room.isSmokingAllowed ? (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>Smoking</span>
            </>
          ) : null}
        </div>

        <p className="text-sm text-slate-400 leading-relaxed flex-1">
          {room.description?.trim() || meta.blurb}
        </p>

        <div className="hairline my-4" />

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold text-white tabular-nums">
              ${room.pricePerNight}
              <span className="text-sm font-normal text-slate-500"> / night</span>
            </p>
            {total !== null && (
              <p className="text-xs text-gold-300 mt-0.5">
                ${total.toFixed(0)} total · {nights} {nights === 1 ? "night" : "nights"}
              </p>
            )}
          </div>
          {onReserve && (
            <Button onClick={() => onReserve(room)} size="sm">
              {ctaLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
