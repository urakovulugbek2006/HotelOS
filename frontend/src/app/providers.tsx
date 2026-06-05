"use client";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import SignalRProvider from "@/components/SignalRProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <SignalRProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#f1f5f9",
            border: "1px solid #334155",
          },
          success: { iconTheme: { primary: "#f59e0b", secondary: "#1e293b" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#1e293b" } },
        }}
      />
    </SignalRProvider>
  );
}
