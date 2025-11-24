
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState, useRef } from 'react';
import { ArrowDownTrayIcon, PlusIcon, ViewColumnsIcon, DocumentIcon, CodeBracketIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Creation } from './CreationHistory';

interface LivePreviewProps {
  creation: Creation | null;
  isLoading: boolean;
  isFocused: boolean;
  onReset: () => void;
}

// Add type definition for the global pdfjsLib
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const PdfRenderer = ({ dataUrl }: { dataUrl: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderPdf = async () => {
      if (!window.pdfjsLib) {
        setError("PDF library not initialized");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Load the document
        const loadingTask = window.pdfjsLib.getDocument(dataUrl);
        const pdf = await loadingTask.promise;
        
        // Get the first page
        const page = await pdf.getPage(1);
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        
        // Calculate scale to make it look good (High DPI)
        const viewport = page.getViewport({ scale: 2.0 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        setLoading(false);
      } catch (err) {
        console.error("Error rendering PDF:", err);
        setError("Could not render PDF preview.");
        setLoading(false);
      }
    };

    renderPdf();
  }, [dataUrl]);

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6 text-center">
            <DocumentIcon className="w-12 h-12 mb-3 opacity-50 text-red-500 dark:text-red-400" />
            <p className="text-sm mb-2 text-red-600 dark:text-red-400/80">{error}</p>
        </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        )}
        <canvas 
            ref={canvasRef} 
            className={`max-w-full max-h-full object-contain shadow-xl border border-zinc-200 dark:border-zinc-800/50 rounded transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
        />
    </div>
  );
};

export const LivePreview: React.FC<LivePreviewProps> = ({ creation, isLoading, isFocused, onReset }) => {
    const [showSplitView, setShowSplitView] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    // Log simulation effect
    useEffect(() => {
        if (!isLoading) {
            setLogs([]);
            return;
        }

        const fullLogs = [
            "Initializing vision model...",
            "Analyzing input parameters...",
            "Detecting component structure...",
            "Extracting design tokens...",
            "Matching UI patterns...",
            "Generating layout tree...",
            "Synthesizing React components...",
            "Optimizing Tailwind classes...",
            "Running accessibility checks...",
            "Finalizing build...",
            "Rendering preview..."
        ];
        
        setLogs([]);
        let currentIndex = 0;
        
        const interval = setInterval(() => {
            if (currentIndex < fullLogs.length) {
                setLogs(prev => [...prev, fullLogs[currentIndex]].slice(-6)); // Show last 6
                currentIndex++;
            }
        }, 800);

        return () => clearInterval(interval);
    }, [isLoading]);

    // Default to Split View when a new creation with an image is loaded
    useEffect(() => {
        if (creation?.originalImage) {
            setShowSplitView(true);
        } else {
            setShowSplitView(false);
        }
    }, [creation]);

    const handleExportJSON = () => {
        if (!creation) return;
        const dataStr = JSON.stringify(creation, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${creation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_artifact.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
    };

    const handleExportHTML = () => {
        if (!creation) return;
        const blob = new Blob([creation.html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${creation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
    };

  return (
    <div
      className={`
        fixed z-40 flex flex-col
        rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0E0E10] shadow-2xl
        transition-all duration-700 cubic-bezier(0.2, 0.8, 0.2, 1)
        ${isFocused
          ? 'inset-2 md:inset-4 opacity-100 scale-100'
          : 'top-1/2 left-1/2 w-[90%] h-[60%] -translate-x-1/2 -translate-y-1/2 opacity-0 scale-95 pointer-events-none'
        }
      `}
    >
      {/* Minimal Technical Header */}
      <div className="bg-white dark:bg-[#121214] px-4 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0 transition-colors duration-300">
        {/* Left: Controls */}
        <div className="flex items-center space-x-3 w-32">
           <div className="flex space-x-2 group/controls">
                <button 
                  onClick={onReset}
                  className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover/controls:bg-red-500 hover:!bg-red-600 transition-colors flex items-center justify-center focus:outline-none"
                  title="Close Preview (Esc)"
                >
                  <XMarkIcon className="w-2 h-2 text-black opacity-0 group-hover/controls:opacity-100" />
                </button>
                <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover/controls:bg-yellow-500 transition-colors"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover/controls:bg-green-500 transition-colors"></div>
           </div>
        </div>
        
        {/* Center: Title */}
        <div className="flex items-center space-x-2 text-zinc-500">
            <CodeBracketIcon className="w-3 h-3" />
            <span className="text-[11px] font-mono uppercase tracking-wider">
                {isLoading ? 'System Processing...' : creation ? creation.name : 'Preview Mode'}
            </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end space-x-1 w-32">
            {!isLoading && creation && (
                <>
                    {creation.originalImage && (
                         <button 
                            onClick={() => setShowSplitView(!showSplitView)}
                            title={showSplitView ? "Show App Only" : "Compare with Original"}
                            className={`p-1.5 rounded-md transition-all ${showSplitView ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                        >
                            <ViewColumnsIcon className="w-4 h-4" />
                        </button>
                    )}

                    <div className="relative">
                        <button 
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            title="Export Options"
                            className={`text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 ${showExportMenu ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : ''}`}
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>
                        
                        {/* Export Menu */}
                        {showExportMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                                    <button 
                                        onClick={handleExportJSON}
                                        className="w-full text-left px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center border-b border-zinc-100 dark:border-zinc-800/50"
                                    >
                                        <span className="flex-1 font-medium">Export JSON</span>
                                        <span className="text-zinc-400 uppercase text-[9px] bg-zinc-100 dark:bg-zinc-800 px-1 rounded">Data</span>
                                    </button>
                                    <button 
                                        onClick={handleExportHTML}
                                        className="w-full text-left px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center"
                                    >
                                        <span className="flex-1 font-medium">Export HTML</span>
                                        <span className="text-zinc-400 uppercase text-[9px] bg-zinc-100 dark:bg-zinc-800 px-1 rounded">Web</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <button 
                        onClick={onReset}
                        title="New Upload"
                        className="ml-2 flex items-center space-x-1 text-xs font-bold bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-700 dark:hover:bg-zinc-200 px-3 py-1.5 rounded-md transition-colors"
                    >
                        <PlusIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">New</span>
                    </button>
                </>
            )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative w-full flex-1 bg-zinc-50 dark:bg-[#09090b] flex overflow-hidden transition-colors duration-300">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 w-full bg-zinc-50 dark:bg-[#09090b] relative overflow-hidden">
             {/* Tech Background with scanning grid effect */}
             <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05]" 
                  style={{
                      backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', 
                      backgroundSize: '32px 32px',
                      maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
                  }}>
             </div>

             <div className="relative z-10 w-full max-w-md flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
                {/* Central Spinner */}
                <div className="relative mb-10">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                        <CodeBracketIcon className="w-8 h-8 text-blue-500 animate-pulse-fast" />
                    </div>
                    {/* Rotating Rings */}
                    <div className="absolute -inset-4 border border-blue-500/30 rounded-full animate-spin-slow border-t-transparent border-l-transparent"></div>
                    <div className="absolute -inset-4 border border-blue-500/10 rounded-full"></div>
                </div>

                {/* Status Text */}
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">
                    Generating Interface
                </h3>
                <p className="text-zinc-500 text-sm mb-8 text-center max-w-xs">
                    Interpreting your input and writing production-ready React code...
                </p>

                {/* Terminal Window */}
                <div className="w-full bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 shadow-2xl">
                    <div className="px-4 py-2 bg-zinc-800/50 border-b border-zinc-800 flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                        <div className="ml-auto text-[10px] text-zinc-500 font-mono">GEMINI-CORE</div>
                    </div>
                    <div className="p-4 font-mono text-xs h-40 overflow-hidden flex flex-col justify-end relative">
                         <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-gradient-to-b from-transparent to-zinc-900/10"></div>
                         {logs.map((log, i) => (
                             <div key={i} className="mb-1 text-zinc-400 animate-in fade-in slide-in-from-left-2 duration-300 whitespace-nowrap overflow-hidden text-ellipsis">
                                <span className="text-blue-500 font-bold mr-2">➜</span>
                                {log}
                             </div>
                         ))}
                         <div className="flex items-center text-blue-400 mt-1">
                             <span className="mr-2">➜</span>
                             <span className="animate-pulse">_</span>
                         </div>
                    </div>
                </div>
             </div>
          </div>
        ) : creation?.html ? (
          <>
            {/* Split View: Left Panel (Original Image) */}
            {showSplitView && creation.originalImage && (
                <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#0c0c0e] relative flex flex-col shrink-0 transition-colors duration-300">
                    <div className="absolute top-4 left-4 z-10 bg-white/80 dark:bg-black/80 backdrop-blur text-zinc-600 dark:text-zinc-400 text-[10px] font-mono uppercase px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800">
                        Input Source
                    </div>
                    <div className="w-full h-full p-6 flex items-center justify-center overflow-hidden">
                        {creation.originalImage.startsWith('data:application/pdf') ? (
                            <PdfRenderer dataUrl={creation.originalImage} />
                        ) : (
                            <img 
                                src={creation.originalImage} 
                                alt="Original Input" 
                                className="max-w-full max-h-full object-contain shadow-xl border border-zinc-200 dark:border-zinc-800/50 rounded"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* App Preview Panel */}
            <div className={`relative h-full bg-white transition-all duration-500 ${showSplitView && creation.originalImage ? 'w-full md:w-1/2 h-1/2 md:h-full' : 'w-full'}`}>
                 <iframe
                    title="Gemini Live Preview"
                    srcDoc={creation.html}
                    className="w-full h-full"
                    sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
                />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};