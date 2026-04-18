"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Upload, ScanFace, AlertTriangle, CheckCircle } from "lucide-react";

interface SkinScannerProps {
  onAnalysis?: (concerns: string[]) => void;
}

const DEMO_CONCERNS = [
  "Mild uneven texture detected in T-zone",
  "Slight hyperpigmentation on cheek area",
  "Well-hydrated — no visible dehydration lines",
  "Minor pore visibility on nose and forehead",
];

export default function SkinScanner({ onAnalysis }: SkinScannerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<string[] | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setResults(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const runScan = async () => {
    setIsAnalyzing(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 2000));
    setResults(DEMO_CONCERNS);
    onAnalysis?.(DEMO_CONCERNS);
    setIsAnalyzing(false);
  };

  const reset = () => {
    setPreview(null);
    setResults(null);
  };

  return (
    <div className="border border-stone-200 rounded-xl bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
        <ScanFace size={15} className="text-stone-500" />
        <h3 className="font-semibold text-stone-900 text-sm">Skin Image Analysis</h3>
        <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full ml-auto">Beta</span>
      </div>

      <div className="p-5">
        {!preview ? (
          <div>
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-stone-400 bg-stone-50"
                  : "border-stone-200 hover:border-stone-300 hover:bg-stone-50/50"
              )}
            >
              <input {...getInputProps()} />
              <Upload size={24} className="text-stone-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-stone-600">
                {isDragActive ? "Drop your photo here" : "Upload a skin photo"}
              </p>
              <p className="text-xs text-stone-400 mt-1">JPG, PNG, WEBP · Max 10MB</p>
            </div>
            <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-3">
              <AlertTriangle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Image analysis is for informational purposes only and is not a medical diagnosis. Results accuracy may vary based on photo quality and lighting.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex gap-4 mb-4">
              <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                <img src={preview} alt="Skin scan" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                {!results && !isAnalyzing && (
                  <div>
                    <p className="text-sm text-stone-600 mb-3">Photo ready for analysis. Our AI will scan for visible skin concerns.</p>
                    <button
                      onClick={runScan}
                      className="inline-flex items-center gap-1.5 bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
                    >
                      <ScanFace size={14} />
                      Analyze photo
                    </button>
                  </div>
                )}
                {isAnalyzing && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-stone-600">Scanning...</span>
                  </div>
                )}
                {results && (
                  <div>
                    <div className="flex items-center gap-1.5 text-green-700 text-sm font-medium mb-2">
                      <CheckCircle size={13} />
                      Analysis complete
                    </div>
                    <div className="space-y-1">
                      {results.map((r, i) => (
                        <div key={i} className="text-xs text-stone-600 flex items-start gap-1.5">
                          <span className="text-stone-300 mt-0.5">·</span>
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button onClick={reset} className="text-xs text-stone-400 hover:text-stone-700 transition-colors">
              ← Use a different photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
