import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Mascot from "@/components/Mascot";
import Footer from "@/components/Footer";
import Scene from "@/components/Scene";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bijli Audit — AI Electricity Bill Auditor & Tariff Guard",
  description:
    "Scan, audit, and analyze MEPCO electricity bills. Catch tariff slab errors, hidden tax overcharges, and stay inside the 200-unit Protected status bracket.",
  icons: {
    icon: "/bijli_audit_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col justify-between relative bg-[#F7F8FA]"
        suppressHydrationWarning
      >
        {/* Aurora gradient wash */}
        <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[42rem] h-[42rem] rounded-full bg-amber-200/40 blur-[120px]" />
          <div className="absolute -bottom-52 -right-32 w-[46rem] h-[46rem] rounded-full bg-sky-200/40 blur-[130px]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-indigo-200/25 blur-[120px]" />
        </div>

        {/* Subtle blueprint grid */}
        <div
          className="fixed inset-0 -z-10 pointer-events-none opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(15,23,42,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.045) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 0%, black 60%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at 50% 0%, black 60%, transparent 100%)",
          }}
        />

        {/* Fixed 3D Canvas Layer */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-45">
          <Scene />
        </div>

        <Navbar />
        <main className="flex-grow">{children}</main>
        <Mascot />
        <Footer />
      </body>
    </html>
  );
}