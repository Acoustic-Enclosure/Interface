'use client';

import { useState, useEffect, useMemo } from 'react';

interface MotorMapping {
    keys: string;
}

interface FilterBarProps {
    filters: MotorMapping;
    onFilterChange: (filters: MotorMapping) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
    // Define the mapping between motor numbers and device-motor pairs
    const motorMappings = useMemo<Record<number, MotorMapping>>(() => ({
        1: { keys: 'NODEMCU_01-1' },
        2: { keys: 'NODEMCU_01-2' },
        3: { keys: 'NODEMCU_02-1' },
        4: { keys: 'NODEMCU_02-2' },
        5: { keys: 'NODEMCU_03-1' },
        6: { keys: 'NODEMCU_03-2' },
        7: { keys: 'NODEMCU_04-1' },
        8: { keys: 'NODEMCU_04-2' },
        9: { keys: 'NODEMCU_05-1' },
    }), []);
    const [selectedMotors, setSelectedMotors] = useState<number[]>([]);
    const availableMotors = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    useEffect(() => {
        if (filters.keys) {
            const newSelectedMotors: number[] = [];
            const filterKeys = filters.keys.split(',');
            Object.entries(motorMappings).forEach(([motorNumber, mapping]) => {
                if (filterKeys.includes(mapping.keys)) {
                    newSelectedMotors.push(Number(motorNumber));
                }
            });
            setSelectedMotors(newSelectedMotors.sort((a, b) => a - b));
        }
    }, [filters, motorMappings]);

    const toggleMotor = (motorNumber: number) => {
        setSelectedMotors(prev => {
            if (prev.includes(motorNumber)) {
                return prev.filter(id => id !== motorNumber);
            } else {
                return [...prev, motorNumber].sort((a, b) => a - b);
            }
        });
    };

    const handleApplyFilters = () => {
        const selectedKeys: string[] = [];
        selectedMotors.forEach(motorNumber => {
            const { keys } = motorMappings[motorNumber];
            selectedKeys.push(keys);
        });
        const filtersToSend = {
            keys: selectedKeys.join(','),
        };
        onFilterChange(filtersToSend);
    };

    const handleClearFilters = () => {
        setSelectedMotors([]);
        onFilterChange({
            keys: '',
        });
    };

    return (
        <div className="mb-6 bg-lighterBlack p-4 rounded-lg">
            <div className="flex gap-4">
                {/* Motor selection chips */}
                <div>
                    <label className="block mb-1 text-sm">Select Motors</label>
                    <div className="flex flex-wrap gap-2">
                        {availableMotors.map(motorNumber => {
                            return (
                                <button
                                    key={motorNumber}
                                    onClick={() => toggleMotor(motorNumber)}
                                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                                        selectedMotors.includes(motorNumber)
                                            ? 'bg-purple text-white'
                                            : 'bg-lightBlack text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    Motor {motorNumber}
                                </button>
                            );
                        })}
                    </div>
                    {selectedMotors.length > 0 && (
                        <div className="mt-2">
                            <p className="text-xs text-gray-400">
                                Selected motors: {selectedMotors.join(', ')}
                            </p>
                        </div>
                    )}
                    {selectedMotors.length === 0 && (
                        <div className="mt-2">
                            <p className="text-xs text-gray-400">
                                No motors selected
                            </p>
                        </div>
                    )}
                </div>
                {/* Action buttons */}
                <div className="flex space-x-2 pt-2 ml-auto">
                    <button
                        onClick={handleApplyFilters}
                        className="w-24 px-4 py-2 bg-purple rounded-xl hover:bg-opacity-90"
                    >
                        Search
                    </button>
                    <button
                        onClick={handleClearFilters}
                        className="w-24 px-4 py-2 bg-rosyBrown rounded-xl hover:bg-opacity-90"
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
}
