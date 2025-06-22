'use client';

import { useState, useEffect } from 'react';
import { ParamTabs, ParamKey } from '../ui/components/acoustic-params-tab';
import { AnalysisChart } from '../ui/components/analysis-chart';
import Pagination from '../ui/components/pagination';

interface PanelPositions {
    initial: number[];
    final: number[];
}

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
    roomVolume: number;
    desiredRT60: number;
    initialRT60: number;
    finalRT60: number;
    panelPositions: PanelPositions;
    notes: string;
    success: boolean;
    createdAt: string;
    updatedAt: string;
    analysis: Analysis[] | null;
}

interface PaginationInfo {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export default function History() {
    const [treatments, setTreatments] = useState<Treatment[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        total: 0,
        totalPages: 1,
        currentPage: 1,
        limit: 6,
        hasNext: false,
        hasPrev: false
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
    const [selectedParam, setSelectedParam] = useState<ParamKey>('EDT');

    useEffect(() => {
        fetchTreatments(pagination.currentPage);
    }, [pagination.currentPage]);

    const fetchTreatments = async (page: number) => {
        setLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_REST_API}/audio/treatments?page=${page}&limit=${pagination.limit}`
            );
            
            if (!response.ok) {
                throw new Error(`Failed to fetch treatments: ${response.status}`);
            }
            
            const data = await response.json();
            setTreatments(data.treatments);
            setPagination(data.pagination);
            setError(null);
        } catch (err) {
            console.error('Error fetching treatments:', err);
            setError('Failed to load treatments. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, currentPage: newPage }));
    };

    const viewTreatmentDetails = (treatment: Treatment) => {
        if (treatment.success) {
            setSelectedTreatment(treatment);
        }
    };

    const backToList = () => {
        setSelectedTreatment(null);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <section className="h-full">
            <h1 className="text-4xl text-foreground mb-6">Treatment History</h1>
            
            {error && (
                <div className="bg-rosyBrown bg-opacity-20 p-4 rounded-md mb-6">
                    <p className="text-white">{error}</p>
                </div>
            )}
            
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="w-10 h-10 border-4 border-purple border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            
            {!loading && !error && !selectedTreatment && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {treatments.map((treatment) => (
                            <div 
                                key={treatment._id}
                                className={`bg-lightBlack p-6 rounded-lg shadow-lg transition-all transform hover:shadow-2xl ${treatment.success ? 'border-l-4 border-green-500 cursor-pointer hover:-translate-y-1' : 'border-l-4 border-gray-500'}`}
                                onClick={() => viewTreatmentDetails(treatment)}
                            >
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h2 className="text-xl font-bold">Treatment</h2>
                                        <span className={`px-2 py-1 rounded-full text-xs ${treatment.success ? 'bg-green text-black' : 'bg-gray-700 text-gray-300'}`}>
                                            {treatment.success ? 'Success' : 'Failed'}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm">{formatDate(treatment.createdAt)}</p>
                                </div>
                                
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Desired RT60:</span>
                                        <span className="font-semibold">{treatment.desiredRT60.toFixed(2)}s</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Initial RT60:</span>
                                        <span>{treatment.initialRT60.toFixed(2)}s</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Final RT60:</span>
                                        <span className={treatment.success ? 'text-green-400' : ''}>{treatment.finalRT60?.toFixed(2)}s</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Room Volume:</span>
                                        <span>{treatment.roomVolume.toFixed(1)} m³</span>
                                    </div>
                                </div>
                                
                                {treatment.notes && (
                                    <div className="mt-4 p-2 bg-gray-800 bg-opacity-50 rounded">
                                        <p className="text-sm italic">&quot;{treatment.notes}&quot;</p>
                                    </div>
                                )}
                                
                                {treatment.success && (
                                    <div className="mt-4 text-center">
                                        <span className="text-purple text-sm">Click to view details →</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    <Pagination 
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
            
            {selectedTreatment && (
                <div className="bg-lightBlack p-6 pt-0 rounded-lg shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <div className="md:col-span-1">
                            <div className="flex flex-col items-start mb-6">
                                <button 
                                    onClick={backToList}
                                    className="mb-4 px-3 py-1 bg-lighterBlack hover:bg-gray-700 rounded-md"
                                >
                                    &larr; Back to History
                                </button>
                                <h2 className="text-2xl font-bold">Treatment Details</h2>
                            </div>
                            <div className="space-y-3 text-lg mb-6">
                                <div>
                                    <span className="font-semibold text-gray-300">Desired RT:</span> {selectedTreatment.desiredRT60.toFixed(2)}s
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-300">Initial RT:</span> {selectedTreatment.initialRT60.toFixed(2)}s
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-300">Final RT:</span> {selectedTreatment.finalRT60.toFixed(2)}s
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-300">Room Volume:</span> {selectedTreatment.roomVolume.toFixed(1)} m³
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-300">Date:</span> {formatDate(selectedTreatment.createdAt)}
                                </div>
                                {selectedTreatment.notes && (
                                    <div>
                                        <span className="font-semibold text-gray-300">Notes:</span> {selectedTreatment.notes}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-4 flex flex-col items-center">
                            <div className="mt-6">
                                <ParamTabs selected={selectedParam} onSelect={(param) => setSelectedParam(param)} />
                            </div>
                            {selectedTreatment.analysis && selectedTreatment.analysis.length > 0 ? (
                                <AnalysisChart analysis={selectedTreatment.analysis} param={selectedParam} />
                            ) : (
                                <div className="flex items-center justify-center h-64 bg-darkBlack rounded-lg">
                                    <div className="text-gray-400 text-center">
                                        <p>No analysis data available.</p>
                                        <p className="mt-2">Analysis data is missing for this treatment.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}