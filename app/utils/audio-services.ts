/**
 * Audio measurement utility functions
 */

/**
 * Loads an audio file from URL and decodes it to AudioBuffer
 */
export async function loadAudioFile(
    url: string,
    audioContext: AudioContext
): Promise<AudioBuffer> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch audio file: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
        console.error('Error loading audio file:', error);
        throw error;
    }
}

/**
 * Records audio from microphone while playing a specified audio file
 */
export async function playAndRecord(
    audioUrl: string, 
    onStatusUpdate?: (status: string) => void
): Promise<AudioBuffer> {
    return new Promise(async (resolve, reject) => {
        try {
            const audioContext = new AudioContext();
            
            // Load sweep file
            onStatusUpdate?.('Loading sweep audio file...');
            const sweepBuffer = await loadAudioFile(audioUrl, audioContext);
            
            onStatusUpdate?.('Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            onStatusUpdate?.('Microphone access granted');
            
            // Setup recording
            const recordedChunks: Float32Array[] = [];
            let recordedLength = 0;
            
            // Setup microphone input
            const micSource = audioContext.createMediaStreamSource(stream);
            const recorder = audioContext.createScriptProcessor(4096, 1, 1);
            
            // Connect recorder
            micSource.connect(recorder);
            recorder.connect(audioContext.destination);
            
            // Setup recording handler
            recorder.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const chunk = new Float32Array(inputData.length);
                chunk.set(inputData);
                recordedChunks.push(chunk);
                recordedLength += chunk.length;
            };
            
            // Create source for playback
            const source = audioContext.createBufferSource();
            source.buffer = sweepBuffer;
            source.connect(audioContext.destination);
            
            // Start playback and recording
            onStatusUpdate?.('Starting playback and recording...');
            source.start();
            
            // Wait for playback to complete
            await new Promise(resolve => {
                source.onended = resolve;
            });
            
            onStatusUpdate?.('Playback completed, finalizing recording...');
            
            // Stop recording
            micSource.disconnect();
            recorder.disconnect();
            stream.getTracks().forEach(track => track.stop());
            
            // Combine recorded chunks into a single buffer
            const recordedBuffer = audioContext.createBuffer(1, recordedLength, audioContext.sampleRate);
            const recordedData = recordedBuffer.getChannelData(0);
            
            let offset = 0;
            for (const chunk of recordedChunks) {
                recordedData.set(chunk, offset);
                offset += chunk.length;
            }
            
            resolve(recordedBuffer);
        } catch (error) {
            reject(error);
        }
    });
    }

/**
 * Converts AudioBuffer to WAV Blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numOfChannels * 2; // 2 bytes per sample (16-bit)
    const sampleRate = buffer.sampleRate;
    
    const wavDataView = new DataView(new ArrayBuffer(44 + length));
    
    // RIFF chunk descriptor
    writeString(wavDataView, 0, 'RIFF');
    wavDataView.setUint32(4, 36 + length, true);
    writeString(wavDataView, 8, 'WAVE');
    
    // fmt sub-chunk
    writeString(wavDataView, 12, 'fmt ');
    wavDataView.setUint32(16, 16, true); // subchunk1Size (16 for PCM)
    wavDataView.setUint16(20, 1, true); // audioFormat (1 for PCM)
    wavDataView.setUint16(22, numOfChannels, true);
    wavDataView.setUint32(24, sampleRate, true);
    wavDataView.setUint32(28, sampleRate * numOfChannels * 2, true); // byteRate
    wavDataView.setUint16(32, numOfChannels * 2, true); // blockAlign
    wavDataView.setUint16(34, 16, true); // bitsPerSample
    
    // data sub-chunk
    writeString(wavDataView, 36, 'data');
    wavDataView.setUint32(40, length, true);
    
    // Write audio data
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        // Convert to 16-bit signed int
        const sampleInt = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        wavDataView.setInt16(offset, sampleInt, true);
        offset += 2;
        }
    }
    
    return new Blob([wavDataView], { type: 'audio/wav' });
}

// Helper function to write strings to DataView
function writeString(dataView: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
        dataView.setUint8(offset + i, string.charCodeAt(i));
    }
}