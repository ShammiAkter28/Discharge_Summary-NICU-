import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Discharge Summary (NICU) - Inpatient EMR",
  description: "Next.js App Router EMR Discharge Summary (NICU) module connected to Oracle Database",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased text-slate-900">
        {children}
      </body>
    </html>
  );
}
