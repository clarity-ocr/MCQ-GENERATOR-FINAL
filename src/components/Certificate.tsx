// src/components/Certificate.tsx

import React, { useRef, useState } from 'react';
import { TestAttempt } from '../types';
import { Button } from './ui/button';
import { ArrowLeft, Award, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CertificateProps {
  attempt: TestAttempt;
  onBack: () => void;
}

// Helper for safe date parsing
const formatCertDate = (dateInput: any) => {
    try {
        if (typeof dateInput === 'object' && 'seconds' in dateInput) {
            return new Date(dateInput.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        return new Date(dateInput).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return new Date().toLocaleDateString(); }
};

export const Certificate: React.FC<CertificateProps> = ({ attempt, onBack }) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setIsGenerating(true);
    try {
      // 1. High-Res Canvas Capture
      const canvas = await html2canvas(certificateRef.current, {
        scale: 3, // Higher scale for crisp text
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape, mm, A4
      const pdfWidth = 297; 
      const pdfHeight = 210;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${attempt.student.name.replace(/\s+/g, '_')}_Certificate.pdf`);
    } catch (err) {
      console.error("PDF Error", err);
      alert("Could not generate PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
  const dateStr = formatCertDate(attempt.date);

  return (
    <div className="flex flex-col items-center justify-start p-4 md:p-8 space-y-6 bg-gray-100 dark:bg-gray-900 min-h-screen overflow-auto">
      
      {/* Controls */}
      <div className="w-full max-w-5xl flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button onClick={handleDownload} className="shadow-md bg-blue-600 hover:bg-blue-700 text-white" disabled={isGenerating}>
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          {isGenerating ? "Generating..." : "Download PDF"}
        </Button>
      </div>

      {/* Preview Area - Center Aligned */}
      <div className="w-full flex justify-center overflow-x-auto py-4">
        
        {/* Certificate - Fixed A4 Dimensions (1123px x 794px) */}
        <div 
          ref={certificateRef}
          className="relative bg-white text-black w-[1123px] h-[794px] min-w-[1123px] min-h-[794px] shadow-2xl flex flex-col items-center justify-center p-12 box-border border border-gray-200"
          style={{ fontFamily: "'Times New Roman', serif" }} 
        >
            {/* Inner Border Design */}
            <div className="absolute inset-5 border-[3px] border-double border-amber-600 rounded-sm pointer-events-none"></div>
            <div className="absolute inset-7 border border-gray-300 rounded-sm pointer-events-none"></div>

            {/* Corner Ornaments (CSS Shapes) */}
            <div className="absolute top-5 left-5 w-16 h-16 border-t-[3px] border-l-[3px] border-amber-600"></div>
            <div className="absolute top-5 right-5 w-16 h-16 border-t-[3px] border-r-[3px] border-amber-600"></div>
            <div className="absolute bottom-5 left-5 w-16 h-16 border-b-[3px] border-l-[3px] border-amber-600"></div>
            <div className="absolute bottom-5 right-5 w-16 h-16 border-b-[3px] border-r-[3px] border-amber-600"></div>

            {/* --- MAIN CONTENT --- */}
            
            {/* 1. Header */}
            <div className="text-center mb-10">
                <div className="text-sm font-bold tracking-[0.3em] text-amber-700 uppercase mb-2">Quizapo AI Certifications</div>
                <h1 className="text-7xl font-bold text-gray-900 tracking-wide mb-2 uppercase" style={{ fontFamily: "serif" }}>Certificate</h1>
                <h2 className="text-3xl italic text-gray-500 font-light">of Achievement</h2>
            </div>

            {/* 2. Recipient */}
            <div className="text-center w-full max-w-4xl mb-8">
                <p className="text-lg text-gray-600 mb-6">This certificate is proudly presented to</p>
                
                <div className="text-5xl font-bold text-blue-900 border-b-2 border-gray-300 pb-4 mb-6 px-12 inline-block font-serif min-w-[50%]">
                    {attempt.student.name}
                </div>

                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                    For successfully completing the assessment 
                    <br />
                    <strong className="text-black text-2xl">"{attempt.testTitle}"</strong>
                </p>
            </div>

            {/* 3. Details Grid */}
            <div className="grid grid-cols-2 gap-24 mb-16 text-center">
                <div>
                    <span className="block text-sm text-gray-400 uppercase tracking-widest mb-1">Total Score</span>
                    <span className="block text-3xl font-bold text-gray-800">{percentage}%</span>
                </div>
                <div>
                    <span className="block text-sm text-gray-400 uppercase tracking-widest mb-1">Date Issued</span>
                    <span className="block text-3xl font-bold text-gray-800">{dateStr}</span>
                </div>
            </div>

            {/* 4. Footer / Signatures */}
            <div className="w-full max-w-4xl flex justify-between items-end px-10">
                
                {/* Signature 1 */}
                <div className="text-center">
                    <div className="w-56 border-b border-gray-400 mb-2 font-cursive text-2xl text-blue-800 pb-1" style={{fontFamily: 'cursive'}}>
                        Jeevasurya
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Platform Authority</p>
                </div>

                {/* Gold Seal */}
                <div className="relative bottom-4">
                    <SealIcon />
                </div>

                {/* Signature 2 */}
                <div className="text-center">
                     <div className="w-56 border-b border-gray-400 mb-2 font-cursive text-2xl text-blue-800 pb-1" style={{fontFamily: 'cursive'}}>
                        Verified
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Digital Verification</p>
                </div>

            </div>

            {/* ID */}
            <div className="absolute bottom-4 text-[9px] text-gray-300 font-mono tracking-wider">
                ID: {attempt.id.toUpperCase()}
            </div>

        </div>
      </div>
    </div>
  );
};

// Decorative Seal Component
const SealIcon = () => (
    <div className="w-32 h-32 relative flex items-center justify-center">
        {/* Starburst Shape using CSS clip-path or SVG */}
        <svg viewBox="0 0 200 200" className="w-full h-full text-yellow-500 drop-shadow-md">
            <path fill="currentColor" d="M100,10 L123,60 L177,60 L135,95 L155,145 L100,115 L45,145 L65,95 L23,60 L77,60 Z" transform="scale(1.1) translate(-10,-5)" opacity="0.3" />
            <circle cx="100" cy="100" r="70" fill="white" stroke="#B45309" strokeWidth="3" />
            <circle cx="100" cy="100" r="62" fill="none" stroke="#B45309" strokeWidth="1" strokeDasharray="4 2" />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-amber-700">
            <span className="text-[10px] font-bold tracking-widest uppercase">Official</span>
            <Award className="w-8 h-8 my-1" />
            <span className="text-[10px] font-bold tracking-widest uppercase">Certified</span>
        </div>
    </div>
);