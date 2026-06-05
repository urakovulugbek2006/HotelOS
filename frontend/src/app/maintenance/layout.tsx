"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";

const NAV = [
  { href: "/maintenance", label: "Tickets" },
];

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      title="Maintenance"
      navItems={NAV}
      allowedRoles={["MaintenanceStaff", "Manager", "Receptionist"]}
    >
      {children}
    </DashboardLayout>
  );
}
