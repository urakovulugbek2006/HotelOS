"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";

const NAV = [
  { href: "/kitchen", label: "Order Board" },
];

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      title="Kitchen"
      navItems={NAV}
      allowedRoles={["KitchenStaff", "Server", "Manager"]}
    >
      {children}
    </DashboardLayout>
  );
}
