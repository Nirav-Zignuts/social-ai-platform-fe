import type { Metadata } from "next";
import { AdminAuthProvider } from "@/components/admin/admin-auth-provider";

export const metadata: Metadata = {
  title: "Internal Operations",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminGatewayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
