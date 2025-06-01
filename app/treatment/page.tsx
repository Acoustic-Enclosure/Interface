'use client';

import { useState, useEffect, useRef } from 'react';

// Define room dimensions interface
interface RoomDimensions {
  length: number; // meters
  width: number;  // meters
  height: number; // meters
}

// Define acoustic parameters interface
interface AcousticParams {
  RT60: number;
  D50: number;
  D80: number;
  C50: number;
  C80: number;
  G: number;
}

export default function Treatment() {
  const roomDim = {
    length: 5,
    width: 4,
    height: 3
  } as RoomDimensions;

  const minRT60 = 0.2;
  const maxRT60 = 2.0;

  // State for RT60 and calculated parameters
  const [rt60, setRt60] = useState(0.8);
  const [params, setParams] = useState<AcousticParams>({
    RT60: rt60,
    D50: 0,
    D80: 0,
    C50: 0,
    C80: 0,
    G: 0
  });

  // Animation states for the other sliders
  const [animatedParams, setAnimatedParams] = useState<AcousticParams>({...params});
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Help modal state
  const [showHelp, setShowHelp] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  // Calculate acoustic parameters based on RT60 and room dimensions
  function estimateParams(RT60: number, roomDim: RoomDimensions): Omit<AcousticParams, 'RT60'> {
    const tau = RT60 / 13.8155;
    const C50 = 10 * Math.log10(Math.exp(2 * 0.05 / tau) - 1);
    const C80 = 10 * Math.log10(Math.exp(2 * 0.08 / tau) - 1);

    const D50 = 1 - Math.exp(-2 * 0.05 / tau);
    const D80 = 1 - Math.exp(-2 * 0.08 / tau); // Fixed from original

    // Calculate room volume
    const roomVolume = roomDim.length * roomDim.width * roomDim.height;
    const G = 10 * Math.log10(RT60 / roomVolume);

    return { D50, D80, C50, C80, G };
  }

  // Handle RT60 slider change
  const handleRT60Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRT60 = parseFloat(e.target.value);
    console.log(`RT60 changed to: ${newRT60}s`);
    setRt60(newRT60);
  };

  // Update parameters when RT60 change
  useEffect(() => {
    const newParams = {
      RT60: rt60,
      ...estimateParams(rt60, roomDim)
    };
    setParams(newParams);

    // Clear any existing animation
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }

    // Animate the parameters over time
    const animateParams = () => {
      setAnimatedParams(prev => {
        const newAnimatedParams = { ...prev };
        let needsUpdate = false;

        // For each parameter, move it slightly toward target
        Object.keys(params).forEach(key => {
          const k = key as keyof AcousticParams;
          if (k === 'RT60') return; // Skip RT60 as it's directly user-controlled

          const target = params[k];
          const current = prev[k];
          const diff = target - current;

          // If we're close enough, just set to target
          if (Math.abs(diff) < 0.01) {
            newAnimatedParams[k] = target;
          } else {
            // Otherwise move 5% of the way to the target
            newAnimatedParams[k] = current + diff * 0.05;
            needsUpdate = true;
          }
        });

        if (needsUpdate) {
          animationRef.current = setTimeout(animateParams, 14); // ~60fps
        }

        return newAnimatedParams;
      });
    };

    // Debounce the animation start
    const debounceDelay = 350; // Delay in milliseconds
    const debouncedAnimateParams = () => {
      if (animationRef.current) {
      clearTimeout(animationRef.current);
      }
      animationRef.current = setTimeout(animateParams, debounceDelay);
    };

    debouncedAnimateParams();

    // Clean up on unmount
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [rt60]);

  // Calculate normalized value (0-100) for displaying sliders
  const normalizeValue = (value: number, min: number, max: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  // Parameter slider ranges for display
  const parameterRanges = {
    D50: { min: 0, max: 1 },
    D80: { min: 0, max: 1 },
    C50: { min: -15, max: 15 },
    C80: { min: -5, max: 20 },
    G: { min: -15, max: 15 }
  };
  
  // Format parameter values for display
  const formatParam = (key: keyof AcousticParams, value: number): string => {
    switch(key) {
      case 'RT60':
        return `${value.toFixed(2)}s`;
      case 'D50':
      case 'D80':
        return `${(value * 100).toFixed(0)}%`;
      case 'C50':
      case 'C80':
      case 'G':
        return `${value.toFixed(1)} dB`;
      default:
        return value.toFixed(2);
    }
  };

  return (
    <section className="h-full">
      <div className="flex items-center mb-6 relative">
        <h1 className="text-4xl text-foreground">Acoustic Treatment</h1>

        {/* Help icon */}
        <div 
          className="ml-3 w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple transition-colors"
          onMouseEnter={() => setShowHelp(true)}
          onMouseLeave={() => setShowHelp(false)}
        >
          <span className="text-white text-sm font-bold">?</span>
        </div>

        {/* Help modal */}
        {showHelp && (
          <div
            className="absolute top-full bg-lighterBlack rounded-lg p-6 z-50 shadow-xl w-full max-w-2xl"
            ref={helpRef}
            style={{ animation: 'fadeIn 0.2s ease-out' }}
          >
            <h2 className="text-2xl mb-2">Acoustic Parameters</h2>
            <div className="flex flex-col md:flex-column justify-between gap-8">
              <div className="mb-2">
                <p className="mb-2">Room volume: {(roomDim.length * roomDim.width * roomDim.height).toFixed(1)} m³</p>
                <p>Adjust the RT60 (Reverberation Time) to see how it affects other acoustic parameters.</p>
              </div>

              <div className="p-4 bg-lightBlack rounded-lg">
                <h3 className="font-bold mb-2">Parameter Explanations</h3>
                <ul className="space-y-2 text-sm">
                  <li><strong>RT60</strong>: Reverberation time, the time it takes for sound to decay by 60 dB</li>
                  <li><strong>D50</strong>: Definition, the ratio of early energy (0-50ms) to total energy</li>
                  <li><strong>D80</strong>: Definition, the ratio of early energy (0-80ms) to total energy</li>
                  <li><strong>C50</strong>: Clarity, the ratio of early to late energy (in dB) with 50ms boundary</li>
                  <li><strong>C80</strong>: Clarity, the ratio of early to late energy (in dB) with 80ms boundary</li>
                  <li><strong>G</strong>: Sound strength, relative to free field at 10m (in dB)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className='p-6 flex flex-col items-center'>
        <div className="flex justify-center space-x-12 overflow-x-auto pb-4">
          {/* RT60 Slider - Interactive */}
          <div className="flex flex-col items-center">
        <div className="text-center mb-2 font-bold">RT60</div>
        <div className="h-64 w-5 bg-background rounded-full relative mb-2">
          <div className="absolute bottom-0 left-0 right-0 bg-purple rounded-full"
          style={{ 
            height: `${normalizeValue(rt60, minRT60, maxRT60)}%`,
            transition: 'height 0.3s ease-out'
          }}>
          </div>
          <input 
            type="range"
            min={minRT60}
            max={maxRT60}
            step="0.01"
            value={rt60}
            onChange={handleRT60Change}
            //@ts-expect-error This works and is supported on firefox and chrome
            orient="vertical"
            className="absolute bottom-0 left-0 w-5 h-64 opacity-0 cursor-pointer"
          />
        </div>
          <div className="text-sm text-center w-20">{formatParam('RT60', rt60)}</div>
          </div>
          
          {/* Other parameter sliders - Animated based on calculation */}
          {Object.entries(parameterRanges).map(([key, range]) => {
        const paramKey = key as keyof typeof parameterRanges;
        const value = animatedParams[paramKey];
        const height = normalizeValue(value, range.min, range.max);

        return (
          <div key={key} className="flex flex-col items-center">
            <div className="text-center mb-2 font-bold">{paramKey}</div>
            <div className="h-64 w-5 bg-background rounded-full relative mb-2">
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gray-500 rounded-full"
            style={{ 
              height: `${Math.max(0, Math.min(100, height))}%`,
              transition: 'height 0.5s ease-out'
            }}>
          </div>
            </div>
            <div className="text-sm text-center w-20">{formatParam(paramKey as keyof AcousticParams, value)}</div>
          </div>
        );
          })}
        </div>
        <button className="mt-6 px-6 py-4 bg-purple text-white rounded-lg hover:bg-purpleDark transition-colors w-3/4">
          <p className="text-2xl">Start Treatment</p>
        </button>
      </div>
    </section>
  );
}