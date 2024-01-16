import { Bricolage_Grotesque } from "next/font/google";
import "./global.css";

const font = Bricolage_Grotesque({ subsets: ["latin"] });

export const metadata = {
  title: "Adamik",
  description: "Adamik PoC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={font.className}>{children}</body>
    </html>
  );
}
