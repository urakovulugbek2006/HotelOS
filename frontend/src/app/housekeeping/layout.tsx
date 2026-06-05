"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";

const NAV = [
  { href: "/housekeeping", label: "Assignments" },
];

export default function HousekeepingLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      title="Housekeeping"
      navItems={NAV}
      allowedRoles={["CleaningStaff", "Manager", "Receptionist"]}
    >
      {children}
    </DashboardLayout>
  );
}
