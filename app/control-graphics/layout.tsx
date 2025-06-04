"use client";

import { Suspense } from 'react';
import { TuningProvider } from '../context/TuningContext';
import SearchParamsHandler from '../ui/components/search-params';

export default function ControlGraphicsLayout({ 
    children 
}: { 
    children: React.ReactNode 
}) {
    return (
        <TuningProvider>
        <Suspense fallback={null}>
            <SearchParamsHandler />
        </Suspense>
        {children}
        </TuningProvider>
    );
}