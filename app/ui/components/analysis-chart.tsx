'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { ParamKey } from './acoustic-params-tab';

const LineChart = dynamic(
    () => import('react-chartjs-2').then((mod) => {
        import('chart.js').then(({ Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend }) => {
        Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
        });
        return mod.Line;
    }),
    { ssr: false } // Disable SSR for this component
);

export function AnalysisChart({
    analysis,
    param,
}: {
    analysis: any[];
    param: ParamKey;
}) {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="text-gray-400 text-center py-8">Loading chart...</div>;
    
    // Prepare chart data
    const bands = analysis.map(a => a.band);
    const values = analysis.map(a => a[param]);
    
    const data = {
        labels: bands.map(b => b + ' Hz'),
        datasets: [{
        label: param,
        data: values,
        borderColor: '#a259f7',
        backgroundColor: 'rgba(162,89,247,0.2)',
        tension: 0.2,
        pointRadius: 4,
        pointBackgroundColor: '#a259f7'
        }]
    };
    
    const options = {
        responsive: true,
        plugins: {
        legend: { labels: { color: 'white' } },
        title: { display: true, text: `${param} vs Band`, color: 'white' }
        },
        scales: {
        x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
        y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
        }
    };

    return <LineChart data={data} options={options} />;
}
