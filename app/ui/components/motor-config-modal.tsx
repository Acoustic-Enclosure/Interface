"use client";

import { useState, useEffect } from "react";

interface MotorConfigModalProps {
    motorId: string;
    onClose: () => void;
}

interface PIDConfig {
    kp: number;
    ki: number;
    kd: number;
}

export default function MotorConfigModal({ motorId, onClose }: MotorConfigModalProps) {
    const [kp, setKp] = useState("0.0");
    const [ki, setKi] = useState("0.0");
    const [kd, setKd] = useState("0.0");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [deviceId, rawMotorId] = motorId.split('-');

  // Map motor IDs to device IDs
    const getMotorNumberFromDeviceId = (key: string) => {
        if (key === 'NODEMCU_01-1') return "1";
        if (key === 'NODEMCU_01-2') return "2";
        if (key === 'NODEMCU_02-1') return "3";
        if (key === 'NODEMCU_02-2') return "4";
        if (key === 'NODEMCU_03-1') return "5";
        if (key === 'NODEMCU_03-2') return "6";
        if (key === 'NODEMCU_04-1') return "7";
        if (key === 'NODEMCU_04-2') return "8";
        else return "9"; // For motor 9
    };

    // Fetch current PID configuration when modal opens
    useEffect(() => {
        const fetchCurrentPIDConfig = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_REST_API}/config/motor/${deviceId}/${rawMotorId}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch PID configuration: ${response.status}`);
                }

                const config: PIDConfig = await response.json();
                console.log(`Current PID configuration for motor ${motorId}:`, config);

                // Update state with current values
                setKp(config.kp.toString());
                setKi(config.ki.toString());
                setKd(config.kd.toString());
                setError(null);
            } catch (err) {
                console.error("Error fetching PID configuration:", err);
                setError("Failed to load current PID values. Using defaults.");
                // Keep default values
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchCurrentPIDConfig();
    }, [deviceId, rawMotorId, motorId]);

    const savePidConfig = async () => {
        const pidConfig = {
            kp: parseFloat(kp),
            ki: parseFloat(ki),
            kd: parseFloat(kd)
        };

        // Save to database via REST API only (no MQTT publish)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_REST_API}/config/motor/${deviceId}/${rawMotorId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pidConfig),
            });

            if (!response.ok) {
                throw new Error(`Failed to save PID configuration: ${response.status}`);
            }

            console.log(`PID configuration saved for motor ${motorId}:`, pidConfig);
            onClose();
        } catch (err) {
            console.error("Error saving PID configuration:", err);
            setError("Failed to save configuration. Please try again.");
            // Don't close the modal on error so user can try again
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-lightBlack p-6 rounded-xl w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Configure Motor {getMotorNumberFromDeviceId(motorId)} PID</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
                        &times;
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="bg-rosyBrown bg-opacity-20 p-3 rounded mb-4">
                                <p className="text-rosyBrown text-sm">{error}</p>
                            </div>
                        )}
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block mb-1">Proportional Gain (Kp):</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={kp}
                                    onChange={(e) => setKp(e.target.value)}
                                    className="bg-lighterBlack border border-gray-700 p-2 rounded w-full"
                                />
                            </div>

                            <div>
                                <label className="block mb-1">Integral Gain (Ki):</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={ki}
                                    onChange={(e) => setKi(e.target.value)}
                                    className="bg-lighterBlack border border-gray-700 p-2 rounded w-full"
                                />
                            </div>

                            <div>
                                <label className="block mb-1">Derivative Gain (Kd):</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={kd}
                                    onChange={(e) => setKd(e.target.value)}
                                    className="bg-lighterBlack border border-gray-700 p-2 rounded w-full"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-600 rounded hover:bg-opacity-90"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={savePidConfig}
                                className="px-4 py-2 bg-purple rounded hover:bg-opacity-90"
                            >
                                Save PID Configuration
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}