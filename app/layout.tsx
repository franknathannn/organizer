import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { ScrollRestorer } from "@/components/ui/ScrollRestorer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Task Organizer & Finance Tracking",
  description: "Your personal budget, todos, planner and deadlines dashboard.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  cookies(); // opt this layout into dynamic rendering so auth state is fresh
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={`${inter.variable} ${inter.variable} ${mono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="font-body antialiased bg-base text-ink transition-colors duration-200">
        <div className="flex flex-col md:flex-row min-h-screen">
          {user && <Sidebar />}
          <main id="main-scroll-container" className="flex-1 min-w-0 w-full flex flex-col relative h-screen overflow-y-auto">
            <ScrollRestorer />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
