'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Tuning } from '../control-graphics/page';

interface TuningContextType {
    selectedTuning: Tuning | null;
    setSelectedTuning: (tuning: Tuning | null) => void;
    selectTuningById: (id: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

const TuningContext = createContext<TuningContextType | null>(null);

export function TuningProvider({ children }: { children: ReactNode }) {
    const [selectedTuning, setSelectedTuning] = useState<Tuning | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const selectTuningById = async (id: string) => {
        setLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_REST_API}/tunings/${id}`
            );
            
            if (!response.ok) {
                throw new Error(`Failed to fetch tuning: ${response.status}`);
            }
            
            const data = await response.json();
            setSelectedTuning(data);
            setError(null);
            
            router.push(`/control-graphics/details?id=${id}`, { scroll: false });
        } catch (err) {
            console.error('Error fetching tuning:', err);
            setError('Failed to load tuning data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <TuningContext.Provider value={{
            selectedTuning,
            setSelectedTuning,
            selectTuningById,
            loading,
            error
        }}>
            {children}
        </TuningContext.Provider>
    );
}

export const useTuning = () => {
    const context = useContext(TuningContext);
    if (!context) {
        throw new Error('useTuning must be used within a TuningProvider');
    }
    return context;
};