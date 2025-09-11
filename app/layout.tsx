import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
	title: "Yahuah Dabar Admin Dashboard",
	description: "Admin dashboard for managing Yahuah Dabar content",
	authors: [
		{
			name: "Gsoft Interactive Technologies",
			url: "https://gsoftinteractive.com/",
		},
		{
			name: " Apus Industries Limited",
			url: "https://apusindustries.vercel.app",
		},
	],
	keywords: ["Bible", "Hebrew", "Yahuah Dabar"],
	creator: "Gsoft Team",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning>
			<body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange>
					<AuthProvider>
						<Suspense fallback={null}>
							{children}
							<Toaster />
						</Suspense>
					</AuthProvider>
				</ThemeProvider>
				<Analytics />
			</body>
		</html>
	);
}
