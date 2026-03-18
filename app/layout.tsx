import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LegalCorners — Cession de parts",
  description: "Générez vos actes de cession et PV AG en quelques minutes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
