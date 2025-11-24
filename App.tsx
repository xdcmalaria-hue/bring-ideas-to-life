/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Hero } from './components/Hero';
import { InputArea, Framework } from './components/InputArea';
import { LivePreview } from './components/LivePreview';
import { CreationHistory, Creation } from './components/CreationHistory';
import { FeedbackModal } from './components/FeedbackModal';
import { PricingModal } from './components/PricingModal';
import { AuthModal } from './components/AuthModal';
import { ThemeToggle } from './components/ThemeToggle';
import { bringToLife, analyzeImageForPrompt } from './services/gemini';
import { ArrowUpTrayIcon, CubeTransparentIcon } from '@heroicons/react/24/solid';

const App: React.FC = () => {
  const [activeCreation, setActiveCreation] = useState<Creation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  
  // Auth States
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const [history, setHistory] = useState<Creation[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const importInputRef = useRef<HTMLInputElement>(null);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  // Update DOM when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Load history from local storage or fetch examples on mount
  useEffect(() => {
    const initHistory = async () => {
      const saved = localStorage.getItem('gemini_app_history');
      let loadedHistory: Creation[] = [];

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          loadedHistory = parsed.map((item: any) => ({
              ...item,
              timestamp: new Date(item.timestamp)
          }));
        } catch (e) {
          console.error("Failed to load history", e);
        }
      }

      if (loadedHistory.length > 0) {
        setHistory(loadedHistory);
      } else {
        // If no history (new user or cleared), load examples
        try {
           const exampleUrls = [
               'https://storage.googleapis.com/sideprojects-asronline/bringanythingtolife/vibecode-blog.json',
               'https://storage.googleapis.com/sideprojects-asronline/bringanythingtolife/cassette.json',
               'https://storage.googleapis.com/sideprojects-asronline/bringanythingtolife/chess.json'
           ];

           const examples = await Promise.all(exampleUrls.map(async (url) => {
               const res = await fetch(url);
               if (!res.ok) return null;
               const data = await res.json();
               return {
                   ...data,
                   timestamp: new Date(data.timestamp || Date.now()),
                   id: data.id || crypto.randomUUID()
               };
           }));
           
           const validExamples = examples.filter((e): e is Creation => e !== null);
           setHistory(validExamples);
        } catch (e) {
            console.error("Failed to load examples", e);
        }
      }
    };

    initHistory();
  }, []);

  // Save history when it changes
  useEffect(() => {
    if (history.length > 0) {
        try {
            localStorage.setItem('gemini_app_history', JSON.stringify(history));
        } catch (e) {
            console.warn("Local storage full or error saving history", e);
        }
    }
  }, [history]);

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = async (promptText: string, file?: File, fileData?: { base64: string, mimeType: string }, framework: Framework = 'react') => {
    setIsGenerating(true);
    // Clear active creation to show loading state
    setActiveCreation(null);

    try {
      let imageBase64: string | undefined;
      let mimeType: string | undefined;

      // Use pre-loaded data if available (from InputArea)
      if (fileData) {
          imageBase64 = fileData.base64;
          mimeType = fileData.mimeType;
      } else if (file) {
          // Fallback if InputArea didn't provide data (e.g., if used elsewhere)
          imageBase64 = await fileToBase64(file);
          mimeType = file.type.toLowerCase();
      }

      const result = await bringToLife(promptText, imageBase64, mimeType, framework);
      
      if (result && result.html) {
        const newCreation: Creation = {
          id: crypto.randomUUID(),
          name: result.name || (file ? file.name : 'Generated UI'),
          html: result.html,
          layout: result.layout,
          metadata: result.metadata,
          // Store the full data URL for easy display
          originalImage: imageBase64 && mimeType ? `data:${mimeType};base64,${imageBase64}` : undefined,
          timestamp: new Date(),
        };
        setActiveCreation(newCreation);
        setHistory(prev => [newCreation, ...prev]);
      }

    } catch (error) {
      console.error("Failed to generate:", error);
      alert("Something went wrong while bringing your file to life. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyze = async (base64: string, mimeType: string): Promise<string> => {
    try {
        return await analyzeImageForPrompt(base64, mimeType);
    } catch (e) {
        console.error("Analysis failed", e);
        return "";
    }
  };

  const handleReset = useCallback(() => {
    setActiveCreation(null);
    setIsGenerating(false);
  }, []);

  const handleSelectCreation = (creation: Creation) => {
    setActiveCreation(creation);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = event.target?.result as string;
            const parsed = JSON.parse(json);
            
            // Basic validation
            if (parsed.html && parsed.name) {
                const importedCreation: Creation = {
                    ...parsed,
                    timestamp: new Date(parsed.timestamp || Date.now()),
                    id: parsed.id || crypto.randomUUID()
                };
                
                // Add to history if not already there (by ID check)
                setHistory(prev => {
                    const exists = prev.some(c => c.id === importedCreation.id);
                    return exists ? prev : [importedCreation, ...prev];
                });

                // Set as active immediately
                setActiveCreation(importedCreation);
            } else {
                alert("Invalid creation file format.");
            }
        } catch (err) {
            console.error("Import error", err);
            alert("Failed to import creation.");
        }
        // Reset input
        if (importInputRef.current) importInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const openLogin = () => {
      setAuthMode('signin');
      setIsAuthOpen(true);
  };

  const openSignup = () => {
      setAuthMode('signup');
      setIsAuthOpen(true);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);

        // Escape: Close Modals or Preview
        if (e.key === 'Escape') {
            if (isAuthOpen) setIsAuthOpen(false);
            else if (isPricingOpen) setIsPricingOpen(false);
            else if (isFeedbackOpen) setIsFeedbackOpen(false);
            else if (activeCreation) handleReset();
            return;
        }

        // Global shortcuts that work even if NOT in input (or specific ones)
        if (!isInput) {
             // Alt + F: Feedback
            if (e.altKey && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                setIsFeedbackOpen(prev => !prev);
            }

            // History Navigation (only when previewing)
            if (activeCreation && history.length > 1) {
                if (e.key === 'ArrowRight') {
                    // Go to older (next in array)
                    const currentIndex = history.findIndex(c => c.id === activeCreation.id);
                    if (currentIndex < history.length - 1) {
                        setActiveCreation(history[currentIndex + 1]);
                    }
                } else if (e.key === 'ArrowLeft') {
                     // Go to newer (prev in array)
                    const currentIndex = history.findIndex(c => c.id === activeCreation.id);
                    if (currentIndex > 0) {
                        setActiveCreation(history[currentIndex - 1]);
                    }
                }
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthOpen, isPricingOpen, isFeedbackOpen, activeCreation, handleReset, history]);

  const isFocused = !!activeCreation || isGenerating;

  return (
    <div className="h-[100dvh] bg-zinc-50 dark:bg-zinc-950 bg-dot-grid text-zinc-900 dark:text-zinc-50 selection:bg-blue-500/30 overflow-y-auto overflow-x-hidden relative flex flex-col transition-colors duration-300">
      
      {/* Navigation Header */}
      <header className={`fixed top-0 left-0 right-0 z-30 px-6 py-4 flex items-center justify-between transition-all duration-500 ${isFocused ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
          <div className="flex items-center space-x-2">
             <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <CubeTransparentIcon className="w-5 h-5 text-white dark:text-black" />
             </div>
             <span className="font-bold text-lg tracking-tight hidden sm:block">Gemini Studio</span>
          </div>

          <nav className="flex items-center gap-4 sm:gap-6">
              <button 
                onClick={() => setIsPricingOpen(true)}
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Pricing
              </button>
              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800"></div>
              <button 
                onClick={openLogin}
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Log in
              </button>
              <button 
                onClick={openSignup}
                className="text-sm font-medium px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors shadow-lg shadow-zinc-500/10"
              >
                Sign up
              </button>
               <div className="hidden sm:block pl-2">
                 <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
               </div>
          </nav>
      </header>

      {/* Centered Content Container */}
      <div 
        className={`
          min-h-full flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10 
          transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
          ${isFocused 
            ? 'opacity-0 scale-95 blur-sm pointer-events-none h-[100dvh] overflow-hidden' 
            : 'opacity-100 scale-100 blur-0'
          }
        `}
      >
        {/* Main Vertical Centering Wrapper */}
        <div className="flex-1 flex flex-col justify-center items-center w-full py-20 md:py-24">
          
          {/* 1. Hero Section */}
          <div className="w-full mb-8 md:mb-16">
              <Hero />
          </div>

          {/* 2. Input Section */}
          <div className="w-full flex justify-center mb-8">
              <InputArea 
                onGenerate={handleGenerate} 
                onAnalyze={handleAnalyze}
                isGenerating={isGenerating} 
                disabled={isFocused} 
              />
          </div>

        </div>
        
        {/* 3. History Section & Footer - Stays at bottom */}
        <div className="flex-shrink-0 pb-6 w-full mt-auto flex flex-col items-center gap-6">
            <div className="w-full px-2 md:px-0">
                <CreationHistory history={history} onSelect={handleSelectCreation} />
            </div>
            
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 dark:text-zinc-500">
                <a 
                  href="https://x.com/ammaar" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
                >
                  Created by @ammaar
                </a>
                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                <button
                    onClick={() => setIsFeedbackOpen(true)}
                    className="hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
                    title="Shortcut: Alt + F"
                >
                    Feedback
                </button>
                <div className="sm:hidden flex items-center gap-4">
                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                </div>
            </div>
        </div>
      </div>

      {/* Live Preview - Always mounted for smooth transition */}
      <LivePreview
        creation={activeCreation}
        isLoading={isGenerating}
        isFocused={isFocused}
        onReset={handleReset}
      />

      {/* Modals */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialMode={authMode} />

      {/* Subtle Import Button (Bottom Right) */}
      <div className="fixed bottom-4 right-4 z-50">
        <button 
            onClick={handleImportClick}
            className="flex items-center space-x-2 p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors opacity-60 hover:opacity-100"
            title="Import Artifact"
        >
            <span className="text-xs font-medium uppercase tracking-wider hidden sm:inline">Upload previous artifact</span>
            <ArrowUpTrayIcon className="w-5 h-5" />
        </button>
        <input 
            type="file" 
            ref={importInputRef} 
            onChange={handleImportFile} 
            accept=".json" 
            className="hidden" 
        />
      </div>
    </div>
  );
};

export default App;