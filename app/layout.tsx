import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CLASSBRIDGE | School Management Platform",
  description:
    "A modern school management and learning platform powered by intelligent technology.",
  applicationName: "CLASSBRIDGE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
