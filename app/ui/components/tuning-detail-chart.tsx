'use client';

import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface TuningDetailChartProps {
    setpoint?: number[];
    input?: number[];
    output?: number[];
    title: string;
    showLegend?: boolean;
}

export default function TuningDetailChart({ 
    setpoint, 
    input, 
    output, 
    title,
    showLegend = true
}: TuningDetailChartProps) {
    // Determine the longest dataset length to create labels
    let maxLength = 0;
    if (setpoint) maxLength = Math.max(maxLength, setpoint.length);
    if (input) maxLength = Math.max(maxLength, input.length);
    if (output) maxLength = Math.max(maxLength, output.length);
    
    // Create labels as indexes (0, 1, 2, ...)
    const labels = Array.from({ length: maxLength }, (_, i) => i.toString());
    
    const datasets = [];
    
    if (setpoint) {
        datasets.push({
            label: 'Setpoint',
            data: setpoint,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderWidth: 2,
            pointRadius: 1,
        });
    }
    
    if (input) {
        datasets.push({
            label: 'Input',
            data: input,
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            borderWidth: 2,
            pointRadius: 1,
        });
    }
    
    if (output) {
        datasets.push({
            label: 'Output',
            data: output,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderWidth: 2,
            pointRadius: 1,
        });
    }
    
    const data = {
        labels,
        datasets,
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            title: {
                display: true,
                text: title,
                color: 'white',
                font: {
                    size: 16
                }
            },
            legend: {
                display: showLegend,
                position: 'top' as const,
                labels: {
                    color: 'white',
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                enabled: true,
                mode: 'index' as const,
            },
        },
        scales: {
            y: {
                beginAtZero: false,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 10
                }
            },
        },
    };

    return <Line data={data} options={options} />;
}
