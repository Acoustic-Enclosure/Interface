'use client';

import { useState, useEffect } from 'react';
import FilterBar from '../ui/components/filter-bar';
import TuningCard from '../ui/components/tuning-card';
import Pagination from '../ui/components/pagination';
import EmptyState from '../ui/components/empty-state';

// Define the tuning data structure
interface KGains {
  kp: number;
  ki: number;
  kd: number;
  kv: number;
  ka: number;
}

export interface Tuning {
  _id: string;
  deviceId: string;
  motorId: number;
  startedAt: string;
  finishedAt?: string;
  setpoint: number[];
  input: number[];
  output: number[];
  kGains: KGains;
  createdAt: string;
  updatedAt: string;
}

export default function ControlGraphics() {
  const [tunings, setTunings] = useState<Tuning[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [filters, setFilters] = useState({
    keys: '',
  });

  // Fetch tuning data
  useEffect(() => {
    const fetchTunings = async () => {
      setLoading(true);
      try {
        // Build query params
        const queryParams = new URLSearchParams();
        queryParams.append('page', page.toString());
        queryParams.append('perPage', '9'); // 9 motors
        if (filters.keys) queryParams.append('keys', filters.keys);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_REST_API}/tunings?${queryParams.toString()}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch tuning data: ${response.status}`);
        }

        const responseData = await response.json();
        setTunings(responseData.data);
        setTotalPages(responseData.pagination.totalPages || 1);
        setError(null);
      } catch (err) {
        console.error('Error fetching tuning data:', err);
        setError('Failed to load tuning data. Please try again.');
        setTunings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTunings();
  }, [page, filters]);

  const handleFilterChange = (newFilters: typeof filters) => {
    console.log('Filters changed:', newFilters);
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <section className="h-full">
      <h1 className="text-4xl text-foreground mb-6">Control Graphics</h1>
      
      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

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

      {!loading && !error && tunings.length === 0 && <EmptyState />}

      {!loading && !error && tunings.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {tunings.map((tuning) => (
              <TuningCard key={tuning._id} tuning={tuning} />
            ))}
          </div>

          <Pagination 
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}
