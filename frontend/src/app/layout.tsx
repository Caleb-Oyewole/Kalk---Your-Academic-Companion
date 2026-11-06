import type { Metadata } from "next";
import "@fontsource/anton/400.css";
import "@fontsource-variable/inter/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kalk — Your CGPA, sorted",
  description:
    "Upload your result sheet as PDF or DOCX, leave out the electives, and get your CGPA in seconds.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
