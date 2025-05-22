"use client";

import '@/app/ui/global.css';
import '@/app/ui/components/sidenav';
import Sidenav from "@/app/ui/components/sidenav";
import Header from "@/app/ui/components/header";
import Connection from "@/app/ui/components/connection";

import { MQTTProvider } from './context/MQTTContext';

import { Readex_Pro } from "next/font/google";
const readexPro = Readex_Pro({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${readexPro.className} antialiased p-10 grid grid-cols-layout grid-rows-layout gap-5`} >
        <MQTTProvider>
          <Sidenav />
          <Header />
          <Connection />
          <main className="bg-lightBlack px-5 py-6 w-full h-full col-span-4 row-span-5 rounded-3xl overflow-y-auto">
            {children}
          </main>
        </MQTTProvider>
      </body>
    </html>
  );
}
