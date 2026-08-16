import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const rubik = Rubik({
  weight: ['400', '500', '700'],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stay Q Admin - Command Center",
  description: "Enterprise Control for Stay Q",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{__html: `
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          }
        `}} />
      </head>
      <body className={`${rubik.className} bg-background text-on-background font-body-md text-body-md antialiased overflow-x-hidden flex min-h-screen`}>
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-background">
          <Header />
          <div className="flex-1 p-gutter max-w-[1440px] mx-auto w-full space-y-xl overflow-y-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
