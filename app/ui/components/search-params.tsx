'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTuning } from '../../context/TuningContext';

export default function SearchParamsHandler() {
    const { selectTuningById } = useTuning();
    const searchParams = useSearchParams();
    const initialized = useRef(false);
    
    useEffect(() => {
        if (initialized.current) return;
        
        const tuningId = searchParams.get('id');
        if (tuningId) {
            selectTuningById(tuningId);
            initialized.current = true;
        }
    }, [searchParams, selectTuningById]);
    
    return null;
}