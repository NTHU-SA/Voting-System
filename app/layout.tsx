import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "國立清華大學學生會投票系統",
  description: "NTHUSA Voting System",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
