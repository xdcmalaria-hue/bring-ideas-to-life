/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { ArrowUpTrayIcon, SparklesIcon, CpuChipIcon, ExclamationTriangleIcon, XMarkIcon, DocumentIcon, PhotoIcon, CommandLineIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

export type Framework = 'react' | 'vue' | 'html';

interface InputAreaProps {
  onGenerate: (prompt: string, file?: File, fileData?: { base64: string, mimeType: string }, framework?: Framework) => void;
  onAnalyze?: (base64: string, mimeType: string) => Promise<string>;
  isGenerating: boolean;
  disabled?: boolean;
}

const CyclingText = () => {
    const words = [
        "a napkin sketch",
        "a chaotic whiteboard",
        "a game level design",
        "a sci-fi interface",
        "a diagram of a machine",
        "an ancient scroll"
    ];
    const [index, setIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false); // fade out
            setTimeout(() => {
                setIndex(prev => (prev + 1) % words.length);
                setFade(true); // fade in
            }, 500); // Wait for fade out
        }, 3000); // Slower cycle to read longer text
        return () => clearInterval(interval);
    }, [words.length]);

    return (
        <span className={`inline-block whitespace-nowrap transition-all duration-500 transform ${fade ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-sm'} text-zinc-900 dark:text-white font-medium pb-1 border-b-2 border-blue-500/50`}>
            {words[index]}
        </span>
    );
};

export const InputArea: React.FC<InputAreaProps> = ({ onGenerate, onAnalyze, isGenerating, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  
  // New State for Form Mode
  const [selectedFile, setSelectedFile] = useState<{file: File, base64: string, mimeType: string} | null>(null);
  const [prompt, setPrompt] = useState("");
  const [framework, setFramework] = useState<Framework>('react');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when file is selected
  useEffect(() => {
    if (selectedFile && textareaRef.current) {
        textareaRef.current.focus();
    }
  }, [selectedFile]);

  const handleFile = (file: File) => {
    setError(null);
    setReadingProgress(0);

    // 1. Validate Type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
        setError("Unsupported file format. Please upload an Image (JPEG, PNG, WebP) or PDF.");
        return;
    }

    // 2. Validate Size (Limit to 10MB for optimal performance)
    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please keep it under ${MAX_SIZE_MB}MB.`);
        return;
    }

    setIsReading(true);
    const reader = new FileReader();

    reader.onprogress = (event) => {
        if (event.lengthComputable) {
            const percent = (event.loaded / event.total) * 100;
            setReadingProgress(Math.round(percent));
        }
    };

    reader.onload = (e) => {
        const result = e.target?.result as string;
        // Remove data URL prefix to get raw base64
        const base64 = result.split(',')[1];
        
        // Instead of generating immediately, set the file state
        setSelectedFile({
            file,
            base64,
            mimeType: file.type
        });
        setIsReading(false);
    };

    reader.onerror = () => {
        setError("Failed to read file. Please try again.");
        setIsReading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isGenerating || isReading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [disabled, isGenerating, isReading]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!disabled && !isGenerating && !isReading) {
        setIsDragging(true);
    }
  }, [disabled, isGenerating, isReading]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClear = () => {
      setSelectedFile(null);
      setPrompt("");
      setError(null);
      setFramework('react');
  };

  const handleGenerateClick = () => {
      if (!selectedFile) return;
      onGenerate(prompt, selectedFile.file, { base64: selectedFile.base64, mimeType: selectedFile.mimeType }, framework);
      // We don't clear state here, App.tsx will handle the view transition
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      // CMD/CTRL + Enter to generate
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          if (!isGenerating) {
              handleGenerateClick();
          }
      }
  };

  const handleAutoEnhance = async () => {
      if (!selectedFile || !onAnalyze) return;
      setIsAnalyzing(true);
      try {
          const suggestion = await onAnalyze(selectedFile.base64, selectedFile.mimeType);
          if (suggestion) {
              setPrompt(prev => {
                  const separator = prev ? "\n\n" : "";
                  return prev + separator + suggestion;
              });
              // Focus after update
              if (textareaRef.current) {
                  textareaRef.current.focus();
                  textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
              }
          }
      } catch (e) {
          setError("Failed to analyze image. Please try again.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  // If a file is selected, show the prompt input form
  if (selectedFile) {
      const isPdf = selectedFile.mimeType === 'application/pdf';
      const previewUrl = `data:${selectedFile.mimeType};base64,${selectedFile.base64}`;

      return (
          <div className="w-full max-w-4xl mx-auto perspective-1000 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                  
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="flex flex-col md:flex-row gap-8">
                      {/* Left: Preview */}
                      <div className="w-full md:w-1/3 flex-shrink-0">
                          <div className="relative group aspect-[3/4] md:aspect-auto md:h-64 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">
                                {isPdf ? (
                                    <div className="flex flex-col items-center text-zinc-400">
                                        <DocumentIcon className="w-16 h-16 mb-2" />
                                        <span className="text-xs font-mono uppercase">PDF Document</span>
                                    </div>
                                ) : (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                )}
                                
                                {/* Overlay Controls */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                        onClick={handleClear}
                                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors transform translate-y-4 group-hover:translate-y-0 duration-200 shadow-lg"
                                    >
                                        Remove File
                                    </button>
                                </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1">
                              <span className="truncate max-w-[200px]" title={selectedFile.file.name}>{selectedFile.file.name}</span>
                              <span className="uppercase font-mono">{(selectedFile.file.size / 1024 / 1024).toFixed(1)} MB</span>
                          </div>
                      </div>

                      {/* Right: Prompt Input */}
                      <div className="flex-1 flex flex-col h-full">
                          <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-2">
                                  <SparklesIcon className="w-5 h-5 text-blue-500" />
                                  <h3 className="font-semibold text-zinc-900 dark:text-white">Describe your vision</h3>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                  {/* Framework Selection */}
                                  <div className="relative">
                                      <select
                                          value={framework}
                                          onChange={(e) => setFramework(e.target.value as Framework)}
                                          disabled={isGenerating}
                                          className="appearance-none pl-8 pr-8 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
                                      >
                                          <option value="react">React</option>
                                          <option value="vue">Vue</option>
                                          <option value="html">HTML</option>
                                      </select>
                                      <CommandLineIcon className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                      <ChevronDownIcon className="w-3 h-3 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                  </div>

                                  {onAnalyze && (
                                      <button
                                          onClick={handleAutoEnhance}
                                          disabled={isAnalyzing || isGenerating}
                                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                          {isAnalyzing ? (
                                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                              <SparklesIcon className="w-3 h-3" />
                                          )}
                                          <span>{isAnalyzing ? 'Analyzing...' : 'Reference AI'}</span>
                                      </button>
                                  )}
                              </div>
                          </div>
                          
                          <div className="relative flex-1 min-h-[160px]">
                              <textarea
                                  ref={textareaRef}
                                  value={prompt}
                                  onChange={(e) => setPrompt(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  placeholder="E.g., Turn this wireframe into a modern dashboard with dark mode. Use a blue and purple color scheme. Add a user profile chart in the top right..."
                                  className="w-full h-full p-4 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl resize-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all text-sm md:text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                  disabled={isGenerating}
                              />
                              <div className="absolute bottom-3 right-3 text-xs text-zinc-400 pointer-events-none flex items-center space-x-2">
                                  <span>{prompt.length} chars</span>
                                  <span className="hidden md:inline opacity-50 border border-zinc-500 rounded px-1 text-[10px]">⌘ + ↵</span>
                              </div>
                          </div>

                          <div className="mt-6 flex items-center justify-end space-x-4">
                              <button 
                                  onClick={handleClear}
                                  disabled={isGenerating}
                                  className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                              >
                                  Cancel
                              </button>
                              <button
                                  onClick={handleGenerateClick}
                                  disabled={isGenerating}
                                  title="Press Cmd+Enter to generate"
                                  className={`
                                      group relative flex items-center space-x-2 px-6 py-2.5 rounded-full 
                                      bg-zinc-900 dark:bg-white text-white dark:text-black font-medium text-sm
                                      hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95
                                      transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none
                                  `}
                              >
                                  {isGenerating ? (
                                      <>
                                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                          <span>Creating...</span>
                                      </>
                                  ) : (
                                      <>
                                          <span>Bring to Life</span>
                                          <PaperAirplaneIcon className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                      </>
                                  )}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // Default Drop Zone
  return (
    <div className="w-full max-w-4xl mx-auto perspective-1000">
      <div 
        className={`relative group transition-all duration-300 ${isDragging ? 'scale-[1.01]' : ''}`}
      >
        <label
          className={`
            relative flex flex-col items-center justify-center
            h-56 sm:h-64 md:h-[22rem]
            rounded-xl border border-dashed
            cursor-pointer overflow-hidden
            transition-all duration-300
            ${isDragging 
              ? 'border-blue-500 bg-zinc-100/80 dark:bg-zinc-900/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]' 
              : error 
                ? 'border-red-500/50 bg-red-50/50 dark:bg-red-900/10'
                : 'bg-white/40 dark:bg-zinc-900/30 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-white/60 dark:hover:bg-zinc-900/40'
            }
            backdrop-blur-sm
            ${(isGenerating || isReading) ? 'pointer-events-none' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
            {/* Technical Grid Background */}
            <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03] pointer-events-none" 
                 style={{backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px'}}>
            </div>
            
            {/* Error Message Toast */}
            {error && (
                <div className="absolute top-4 z-20 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-500/50 text-red-800 dark:text-red-200 px-4 py-2 rounded-lg text-sm flex items-center shadow-lg backdrop-blur-md">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-2 text-red-500 dark:text-red-400" />
                        {error}
                        <button 
                            onClick={(e) => { e.preventDefault(); setError(null); }} 
                            className="ml-3 p-0.5 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Reading/Processing Progress Overlay */}
            {isReading && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm transition-all duration-300">
                    <div className="w-16 h-16 mb-4 relative flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path className="text-zinc-200 dark:text-zinc-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                            <path 
                                className="text-blue-500 transition-all duration-200 ease-out" 
                                strokeDasharray={`${readingProgress}, 100`} 
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="3" 
                            />
                        </svg>
                        <span className="absolute text-xs font-mono font-bold text-blue-500 dark:text-blue-400">{readingProgress}%</span>
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-200 font-medium text-sm animate-pulse tracking-wide">Analyzing file...</p>
                </div>
            )}
            
            {/* Corner Brackets for technical feel */}
            <div className={`absolute top-4 left-4 w-4 h-4 border-l-2 border-t-2 transition-colors duration-300 ${isDragging ? 'border-blue-500' : 'border-zinc-300 dark:border-zinc-600'}`}></div>
            <div className={`absolute top-4 right-4 w-4 h-4 border-r-2 border-t-2 transition-colors duration-300 ${isDragging ? 'border-blue-500' : 'border-zinc-300 dark:border-zinc-600'}`}></div>
            <div className={`absolute bottom-4 left-4 w-4 h-4 border-l-2 border-b-2 transition-colors duration-300 ${isDragging ? 'border-blue-500' : 'border-zinc-300 dark:border-zinc-600'}`}></div>
            <div className={`absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 transition-colors duration-300 ${isDragging ? 'border-blue-500' : 'border-zinc-300 dark:border-zinc-600'}`}></div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-6 md:space-y-8 p-6 md:p-8 w-full">
                <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-transform duration-500 ${isDragging ? 'scale-110' : 'group-hover:-translate-y-1'}`}>
                    <div className={`absolute inset-0 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl flex items-center justify-center ${isGenerating ? 'animate-pulse' : ''}`}>
                        {isGenerating ? (
                            <CpuChipIcon className="w-8 h-8 md:w-10 md:h-10 text-blue-500 dark:text-blue-400 animate-spin-slow" />
                        ) : (
                            <ArrowUpTrayIcon className={`w-8 h-8 md:w-10 md:h-10 text-zinc-400 dark:text-zinc-300 transition-all duration-300 ${isDragging ? '-translate-y-1 text-blue-500 dark:text-blue-400' : ''}`} />
                        )}
                    </div>
                </div>

                <div className="space-y-2 md:space-y-4 w-full max-w-3xl">
                    <h3 className="flex flex-col items-center justify-center text-xl sm:text-2xl md:text-4xl text-zinc-900 dark:text-zinc-100 leading-none font-bold tracking-tighter gap-3">
                        <span>Bring</span>
                        {/* Fixed height container to prevent layout shifts */}
                        <div className="h-8 sm:h-10 md:h-14 flex items-center justify-center w-full">
                           <CyclingText />
                        </div>
                        <span>to life</span>
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-500 text-xs sm:text-base md:text-lg font-light tracking-wide">
                        <span className="hidden md:inline">Drag & Drop</span>
                        <span className="md:hidden">Tap</span> to upload any file
                    </p>
                </div>
            </div>

            <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={isGenerating || isReading || disabled}
            />
        </label>
      </div>
    </div>
  );
};