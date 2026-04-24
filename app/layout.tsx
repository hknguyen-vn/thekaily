import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["vietnamese", "latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["vietnamese", "latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "The Kaily - Family Vault",
    template: "%s | The Kaily"
  },
  description: "Lưu giữ và chia sẻ những kỷ niệm quý giá của gia đình.",
  keywords: ["gia đình", "kỷ niệm", "family vault", "lưu trữ", "di sản"],
  authors: [{ name: "The Kaily Team" }],
  openGraph: {
    title: "The Kaily - Gia đình là số 1",
    description: "Nơi lưu giữ những khoảnh khắc hạnh phúc và hành trình khôn lớn của cả nhà.",
    url: "https://the-kaily.vercel.app",
    siteName: "The Kaily",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Kaily - Family Vault",
    description: "Lưu giữ những kỷ niệm quý giá của gia đình.",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
