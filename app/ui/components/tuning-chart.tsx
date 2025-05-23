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

interface TuningChartProps {
    setpoint: number[];
    input: number[];
    output: number[];
}

export default function TuningChart({ setpoint, input, output }: TuningChartProps) {
    // Create labels as indexes (0, 1, 2, ...)
    const labels = Array.from({ length: setpoint.length }, (_, i) => i.toString());
    
    const data = {
        labels,
        datasets: [
        {
            label: 'Setpoint',
            data: setpoint,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderWidth: 2,
            pointRadius: 0, // No points for cleaner look
        },
        {
            label: 'Input',
            data: input,
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            borderWidth: 2,
            pointRadius: 0,
        },
        {
            label: 'Output',
            data: output,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderWidth: 2,
            pointRadius: 0,
        },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
        mode: 'index' as const,
        intersect: false,
        },
        plugins: {
        legend: {
            position: 'top' as const,
            labels: {
            color: 'white', // Match the light theme
            font: {
                size: 10
            }
            }
        },
        tooltip: {
            enabled: true,
        },
        },
        scales: {
        y: {
            beginAtZero: true,
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
            maxTicksLimit: 8
            }
        },
        },
    };

    return <Line data={data} options={options} />;
}
