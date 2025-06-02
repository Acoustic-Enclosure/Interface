'use client';

import { format } from 'date-fns';
import TuningChart from './tuning-chart';
import { Tuning } from '../../control-graphics/page';
import Link from 'next/link';

interface TuningCardProps {
    tuning: Tuning;
}

const MapToMotorNumber = (deviceId: string, motorId: number): string => {
    const deviceMotorMap: Record<string, string> = {
        'NODEMCU_01-1': '1',
        'NODEMCU_01-2': '2',
        'NODEMCU_02-1': '3',
        'NODEMCU_02-2': '4',
        'NODEMCU_03-1': '5',
        'NODEMCU_04-1': '6',
        'NODEMCU_04-2': '7',
        'NODEMCU_05-1': '8',
        'NODEMCU_05-2': '9',
    };

    const motorNumber = deviceMotorMap[`${deviceId}-${motorId}`]
    return motorNumber ? `Motor ${motorNumber}` : 'unknown';
}

export default function TuningCard({ tuning }: TuningCardProps) {
    const formatDateTime = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
        } catch (e) {
            console.error('Error formatting date:', e);
            return 'Invalid date';
        }
    };

    return (
        <div className="bg-lighterBlack p-4 rounded-lg shadow-md">
            <h3 className="font-bold text-lg mb-2">
                {MapToMotorNumber(tuning.deviceId, tuning.motorId)}
            </h3>
            <div className="mb-4 text-sm">
                <p>
                    <span className="font-semibold">Started:</span>{" "}
                    {formatDateTime(tuning.startedAt)}
                </p>
                {tuning.finishedAt && (
                    <p>
                        <span className="font-semibold">Finished:</span>{" "}
                        {formatDateTime(tuning.finishedAt)}
                    </p>
                )}
                {tuning.finishedAt && (
                    <p>
                        <span className="font-semibold">Duration:</span>{" "}
                        {((new Date(tuning.finishedAt).getTime() - new Date(tuning.startedAt).getTime()) / 1000).toFixed(2)} seconds
                    </p>
                )}
                <p>
                    <span className="font-semibold">PID Values:</span> Kp={tuning.kGains.kp?.toFixed(2)},
                    Ki={tuning.kGains.ki?.toFixed(2)}, Kd={tuning.kGains.kd?.toFixed(2)}
                </p>
            </div>
            <div className="h-64 mb-4">
                <TuningChart 
                setpoint={tuning.setpoint}
                input={tuning.input}
                output={tuning.output}
                />
            </div>
            <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-400">
                    <p>Data points: {tuning.setpoint.length}</p>
                </div>
                <Link 
                    href={`/control-graphics/${tuning._id}`}
                    className="px-2 py-1 bg-purple rounded-md hover:bg-opacity-90 text-xs"
                >
                    View Details
                </Link>
            </div>
        </div>
    );
}
