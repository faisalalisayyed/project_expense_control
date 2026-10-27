
import { LanguageProvider } from "@/i18n/LanguageProvider";
import "./globals.css";

export const metadata = {
  title: "Project Expense Control",
  description: "Al-Mina Contracting Co. — Jeddah Operations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
