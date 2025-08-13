import type { Metadata } from "next";
import { ThemeProvider } from "./component/ThemeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoldGuard - Anti-Galamsey Reporting System",
  description: "Report and track illegal mining activities in Ghana. Help protect our environment and natural resources with GoldGuard's comprehensive monitoring and reporting platform.",
  keywords: ["galamsey", "illegal mining", "Ghana", "environmental protection", "mining monitoring", "goldguard", "reporting system"],
  authors: [{ name: "GoldGuard Team" }],
  creator: "GoldGuard",
  publisher: "GoldGuard",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning={true}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
