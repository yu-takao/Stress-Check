import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@aws-amplify/ui-react/styles.css";
import { AmplifyProvider } from './components/AmplifyProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ストレスチェックビューア",
  description: "ストレスチェック結果を可視化するアプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AmplifyProvider>
          {children}
        </AmplifyProvider>
      </body>
    </html>
  );
}
