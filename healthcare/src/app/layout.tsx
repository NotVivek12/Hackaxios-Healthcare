import './globals.css';

export const metadata = {
    title: 'AI-HealthCare',
    description: 'AI-powered healthcare platform',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Do not set lang here; the [locale] layout handles localized rendering
    return (
        <html suppressHydrationWarning>
            <body className="min-h-screen antialiased">{children}</body>
        </html>
    );
}
