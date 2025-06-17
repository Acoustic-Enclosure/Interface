'use client';

import { useEffect, useState } from 'react';
import { ParamTabs, ParamKey } from './ui/components/acoustic-params-tab';
import { AnalysisChart } from './ui/components/analysis-chart';

interface Analysis {
    band: number;
    EDT?: number;
    RT20?: number;
    RT30?: number;
    C50?: number;
    C80?: number;
    D50?: number;
    D80?: number;
    G?: number;
}

interface Treatment {
    _id: string;
    desiredRT60: number;
    initialRT60: number;
    finalRT60: number;
    roomVolume: number;
    createdAt: string;
    analysis: Analysis[] | null;
}

export default function Home() {
    const [latest, setLatest] = useState<Treatment | null>(null);
    const [analysis, setAnalysis] = useState<Analysis[]>([]);
    const [selectedParam, setSelectedParam] = useState<ParamKey>('EDT');
    const [loadingAudio, setLoadingAudio] = useState(true);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);

    useEffect(() => {
        setLoadingAudio(true);
        fetch(`${process.env.NEXT_PUBLIC_REST_API}/audio`)
            .then(res => res.json())
            .then(data => {
                if (data.treatment) setLatest(data.treatment);
            })
            .finally(() => setLoadingAudio(false));
    }, []);

    useEffect(() => {
        if (!latest) return;
        if (Array.isArray(latest.analysis) && latest.analysis.length > 0) {
            setAnalysis(latest.analysis);
        } else if (latest._id) {
            setLoadingAnalysis(true);
            fetch(`${process.env.NEXT_PUBLIC_REST_API}/audio/analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ treatmentId: latest._id }),
            })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data.analysis)) setAnalysis(data.analysis);
                })
                .finally(() => setLoadingAnalysis(false));
        }
    }, [latest]);

    return (
        <section className="h-full">
            <h1 className="text-4xl mb-6">Latest Successful Treatment</h1>
            <div className="grid grid-cols-6 gap-6">
                <div className="col-span-2">
                    {loadingAudio ? (
                        <div className="text-gray-400 text-center py-8">Loading treatment...</div>
                    ) : latest ? (
                        <div className="space-y-2 text-lg text-white mb-8">
                            <div>
                                <span className="font-semibold text-gray-300">Desired RT:</span> {latest.desiredRT60.toFixed(2)}s
                            </div>
                            <div>
                                <span className="font-semibold text-gray-300">Initial RT:</span> {latest.initialRT60.toFixed(2)}s
                            </div>
                            <div>
                                <span className="font-semibold text-gray-300">Final RT:</span> {latest.finalRT60.toFixed(2)}s
                            </div>
                            <div>
                                <span className="font-semibold text-gray-300">Room Volume:</span> {latest.roomVolume} m³
                            </div>
                            <div>
                                <span className="font-semibold text-gray-300">Date:</span> {new Date(latest.createdAt).toLocaleString()}
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-400">No treatments data found.</div>
                    )}
                </div>
                <div className="col-span-4 flex flex-col items-center w-full">
                    <ParamTabs selected={selectedParam} onSelect={setSelectedParam} />
                    <div className="flex-1 w-full">
                        {loadingAudio || loadingAnalysis ? (
                            <div className="text-gray-400 text-center py-8">
                                {loadingAudio ? 'Loading treatment...' : 'Loading analysis...'}
                            </div>
                        ) : (
                            <AnalysisChart analysis={analysis} param={selectedParam} />
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
