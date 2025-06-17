'use client';

import { useState, useEffect, useRef } from 'react';
import { playAndRecord, audioBufferToWav } from '../utils/audio-services';

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
  const [processingStatus, setProcessingStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [userComment, setUserComment] = useState('');

  const roomDim = {
    length: 5.53,
    width: 5.26,
    height: 2.19
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

  // State for tunning results
  const [finalRT, setFinalRT] = useState<number | null>(null);
  const [initialRT, setInitialRT] = useState<number | null>(null);
  const [treatmentId, setTreatmentId] = useState<string | null>(null);

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

  // Function to handle audio processing
  const handleStartTreatment = async () => {
    try {
      setIsProcessing(true);
      setProcessingStatus('Starting acoustic measurement...');

      // Use pre-generated sweep file from backend
      const sweepFileUrl = `${process.env.NEXT_PUBLIC_REST_API}/audio/sweepsine`; // Endpoint that serves the sweep audio file

      // Play sweep and record response
      const recordedBuffer = await playAndRecord(sweepFileUrl, setProcessingStatus);
      if (!recordedBuffer) {
        throw new Error('Failed to record audio');
      }

      // Convert to WAV format
      setProcessingStatus('Processing recorded audio...');
      const responseWavBlob = audioBufferToWav(recordedBuffer);

      // Send to server for processing
      setProcessingStatus('Sending to server for processing...');
      const formData = new FormData();
      formData.append('desiredRT60', rt60.toString());
      formData.append('roomVolume', (roomDim.length * roomDim.width * roomDim.height).toString());
      formData.append('responseFile', responseWavBlob, 'response.wav');

      const responseFileUrl = `${process.env.NEXT_PUBLIC_REST_API}/audio/response`; // Endpoint that returns the result audio file
      const response = await fetch(responseFileUrl, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error(`Error sending response file: ${response.status}`);
      }
      const { treatmentId } = await response.json();
      setTreatmentId(treatmentId);

      // Now wait for processing to complete
      setProcessingStatus('Audio uploaded successfully. Waiting for processing...');
      const processResponse = await fetch(`${process.env.NEXT_PUBLIC_REST_API}/audio/process/${treatmentId}`);
      if (!processResponse.ok) {
        throw new Error(`Process request failed with status: ${processResponse.status}`);
      }
      const { initialRT } = await processResponse.json();
      setInitialRT(initialRT);

      // Send tuning request to server
      setProcessingStatus('Moving panels to optimal positions...');
      const tuningResponse = await fetch(`${process.env.NEXT_PUBLIC_REST_API}/audio/tune`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ treatmentId })
        }
      );
      if (!tuningResponse.ok) {
        throw new Error(`Tuning request failed with status: ${tuningResponse.status}`);
      }

      // Now measure again to see the results of the tuning
      setProcessingStatus('Measuring acoustic parameters after tuning...');
      const postTuningBuffer = await playAndRecord(sweepFileUrl, setProcessingStatus);
      if (!postTuningBuffer) {
        throw new Error('Failed to record post-tuning audio');
      }

      const postTuningWavBlob = audioBufferToWav(postTuningBuffer);
      const postTuningFormData = new FormData();
      postTuningFormData.append('treatmentId', treatmentId);
      postTuningFormData.append('finalResponseFile', postTuningWavBlob, 'final_response.wav');
      const postTuningResponse = await fetch(`${process.env.NEXT_PUBLIC_REST_API}/audio/response/final`, {
        method: 'POST',
        body: postTuningFormData
      });
      if (!postTuningResponse.ok) {
        throw new Error(`Post-tuning response upload failed: ${postTuningResponse.status}`);
      }

      const postTuningProcessResponse = await fetch(`${process.env.NEXT_PUBLIC_REST_API}/audio/process/final/${treatmentId}`);
      if (!postTuningProcessResponse.ok) {
        throw new Error(`Post-tuning process request failed: ${postTuningProcessResponse.status}`);
      }
      const { finalRT } = await postTuningProcessResponse.json();
      setFinalRT(finalRT);

      setShowResultModal(true);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error during acoustic measurement:', error);
      setProcessingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);
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
        {isProcessing && (
          <div className="my-4 p-4 bg-lightBlack rounded-lg">
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-purple" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{processingStatus}</span>
            </div>
          </div>
        )}
        <button
          className="mt-6 px-6 py-4 bg-purple text-white rounded-lg hover:bg-purpleDark transition-colors w-3/4"
          onClick={handleStartTreatment}
        >
          <p className="text-2xl">Start Treatment</p>
        </button>
      </div>
      {showResultModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-lightBlack rounded-2xl p-8 shadow-2xl w-full max-w-md">
            <h2 className="text-3xl font-bold mb-6 text-purple text-center">Treatment Results</h2>
            <div className="mb-3 flex justify-between">
              <span className="font-semibold text-gray-300">Desired RT:</span>
              <span className="font-mono text-lg text-white">{rt60.toFixed(2)}s</span>
            </div>
            <div className="mb-3 flex justify-between">
              <span className="font-semibold text-gray-300">Initial RT:</span>
              <span className="font-mono text-lg text-white">{initialRT !== null ? initialRT.toFixed(2) : 'N/A'}s</span>
            </div>
            <div className="mb-6 flex justify-between">
              <span className="font-semibold text-gray-300">Final RT:</span>
              <span className="font-mono text-lg text-white">{finalRT !== null ? finalRT.toFixed(2) : 'N/A'}s</span>
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-semibold text-gray-200">Comments:</label>
              <textarea
                className="w-full border text-black border-gray-700 bg-darkBlack rounded-lg p-2 focus:outline-none focus:border-purple transition"
                value={userComment}
                onChange={e => setUserComment(e.target.value)}
                rows={3}
                placeholder="Share your experience..."
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <button
                className="px-5 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
                onClick={() => {
                  fetch(`${process.env.NEXT_PUBLIC_REST_API}/audio/qualify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      treatmentId,
                      success: false,
                      comment: userComment
                    })
                  });
                  setShowResultModal(false)
                }}
              >
                Close
              </button>
              <button
                className="flex items-center px-5 py-2 bg-purple text-white rounded-lg hover:bg-purpleDark transition font-semibold"
                onClick={() => {
                  fetch(`${process.env.NEXT_PUBLIC_REST_API}/audio/qualify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      treatmentId,
                      success: true,
                      comment: userComment
                    })
                  });
                  setShowResultModal(false)
                }}
              >
                <span className="mr-2 text-xl">👍</span>Thumb Up
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}