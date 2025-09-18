
import React, { useState, useRef, useCallback } from 'react';

interface IdVerificationProps {
  onVerified: () => void;
}

export const IdVerification: React.FC<IdVerificationProps> = ({ onVerified }) => {
  const [status, setStatus] = useState<'idle' | 'camera' | 'uploading' | 'verifying' | 'verified'>('idle');
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startVerificationProcess = () => {
    setStatus('verifying');
    setError(null);
    setTimeout(() => {
      // Simulate successful verification
      setStatus('verified');
      setTimeout(onVerified, 1500); // Wait a moment before redirecting
    }, 2500); // Simulate ML model processing time
  };
  
  const handleStartCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus('camera');
      setError(null);
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("Camera access was denied. Please enable it in your browser settings or choose to upload a file.");
      setStatus('idle');
    }
  }, []);

  const handleCapture = () => {
    // In a real app, you'd capture a frame here and send to a server.
    // For this demo, we'll just start the simulated verification.
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    startVerificationProcess();
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // In a real app, you'd upload this file.
      // For this demo, we'll just start the simulated verification.
      setStatus('uploading');
      startVerificationProcess();
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'camera':
        return (
          <div className="text-center">
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg mb-4 border dark:border-gray-600"></video>
            <button onClick={handleCapture} className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700">
              Capture ID
            </button>
          </div>
        );
      case 'verifying':
      case 'uploading':
        return (
           <div className="text-center space-y-4 py-8">
            <svg className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="font-semibold text-lg">Analyzing ID...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we verify your credentials.</p>
           </div>
        );
      case 'verified':
        return (
             <div className="text-center space-y-4 py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <p className="font-semibold text-lg">Verification Successful!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting you to the dashboard...</p>
           </div>
        );
      case 'idle':
      default:
        return (
          <div className="space-y-4">
             {error && <p className="text-sm text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-3 rounded-md">{error}</p>}
            <button onClick={handleStartCamera} className="w-full py-3 px-4 border-2 border-blue-600 text-blue-600 font-medium rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30">
              Use Camera to Verify
            </button>
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">OR</div>
            <label className="w-full block py-3 px-4 border-2 border-dashed border-gray-400 text-gray-600 dark:text-gray-300 font-medium rounded-md hover:border-blue-500 hover:text-blue-500 text-center cursor-pointer">
              <span>Upload ID Image</span>
              <input type="file" className="sr-only" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-2">Faculty Verification</h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          To ensure platform security, please verify your staff ID.
        </p>
        {renderContent()}
      </div>
    </div>
  );
};
