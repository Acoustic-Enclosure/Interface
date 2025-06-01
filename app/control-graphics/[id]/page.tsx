'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import TuningDetailChart from '../../ui/components/tuning-detail-chart';
import { Tuning } from '../page';

export default function TuningDetail() {
    const params = useParams();
    const router = useRouter();
    const [tuning, setTuning] = useState<Tuning | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTuningDetail() {
            if (!params.id) return;

            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_REST_API}/tunings/${params.id}`
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch tuning: ${response.status}`);
                }

                const responseData = await response.json();
                setTuning(responseData);
                setError(null);
            } catch (err) {
                console.error('Error fetching tuning detail:', err);
                setError('Failed to load tuning data. Please try again.');
            } finally {
                setLoading(false);
            }
        }

        fetchTuningDetail();
    }, [params.id]);

    const formatDateTime = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
        } catch (e) {
            console.error('Error formatting date:', e);
            return 'Invalid date';
        }
    };

    const getMotorNumber = (deviceId: string, motorId: number): string => {
        const deviceMotorMap: Record<string, string> = {
            'NODEMCU_01-1': '1',
            'NODEMCU_01-2': '2',
            'NODEMCU_02-1': '3',
            'NODEMCU_02-2': '4',
            'NODEMCU_03-1': '5',
            'NODEMCU_03-2': '6',
            'NODEMCU_04-1': '7',
            'NODEMCU_04-2': '8',
            'NODEMCU_05-1': '9',
        };

        const motorNumber = deviceMotorMap[`${deviceId}-${motorId}`]
        return motorNumber ? `Motor ${motorNumber}` : 'unknown';
    };

    return (
        <section className="h-full">
            <div className="flex items-center mb-6">
                <button 
                    onClick={() => router.back()}
                    className="mr-4 px-3 py-1 bg-lighterBlack hover:bg-gray-700 rounded-md"
                >
                    &larr; Back
                </button>
                <h1 className="text-4xl text-foreground">Tuning Details</h1>
            </div>

            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="w-10 h-10 border-4 border-purple border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {error && (
                <div className="bg-rosyBrown bg-opacity-20 p-4 rounded-md mb-6">
                    <p className="text-white">{error}</p>
                </div>
            )}

            {!loading && !error && tuning && (
                <div className="bg-lighterBlack p-6 rounded-lg shadow-lg">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold mb-4">
                            {getMotorNumber(tuning.deviceId, tuning.motorId)}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p><span className="font-semibold">Device ID:</span> {tuning.deviceId}</p>
                                <p><span className="font-semibold">Motor ID:</span> {tuning.motorId}</p>
                                <p><span className="font-semibold">Started:</span> {formatDateTime(tuning.startedAt)}</p>
                                {tuning.finishedAt && (
                                    <p><span className="font-semibold">Finished:</span> {formatDateTime(tuning.finishedAt)}</p>
                                )}
                            </div>
                            <div>
                                <p><span className="font-semibold">PID Configuration:</span></p>
                                <ul className="list-disc ml-6">
                                    <li>Kp: {tuning.kGains.kp.toFixed(2)}</li>
                                    <li>Ki: {tuning.kGains.ki.toFixed(2)}</li>
                                    <li>Kd: {tuning.kGains.kd.toFixed(2)}</li>
                                </ul>
                            </div>
                            <div>
                                <p className="mt-2"><span className="font-semibold">Data Points:</span> {tuning.setpoint.length}</p>
                                {tuning.finishedAt && (
                                    <p>
                                        <span className="font-semibold">Duration:</span> {' '}
                                        {((new Date(tuning.finishedAt).getTime() - new Date(tuning.startedAt).getTime()) / 1000).toFixed(2)} seconds
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="bg-lightBlack p-4 rounded-lg">
                            <div className="h-80">
                                <TuningDetailChart
                                    setpoint={tuning.setpoint}
                                    input={tuning.input}
                                    title="Setpoint and Input"
                                />
                            </div>
                        </div>
                        
                        <div className="bg-lightBlack p-4 rounded-lg">
                            <div className="h-80">
                                <TuningDetailChart
                                    output={tuning.output}
                                    title="Output"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}