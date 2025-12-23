
import React, { useState, useEffect, useRef } from 'react';
import { generateVisualization } from './services/geminiService';
import { VizResponse, HistoryItem, Theme } from './types';
import MermaidRenderer from './components/MermaidRenderer';
import RechartsRenderer from './components/RechartsRenderer';
import CustomizationPanel from './components/CustomizationPanel';
import ErrorBoundary from './components/ErrorBoundary';
import { 
  Loader2, 
  Send, 
  BarChart3, 
  Workflow, 
  Image as ImageIcon, 
  Code2, 
  History,
  Sparkles,
  Sun,
  Moon,
  Contrast,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  Play,
  Maximize2,
  X,
  Plus,
  Undo2,
  Redo2,
  Settings,
  AlertTriangle,
  RefreshCw,
  RotateCw,
  Search
} from 'lucide-react';
import clsx from 'clsx';

// Expanded prompts list for robust auto-suggestion
const SAMPLE_PROMPTS = [
  // Mermaid - Flowcharts & Processes
  "Flowchart of a user registration process with email verification",
  "Flowchart for an e-commerce checkout system",
  "Flowchart of a troubleshooting guide for internet connection",
  "Flowchart depicting a software release pipeline",
  "Flowchart for a bank loan approval process",
  
  // Mermaid - Sequence Diagrams
  "Sequence diagram for an ATM cash withdrawal",
  "Sequence diagram for OAuth2 login flow",
  "Sequence diagram for a restaurant ordering system",
  "Sequence diagram of API gateway authentication",
  "Sequence diagram for online payment processing",
  
  // Mermaid - Class Diagrams
  "UML Class diagram for a library management system",
  "UML Class diagram for a hospital patient system",
  "UML Class diagram for an e-commerce inventory system",
  "UML Class diagram for a university course registration",
  "UML Class diagram for a hotel booking system",
  
  // Mermaid - State Diagrams
  "State diagram for a traffic light system",
  "State diagram for an order lifecycle (Pending -> Shipped -> Delivered)",
  "State diagram for a document approval workflow",
  "State diagram for a video player (Play, Pause, Stop, Buffering)",
  "State diagram for a vending machine",

  // Mermaid - ER Diagrams
  "Entity Relationship Diagram (ERD) for a blog database",
  "Entity Relationship Diagram (ERD) for a school management system",
  "Entity Relationship Diagram (ERD) for a retail store inventory",
  "Entity Relationship Diagram (ERD) for a human resources system",
  
  // Mermaid - Gantt
  "Gantt chart for a software development lifecycle",
  "Gantt chart for a house construction project",
  "Gantt chart for a marketing campaign launch",
  "Gantt chart for event planning timeline",

  // Mermaid - Use Case
  "Use Case diagram for an Online Store",
  "Use Case diagram for an ATM system",
  "Use Case diagram for a Library System",
  
  // Recharts - Bar Charts
  "Bar chart of monthly revenue for 2024: Jan 12k, Feb 15k, Mar 10k, Apr 18k",
  "Bar chart comparing sales of Product A vs Product B over Q1",
  "Bar chart of population by continent",
  "Stacked Bar chart of website traffic sources (Organic, Social, Direct)",
  
  // Recharts - Line Charts
  "Line chart comparing Bitcoin and Ethereum prices over the last 6 months",
  "Line chart of average global temperature over the last 100 years",
  "Line chart showing website active users over the last 30 days",
  "Multi-line chart comparing revenue of 3 tech companies",
  
  // Recharts - Pie/Donut
  "Pie chart of mobile OS market share: Android 70%, iOS 28%, Other 2%",
  "Pie chart of global energy sources distribution",
  "Donut chart of budget allocation for a project",
  "Pie chart of diet composition (Carbs, Protein, Fat)",
  
  // Recharts - Scatter/Radar
  "Scatter plot of height vs weight for 50 people",
  "Scatter plot showing correlation between study hours and exam scores",
  "Radar chart comparing 5 different smartphone specs",
  "Radar chart showing player stats (Speed, Power, Defense, Stamina)",
  
  // SVG
  "Venn diagram comparing AI, ML, and Deep Learning (SVG)",
  "Venn diagram showing intersection of Design, Business, and Tech",
  "Simple network topology diagram with SVG",
  "Pyramid diagram showing Maslow's hierarchy of needs (SVG)"
];

// Supported Types Definition for UI Display
const SUPPORTED_DIAGRAMS = ["Flowchart", "Sequence", "Class (UML)", "State", "ERD", "Gantt", "Git Graph", "Use Case"];
const SUPPORTED_CHARTS = ["Bar", "Line", "Area", "Pie", "Scatter", "Radar", "Composed"];
const SUPPORTED_SVG = ["Venn Diagram", "Topology", "Infographic"];

// Toast Notification Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={clsx(
      "fixed bottom-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-bottom-4 duration-300 max-w-sm",
      type === 'success' ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-100" : 
      type === 'error' ? "bg-red-950/90 border-red-500/50 text-red-100" :
      "bg-indigo-950/90 border-indigo-500/50 text-indigo-100"
    )}>
      {type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : 
       type === 'error' ? <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" /> :
       <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0" />}
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};

// Deletion Confirmation Modal
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl max-w-sm w-full shadow-2xl scale-100 transform transition-all">
        <h3 className="text-lg font-semibold text-white mb-2">Delete Visualization?</h3>
        <p className="text-slate-400 text-sm mb-6">
          Are you sure you want to delete <span className="text-white font-medium">"{title}"</span>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white font-medium transition">Delete</button>
        </div>
      </div>
    </div>
  );
};

// Progress Bar Component
const ProgressBar = ({ status }: { status: 'idle' | 'analyzing' | 'generating' | 'rendering' }) => {
  if (status === 'idle') return null;

  let width = '0%';
  if (status === 'analyzing') width = '30%';
  else if (status === 'generating') width = '60%';
  else if (status === 'rendering') width = '90%';

  return (
    <div className="w-full h-1 bg-gray-200/20 rounded-full overflow-hidden mt-4">
      <div 
        className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-700 ease-out" 
        style={{ width }} 
      />
    </div>
  );
};

const App: React.FC = () => {
  // Application State
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'generating' | 'rendering'>('idle');
  
  // Auto-suggestion State
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Undo/Redo Stack
  const [vizStack, setVizStack] = useState<VizResponse[]>([]);
  const [stackIndex, setStackIndex] = useState(-1);
  
  // Derived current visualization from stack
  const currentViz = stackIndex >= 0 && vizStack.length > stackIndex ? vizStack[stackIndex] : null;

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showCode, setShowCode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [randomSuggestions, setRandomSuggestions] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Deletion State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Editable Code State
  const [editableCode, setEditableCode] = useState<string>('');

  // Load history from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('vizGenHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    refreshRandomSuggestions();
  }, []);

  // Sync editable code when visualization changes (due to undo/redo or generation)
  useEffect(() => {
    if (currentViz) {
      setEditableCode(getCodeSnippet(currentViz));
    }
  }, [currentViz]);

  // Save history to local storage whenever it changes (Limit to 5)
  useEffect(() => {
    localStorage.setItem('vizGenHistory', JSON.stringify(history.slice(0, 5)));
  }, [history]);

  // Handle Input Changes & Filtering Suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrompt(value);
    
    if (value.length > 2 && status === 'idle') {
      const lowerPrompt = value.toLowerCase();
      const matches = SAMPLE_PROMPTS.filter(p => 
        p.toLowerCase().includes(lowerPrompt)
      ).slice(0, 6);
      
      setFilteredSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Helper: Push new state to stack
  const pushToStack = (viz: VizResponse) => {
    const newStack = vizStack.slice(0, stackIndex + 1);
    newStack.push(viz);
    setVizStack(newStack);
    setStackIndex(newStack.length - 1);
  };

  const handleUndo = () => {
    if (stackIndex > 0) {
      setStackIndex(stackIndex - 1);
      showToast("Undone", "success");
    }
  };

  const handleRedo = () => {
    if (stackIndex < vizStack.length - 1) {
      setStackIndex(stackIndex + 1);
      showToast("Redone", "success");
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  const refreshRandomSuggestions = () => {
    const shuffled = [...SAMPLE_PROMPTS].sort(() => 0.5 - Math.random());
    setRandomSuggestions(shuffled.slice(0, 3));
  };

  /**
   * Centralized Logic for Processing a Prompt
   * Handles both new submissions and refinements/regenerations.
   * @param promptText The text to send to the AI
   * @param isRefinement Whether this is modifying existing context
   */
  const processPrompt = async (promptText: string, isRefinement: boolean) => {
    if (!promptText.trim()) return;

    setStatus('analyzing');
    setShowCode(false);
    setShowSettings(false);
    setShowSuggestions(false);

    try {
      await new Promise(r => setTimeout(r, 600)); 
      setStatus('generating');
      
      const context = isRefinement ? currentViz || undefined : undefined;
      const response = await generateVisualization(promptText, context);

      // UPDATED CHECK: Handle unsupported types gracefully without crash
      if (!['mermaid', 'recharts', 'svg'].includes(response.visualizationType)) {
          alert(`Visualization type '${response.visualizationType}' is not currently supported by this application.\n\nPlease try requesting a Flowchart, Chart, or simple Diagram.`);
          setStatus('idle');
          return;
      }
      
      setStatus('rendering');
      await new Promise(r => setTimeout(r, 400));
      
      const newId = Date.now().toString();
      const vizWithId: VizResponse = { 
        ...response, 
        id: newId,
        originalPrompt: promptText 
      };
      
      if (isRefinement && currentViz) {
        pushToStack(vizWithId);
      } else {
        setVizStack([vizWithId]);
        setStackIndex(0);
      }

      // Only clear input if it was a manual user entry (not a regen)
      // But for better UX, usually good to clear after success
      if (prompt === promptText) {
          setPrompt('');
      }
      
      const newHistoryItem: HistoryItem = {
        ...vizWithId,
        id: newId,
        prompt: promptText, 
        timestamp: Date.now(),
      };
      
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 5));
      refreshRandomSuggestions();
      showToast(isRefinement ? "Visualization updated" : "Visualization generated", "success");
    } catch (err: any) {
      console.error("Generation failed:", err);
      showToast(err.message || "Failed to generate visualization", "error");
    } finally {
      setStatus('idle');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processPrompt(prompt, !!currentViz);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
    // Optional: Auto submit on suggestion click?
    // processPrompt(suggestion, !!currentViz); 
    // Keeping it manual for now so user can edit.
  };

  const handleRegenerate = () => {
    if (!currentViz?.originalPrompt) return;
    // Regenerate implies "Try again" from scratch with the same prompt, 
    // effectively ignoring the current visual context to get a fresh variation.
    processPrompt(currentViz.originalPrompt, false);
  };

  const handleNewViz = () => {
    setVizStack([]);
    setStackIndex(-1);
    setPrompt('');
    setIsFullscreen(false);
    setShowSettings(false);
  };

  const handleUpdateVizFromCode = () => {
    if (!currentViz) return;
    
    try {
      let updatedViz = { ...currentViz };
      if (currentViz.visualizationType === 'mermaid') {
        updatedViz.mermaidCode = editableCode;
      } else if (currentViz.visualizationType === 'recharts') {
        const parsed = JSON.parse(editableCode);
        updatedViz.rechartsConfig = parsed;
      } else if (currentViz.visualizationType === 'svg') {
        updatedViz.svgCode = editableCode;
      }
      
      pushToStack(updatedViz);
      showToast("Visualization updated from code", "success");
    } catch (err) {
      console.error("Manual update error:", err);
      showToast("Invalid syntax: " + (err as any).message, "error");
    }
  };

  const handleCustomizationUpdate = (viz: VizResponse) => {
    pushToStack(viz);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setPrompt(''); 
    setVizStack([item]);
    setStackIndex(0);
    setShowCode(false);
    setShowSettings(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast("Loaded from history", "success");
  };

  const promptDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    
    // Remove from history
    const newHistory = history.filter(h => h.id !== deleteId);
    setHistory(newHistory);
    
    // If we deleted the currently viewed item, reset view
    if (currentViz?.id === deleteId) {
       handleNewViz();
    }
    
    setDeleteId(null);
    showToast("Visualization deleted", "success");
  };

  const handleDownloadCode = () => {
    const code = getCodeSnippet(currentViz);
    const type = currentViz?.visualizationType === 'recharts' ? 'json' : currentViz?.visualizationType === 'mermaid' ? 'mmd' : 'svg';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viz-${Date.now()}.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Source code downloaded", "success");
  };

  /**
   * Handles clicks on SVG elements.
   * This provides interactivity by checking for 'vizgen-interactive' class elements or
   * elements with titles, simulating tooltips or info reveals.
   */
  const handleSvgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as Element;
    
    // Check if clicked element or parent is interactive or has a title
    const interactiveEl = target.closest('.vizgen-interactive') || target.closest('g') || target;
    const titleEl = interactiveEl?.querySelector('title');
    
    if (titleEl && titleEl.textContent) {
       showToast(titleEl.textContent, "info");
    }
  };

  const renderVizContent = () => {
    if (!currentViz) return null;

    switch (currentViz.visualizationType) {
      case 'mermaid':
        return currentViz.mermaidCode ? (
          <MermaidRenderer 
            code={currentViz.mermaidCode} 
            theme={theme} 
            mermaidTheme={currentViz.mermaidTheme} 
          />
        ) : <div className="text-red-400 p-4">Error: Missing Mermaid Code</div>;
        
      case 'recharts':
        return currentViz.rechartsConfig ? (
          <RechartsRenderer config={currentViz.rechartsConfig} theme={theme} />
        ) : <div className="text-red-400 p-4">Error: Missing Recharts Config</div>;
        
      case 'svg':
        // Fallback for empty SVG or simple check for validity
        if (!currentViz.svgCode || currentViz.svgCode.trim() === "" || !currentViz.svgCode.includes('<svg')) {
             return (
                 <div className="flex flex-col items-center justify-center p-10 text-slate-500 h-full">
                    <AlertTriangle className="w-10 h-10 mb-4 opacity-50 text-amber-500" />
                    <p className="text-lg font-medium mb-2">Visualization Unavailable</p>
                    <p className="text-sm opacity-70 text-center max-w-md">The generated SVG data is incomplete or invalid.</p>
                    <button 
                       onClick={() => window.location.reload()}
                       className="mt-6 flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors"
                    >
                       <RefreshCw className="w-4 h-4" /> Refresh App
                    </button>
                 </div>
             )
        }
        
        return (
           <figure 
             className="w-full h-full flex flex-col items-center justify-center p-4 overflow-auto"
             role="group"
             aria-label={currentViz.title}
           >
             <div 
               className="w-full h-full flex items-center justify-center"
               dangerouslySetInnerHTML={{ __html: currentViz.svgCode }}
               onClick={handleSvgClick}
             />
             <figcaption className="sr-only">
                {currentViz.explanation}. Use arrow keys to navigate interactive elements if supported.
             </figcaption>
             
             {/* Simple Fallback for extremely old browsers that might not process the innerHTML correctly (conceptually) */}
             <noscript>
                 <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
                     Your browser does not support JavaScript, which is required to render this SVG.
                 </div>
             </noscript>
           </figure>
        );
      default:
        // This case should theoretically be caught by the check in handleSubmit,
        // but as a fallback for existing state:
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-400">
                <AlertTriangle className="w-8 h-8 mb-2" />
                <p>Unknown Visualization Type</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded text-sm transition"
                >
                    Refresh Application
                </button>
            </div>
        );
    }
  };

  const getCodeSnippet = (viz: VizResponse | null) => {
    if (!viz) return '';
    if (viz.visualizationType === 'mermaid') return viz.mermaidCode || '';
    if (viz.visualizationType === 'recharts') return JSON.stringify(viz.rechartsConfig, null, 2);
    if (viz.visualizationType === 'svg') return viz.svgCode || '';
    return '';
  };

  // Theme Classes
  const bgClass = theme === 'light' ? 'bg-slate-50' : theme === 'contrast' ? 'bg-black' : 'bg-slate-950';
  const textClass = theme === 'light' ? 'text-slate-900' : theme === 'contrast' ? 'text-yellow-400' : 'text-slate-200';
  const sidebarClass = theme === 'light' ? 'bg-white border-slate-200' : theme === 'contrast' ? 'bg-black border-white' : 'bg-slate-900 border-slate-800';
  const cardClass = theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : theme === 'contrast' ? 'bg-black border-white' : 'bg-slate-900 border-slate-800';

  return (
    <div className={clsx("min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-300", bgClass, textClass)}>
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <DeleteConfirmationModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={confirmDelete}
        title={history.find(h => h.id === deleteId)?.title || 'this item'}
      />

      {/* Fullscreen Modal */}
      {isFullscreen && currentViz && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col animate-in fade-in duration-200">
           <div className="absolute top-4 right-4 z-50 flex gap-2">
              <button 
                onClick={() => setIsFullscreen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                aria-label="Close Fullscreen"
              >
                <X className="w-6 h-6" />
              </button>
           </div>
           <div className="flex-1 w-full h-full p-4 md:p-10 flex items-center justify-center overflow-hidden">
             <div className="w-full h-full bg-slate-900/50 rounded-xl overflow-hidden border border-white/10 relative">
                <ErrorBoundary onReset={() => setIsFullscreen(false)}>
                   {renderVizContent()}
                </ErrorBoundary>
             </div>
           </div>
           <div className="p-4 text-center text-white/50 text-sm" aria-live="polite">
             {currentViz.title}
           </div>
        </div>
      )}

      {/* Sidebar / History */}
      <aside className={clsx("w-full md:w-80 border-r flex flex-col h-auto md:h-screen sticky top-0 md:fixed z-10 transition-colors duration-300", sidebarClass)}>
        <div className="p-6 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              VizGen
            </h1>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xs font-semibold opacity-60 uppercase tracking-wider">Recent</h2>
          </div>

          {history.length === 0 ? (
            <div className="opacity-60 text-sm px-2 text-center py-10 flex flex-col items-center">
              <History className="w-8 h-8 mb-2 opacity-40" />
              <span>No history yet.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className={clsx(
                    "group w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all duration-200 border cursor-pointer",
                    currentViz?.id === item.id 
                      ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-500" 
                      : "border-transparent hover:bg-black/5"
                  )}
                  onClick={() => loadFromHistory(item)}
                >
                  <div className="flex-1 min-w-0 mr-2">
                     <div className="font-medium truncate mb-1" title={item.title}>{item.title}</div>
                     <div className="flex items-center gap-2 text-xs opacity-70">
                       {item.visualizationType === 'mermaid' && <Workflow className="w-3 h-3" />}
                       {item.visualizationType === 'recharts' && <BarChart3 className="w-3 h-3" />}
                       {item.visualizationType === 'svg' && <ImageIcon className="w-3 h-3" />}
                       <span className="capitalize">{item.visualizationType}</span>
                     </div>
                  </div>
                  <button 
                    onClick={(e) => promptDelete(e, item.id)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 rounded transition-all"
                    title="Delete item"
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Theme Selector */}
        <div className="p-4 border-t border-inherit">
           <div className="flex p-1 rounded-lg bg-black/10 dark:bg-white/5">
             <button 
               onClick={() => setTheme('light')} 
               className={clsx("flex-1 p-1.5 rounded-md flex justify-center transition", theme === 'light' ? 'bg-white shadow text-slate-900' : 'opacity-50 hover:opacity-100')}
               title="Light Mode"
             >
               <Sun className="w-4 h-4" />
             </button>
             <button 
               onClick={() => setTheme('dark')} 
               className={clsx("flex-1 p-1.5 rounded-md flex justify-center transition", theme === 'dark' ? 'bg-slate-700 shadow text-white' : 'opacity-50 hover:opacity-100')}
               title="Dark Mode"
             >
               <Moon className="w-4 h-4" />
             </button>
             <button 
               onClick={() => setTheme('contrast')} 
               className={clsx("flex-1 p-1.5 rounded-md flex justify-center transition", theme === 'contrast' ? 'bg-yellow-400 shadow text-black' : 'opacity-50 hover:opacity-100')}
               title="High Contrast"
             >
               <Contrast className="w-4 h-4" />
             </button>
           </div>
           <div className="mt-4 text-[10px] opacity-50 text-center uppercase tracking-widest">
             Universal Viz Generator
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-80 flex flex-col min-h-screen">
        <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
          
          {/* Input Section */}
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-light mb-6 text-center opacity-90 transition-all">
              {currentViz ? (
                <span className="flex items-center justify-center gap-2">
                   Refine & <span className="font-semibold text-indigo-500">Iterate</span>
                </span>
              ) : (
                <span>Visualize <span className="font-semibold text-indigo-500">anything</span>.</span>
              )}
            </h2>

            <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto flex gap-2 z-20">
               {/* New Button - Only visible when context exists */}
               {currentViz && (
                  <button
                    type="button"
                    onClick={handleNewViz}
                    className={clsx(
                      "p-4 rounded-xl border flex items-center justify-center transition-all hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 group",
                      theme === 'light' ? "bg-white border-slate-200 text-slate-500" : "bg-slate-900 border-slate-700 text-slate-400"
                    )}
                    title="Start New Visualization"
                  >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  </button>
               )}

              <div className="relative group flex-1">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <input
                  type="text"
                  value={prompt}
                  onChange={handleInputChange}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay hide to allow click
                  placeholder={currentViz ? "Ask for changes (e.g., 'Make bars blue', 'Add a step')..." : "Describe a flow, a dataset, a system architecture..."}
                  className={clsx(
                    "relative w-full px-6 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-xl pr-14 border transition-colors",
                    theme === 'light' 
                      ? "bg-white border-slate-200 placeholder-slate-400 text-slate-900" 
                      : "bg-slate-900 border-slate-700 placeholder-slate-500 text-slate-200"
                  )}
                  disabled={status !== 'idle'}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={status !== 'idle' || !prompt.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status !== 'idle' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
                
                {/* Auto-Suggestion Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className={clsx(
                    "absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl border overflow-hidden animate-in fade-in slide-in-from-top-2 z-50",
                    theme === 'light' 
                      ? "bg-white border-slate-200" 
                      : "bg-slate-800 border-slate-700"
                  )}>
                    <div className={clsx("px-4 py-2 text-xs font-semibold uppercase tracking-wider opacity-50 border-b", theme === 'light' ? "border-slate-100" : "border-slate-700")}>
                      Suggestions
                    </div>
                    {filteredSuggestions.map((suggestion, idx) => (
                      <div 
                        key={idx}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent input blur
                          handleSuggestionClick(suggestion);
                        }}
                        className={clsx(
                          "px-4 py-3 cursor-pointer text-sm flex items-center gap-3 transition-colors",
                          theme === 'light' 
                            ? "hover:bg-indigo-50 text-slate-700" 
                            : "hover:bg-slate-700 text-slate-300"
                        )}
                      >
                         <Search className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                         <span className="truncate">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </form>
            
            {/* Progress Bar */}
            <div className="max-w-2xl mx-auto">
               <ProgressBar status={status} />
            </div>

            {/* Suggestions Chips (Random on Load/Refresh) */}
            {!currentViz && (
              <div className="max-w-2xl mx-auto mt-4 flex flex-wrap gap-2 justify-center animate-in fade-in slide-in-from-bottom-2">
                {randomSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(suggestion)}
                    disabled={status !== 'idle'}
                    className={clsx(
                      "px-3 py-1 text-xs rounded-full border transition-all duration-200 truncate max-w-[200px]",
                      theme === 'light' 
                        ? "bg-slate-100 border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200" 
                        : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-300 hover:border-indigo-500/30"
                    )}
                    title={suggestion}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loading States (Simplified to text since progress bar handles main feedback) */}
          {status !== 'idle' && (
            <div className="flex flex-col items-center justify-center py-10 animate-in fade-in duration-500">
               <p className="text-sm font-medium text-indigo-400 animate-pulse">
                 {status === 'analyzing' && "Analyzing request..."}
                 {status === 'generating' && "Generating visualization..."}
                 {status === 'rendering' && "Rendering graphics..."}
               </p>
            </div>
          )}

          {/* Visualization Result */}
          {currentViz && status === 'idle' && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
              
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", theme === 'light' ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-slate-800 border-slate-700 text-slate-400")}>
                      {currentViz.visualizationType}
                    </span>
                    <h2 className="text-2xl font-semibold opacity-90">{currentViz.title}</h2>
                  </div>
                  <p className="opacity-60 text-sm max-w-2xl leading-relaxed">{currentViz.explanation}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                   {/* Undo / Redo */}
                   <div className="flex items-center mr-2 bg-opacity-10 bg-white rounded-lg overflow-hidden border border-white/10">
                      <button 
                        onClick={handleUndo} 
                        disabled={stackIndex <= 0}
                        className="p-2 hover:bg-white/10 disabled:opacity-30 transition" 
                        title="Undo"
                      >
                         <Undo2 className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-white/20"></div>
                      <button 
                        onClick={handleRedo} 
                        disabled={stackIndex >= vizStack.length - 1}
                        className="p-2 hover:bg-white/10 disabled:opacity-30 transition" 
                        title="Redo"
                      >
                         <Redo2 className="w-4 h-4" />
                      </button>
                   </div>
                   
                   {/* Regenerate Button */}
                   {currentViz.originalPrompt && (
                     <button 
                        onClick={handleRegenerate}
                        className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border", theme === 'light' ? "bg-white border-slate-200 hover:bg-slate-50" : "bg-slate-800 border-slate-700 hover:bg-slate-700")}
                        title="Regenerate Variation"
                     >
                       <RotateCw className="w-4 h-4" />
                     </button>
                   )}

                   <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border", 
                      showSettings 
                        ? "bg-indigo-500 border-indigo-500 text-white" 
                        : (theme === 'light' ? "bg-white border-slate-200 hover:bg-slate-50" : "bg-slate-800 border-slate-700 hover:bg-slate-700")
                    )}
                    title="Customize"
                   >
                     <Settings className="w-4 h-4" />
                   </button>

                   <button 
                    onClick={() => setIsFullscreen(true)}
                    className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border", theme === 'light' ? "bg-white border-slate-200 hover:bg-slate-50" : "bg-slate-800 border-slate-700 hover:bg-slate-700")}
                    title="Fullscreen"
                   >
                     <Maximize2 className="w-4 h-4" />
                   </button>

                   <button 
                    onClick={() => setShowCode(!showCode)}
                    className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border", theme === 'light' ? "bg-white border-slate-200 hover:bg-slate-50" : "bg-slate-800 border-slate-700 hover:bg-slate-700")}
                   >
                     <Code2 className="w-4 h-4" />
                     {showCode ? 'Hide Code' : 'Edit Code'}
                   </button>
                   <button 
                    onClick={handleDownloadCode}
                    className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border", theme === 'light' ? "bg-white border-slate-200 hover:bg-slate-50" : "bg-slate-800 border-slate-700 hover:bg-slate-700")}
                    title="Download Source Code"
                   >
                     <Download className="w-4 h-4" />
                   </button>
                </div>
              </div>

              {/* Display Area */}
              <div className={clsx("rounded-xl overflow-hidden shadow-2xl relative border", cardClass)}>
                
                {/* Customization Panel Popup */}
                <CustomizationPanel 
                   isOpen={showSettings} 
                   onClose={() => setShowSettings(false)}
                   viz={currentViz}
                   onUpdate={handleCustomizationUpdate}
                   theme={theme}
                />

                {/* Main Render Container with Background */}
                <div className={clsx("flex items-center justify-center min-h-[500px] w-full", 
                  theme === 'light' ? 'bg-slate-50' : theme === 'contrast' ? 'bg-black' : 'bg-slate-900/50'
                )}>
                  <ErrorBoundary onReset={() => window.location.reload()}>
                    {renderVizContent()}
                  </ErrorBoundary>
                </div>
                
                {/* Code / Edit Panel */}
                {showCode && (
                  <div className={clsx("border-t backdrop-blur flex flex-col", theme === 'light' ? "border-slate-200 bg-white/95" : "border-slate-800 bg-slate-900/95")}>
                    <div className={clsx("flex items-center justify-between px-4 py-2 border-b", theme === 'light' ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-900")}>
                      <span className="text-xs font-mono opacity-50">Editable Source ({currentViz.visualizationType})</span>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={handleUpdateVizFromCode}
                          className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 transition font-bold"
                        >
                          <Play className="w-3 h-3" /> Update Preview
                        </button>
                        <div className="w-px h-3 bg-slate-700"></div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(editableCode);
                            showToast("Code copied to clipboard", "success");
                          }}
                          className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                    </div>
                    <textarea 
                      value={editableCode}
                      onChange={(e) => setEditableCode(e.target.value)}
                      spellCheck={false}
                      className={clsx(
                        "w-full h-64 p-4 font-mono text-xs focus:outline-none custom-scrollbar resize-y", 
                        theme === 'light' ? "bg-white text-slate-700" : "bg-[#1e1e1e] text-slate-300"
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Welcome/Empty State */}
          {!currentViz && status === 'idle' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12 animate-in fade-in duration-700">
                <div className={clsx("p-6 border rounded-xl transition group", theme === 'light' ? "bg-white border-slate-200 hover:border-indigo-300" : "bg-slate-900/30 border-slate-800 hover:border-indigo-500/30")}>
                   <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                      <Workflow className="w-5 h-5 text-blue-500" />
                   </div>
                   <h3 className="font-semibold mb-2">Diagrams & Flows</h3>
                   <p className="text-sm opacity-60 mb-4">Mermaid.js integration for structural and logical diagrams.</p>
                   <div className="flex flex-wrap gap-1.5">
                     {SUPPORTED_DIAGRAMS.map(t => (
                       <span key={t} className={clsx("px-2 py-0.5 text-[10px] rounded border transition-colors", 
                          theme === 'light' ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                       )}>
                         {t}
                       </span>
                     ))}
                   </div>
                </div>
                
                <div className={clsx("p-6 border rounded-xl transition group", theme === 'light' ? "bg-white border-slate-200 hover:border-pink-300" : "bg-slate-900/30 border-slate-800 hover:border-pink-500/30")}>
                   <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                      <BarChart3 className="w-5 h-5 text-pink-500" />
                   </div>
                   <h3 className="font-semibold mb-2">Data Charts</h3>
                   <p className="text-sm opacity-60 mb-4">Recharts integration for statistical and quantitative analysis.</p>
                   <div className="flex flex-wrap gap-1.5">
                     {SUPPORTED_CHARTS.map(t => (
                       <span key={t} className={clsx("px-2 py-0.5 text-[10px] rounded border transition-colors", 
                          theme === 'light' ? "bg-pink-50 border-pink-100 text-pink-600" : "bg-pink-500/10 border-pink-500/20 text-pink-400"
                       )}>
                         {t}
                       </span>
                     ))}
                   </div>
                </div>
                
                <div className={clsx("p-6 border rounded-xl transition group", theme === 'light' ? "bg-white border-slate-200 hover:border-emerald-300" : "bg-slate-900/30 border-slate-800 hover:border-emerald-500/30")}>
                   <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                      <ImageIcon className="w-5 h-5 text-emerald-500" />
                   </div>
                   <h3 className="font-semibold mb-2">Custom SVG</h3>
                   <p className="text-sm opacity-60 mb-4">Direct SVG generation for custom, artistic, or ad-hoc visualizations.</p>
                   <div className="flex flex-wrap gap-1.5">
                     {SUPPORTED_SVG.map(t => (
                       <span key={t} className={clsx("px-2 py-0.5 text-[10px] rounded border transition-colors", 
                          theme === 'light' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                       )}>
                         {t}
                       </span>
                     ))}
                   </div>
                </div>
             </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;
