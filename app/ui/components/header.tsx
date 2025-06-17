'use client';

import { useEffect, useState } from 'react';

export default function Header() {
  const [latest, setLatest] = useState<{ finalRT60: number; createdAt: string } | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_REST_API}/audio`)
      .then(res => res.json())
      .then(data => {
        if (data.treatment) {
          setLatest({
            finalRT60: data.treatment.finalRT60,
            createdAt: data.treatment.createdAt,
          });
        }
      });
  }, []);

  return (
    <header className="bg-lightBlack px-8 py-4 w-full h-full col-span-2 rounded-3xl flex flex-col">
      <h2 className="text-xl font-bold mb-2">Last Treatment</h2>
      {latest ? (
        <div className="flex items-center space-x-3">
          <p className="text-gray-400">
            Date: {new Date(latest.createdAt).toLocaleString()}
          </p>
          <p className="text-gray-400">
            RT Value: {latest.finalRT60}
          </p>
        </div>
      ) : (
        <p className="text-gray-400">No data</p>
      )}
    </header>
  );
}