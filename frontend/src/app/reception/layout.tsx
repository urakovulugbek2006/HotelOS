"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";

const NAV = [
  { href: "/reception", label: "Overview" },
  { href: "/reception/bookings", label: "Bookings" },
  { href: "/reception/rooms", label: "Rooms" },
  { href: "/reception/walkin", label: "Walk-in" },
];

export default function ReceptionLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      title="Reception"
      navItems={NAV}
      allowedRoles={["Receptionist", "Manager"]}
    >
      {children}
    </DashboardLayout>
  );
}
