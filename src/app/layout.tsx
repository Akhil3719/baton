import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Baton - Evidence-Linked Knowledge Handover",
  description: "Transform project sources into verified, role-appropriate handovers with cryptographic citation integrity.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased">
        <Navbar currentUser={currentUser} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
