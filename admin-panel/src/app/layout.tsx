import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import AdminAuthGuard from "@/components/AdminAuthGuard";

const rubik = Rubik({
  weight: ['400', '500', '700'],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stay Q Admin - Command Center",
  description: "Enterprise Control & Operations for Stay Q",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className={`${rubik.className} bg-[#f8fafc] text-[#0f172a] antialiased overflow-x-hidden min-h-screen`}>
        <AdminAuthProvider>
          <AdminAuthGuard>
            {children}
          </AdminAuthGuard>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
