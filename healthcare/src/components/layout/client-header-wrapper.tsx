'use client';

import dynamic from 'next/dynamic';

// Import Header with SSR disabled to avoid hydration issues
const Header = dynamic(() => import('@/components/layout/Header'), { ssr: false });

export default function ClientHeaderWrapper() {
    return <Header />;
}
