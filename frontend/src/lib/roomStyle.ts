import type { RoomStyle } from "@/types";

interface StyleMeta {
  label: string;
  /** Tailwind gradient classes used for the "photography" placeholder */
  gradient: string;
  blurb: string;
}

const META: Record<RoomStyle, StyleMeta> = {
  Standard: {
    label: "Standard Room",
    gradient: "from-slate-700 via-slate-800 to-navy-900",
    blurb: "Comfortable and bright, with everything you need for a restful stay.",
  },
  Deluxe: {
    label: "Deluxe Room",
    gradient: "from-amber-700/70 via-navy-800 to-navy-900",
    blurb: "Extra space and elevated finishes for the discerning traveller.",
  },
  FamilySuite: {
    label: "Family Suite",
    gradient: "from-emerald-700/70 via-navy-800 to-navy-900",
    blurb: "Room to spread out, ideal for families and longer stays.",
  },
  BusinessSuite: {
    label: "Business Suite",
    gradient: "from-indigo-700/70 via-navy-800 to-navy-900",
    blurb: "A dedicated workspace and premium comforts for work and rest.",
  },
};

export function roomStyleMeta(style: RoomStyle): StyleMeta {
  return META[style] ?? META.Standard;
}

export const ROOM_STYLES: { value: RoomStyle; label: string }[] = [
  { value: "Standard", label: "Standard" },
  { value: "Deluxe", label: "Deluxe" },
  { value: "FamilySuite", label: "Family Suite" },
  { value: "BusinessSuite", label: "Business Suite" },
];
