import React from 'react';

const PARAMS = [
    'EDT', 'RT20', 'RT30', 'C50', 'C80', 'D50', 'D80', 'G'
] as const;
export type ParamKey = typeof PARAMS[number];

export function ParamTabs({
    selected,
    onSelect,
}: {
    selected: ParamKey;
    onSelect: (p: ParamKey) => void;
}) {
    return (
        <div className="flex flex-row gap-2 mr-6">
        {PARAMS.map(param => (
            <button
            key={param}
            className={`px-3 py-2 rounded text-left ${selected === param ? 'bg-purple text-white font-bold' : 'bg-lightBlack text-gray-300 hover:bg-gray-700'}`}
            onClick={() => onSelect(param)}
            >
            {param}
            </button>
        ))}
        </div>
    );
}
