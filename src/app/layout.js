import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import CustomCursor from "@/components/CustomCursor";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Vidraria Mortágua | Engenharia & Transformação Industrial de Vidro Plano",
  description: "Líder em soluções de vidro de alta performance para arquitetura, engenharia e construção. Vidro temperado, laminado, duplo e controlo solar de máxima precisão.",
  keywords: "vidraria mortágua, vidro industrial, vidro temperado, vidro laminado, vidro duplo, controlo solar, vidro acústico, arquitetura vidro, portugal",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Vidraria Mortágua | Vidro Plano Industrial",
    description: "Transformação de vidro de alta performance com precisão milimétrica para construtores, arquitetos e engenharia.",
    type: "website",
    locale: "pt_PT",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <div className="film-grain" />
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
