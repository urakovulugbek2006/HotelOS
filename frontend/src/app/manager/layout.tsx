"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";

const NAV = [
  { href: "/manager", label: "Overview" },
  { href: "/manager/staff", label: "Staff" },
  { href: "/manager/clients", label: "Clients" },
  { href: "/manager/rooms", label: "Rooms" },
  { href: "/manager/bookings", label: "Bookings" },
  { href: "/manager/payments", label: "Payments" },
  { href: "/manager/menu", label: "Menu" },
  { href: "/manager/orders", label: "Orders" },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      title="Manager"
      navItems={NAV}
      allowedRoles={["Manager"]}
    >
      {children}
    </DashboardLayout>
  );
}
