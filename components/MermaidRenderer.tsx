
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, Maximize, Download, Image as ImageIcon, AlertTriangle, RefreshCw } from 'lucide-react';
import { Theme, MermaidTheme } from '../types';

/**
 * Props for the MermaidRenderer component
 * @param code - The Mermaid syntax string to render
 * @param theme - Current application theme ('light', 'dark', 'contrast')
 * @param mermaidTheme - Specific theme override for the diagram
 */
interface MermaidRendererProps {
  code: string;
  theme: Theme;
  mermaidTheme?: MermaidTheme;
}

/**
 * MermaidRenderer
 * 
 * Responsible for rendering flowcharts, sequence diagrams, and other diagrams
 * using the Mermaid.js library. Includes functionality for:
 * - Dynamic rendering based on code input
 * - Pan and Zoom controls
 * - Export to SVG and PNG
 * - Theme synchronization
 */
const MermaidRenderer: React.FC<MermaidRendererProps> = ({ code, theme, mermaidTheme }) => {
  // ---------------------------------------------------------------------------
  // State & Refs
  // ---------------------------------------------------------------------------
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Viewport State (Zoom & Pan)
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // ---------------------------------------------------------------------------
  // Lifecycle Effects
  // ---------------------------------------------------------------------------

  /**
   * Reset view transform when code changes (new diagram loaded)
   */
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [code]);

  /**
   * Initialize Mermaid and render diagram when Code or Theme changes.
   * We use a unique ID for each render to prevent Mermaid caching issues.
   */
  useEffect(() => {
    // Determine the effective theme: use explicit mermaidTheme if present, otherwise map app theme
    const effectiveTheme = mermaidTheme || (theme === 'light' ? 'default' : theme === 'contrast' ? 'neutral' : 'dark');
    
    // Initialize library settings
    mermaid.initialize({
      startOnLoad: false,
      theme: effectiveTheme,
      securityLevel: 'loose', // Needed for HTML in nodes
      fontFamily: 'inherit',
    });
    
    renderDiagram();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, code, mermaidTheme]);

  // ---------------------------------------------------------------------------
  // Helper Functions
  // ---------------------------------------------------------------------------

  /**
   * Renders the Mermaid SVG.
   * Catches syntax errors and updates the error state.
   */
  const renderDiagram = async () => {
    if (!containerRef.current) return;
    setError(null);
    setSvgContent('');
    
    try {
      // Validate input
      if (!code.trim()) {
        throw new Error("Diagram code is empty");
      }
      
      // Generate unique ID for this render pass
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      
      // Attempt render
      const { svg } = await mermaid.render(id, code);
      setSvgContent(svg);
    } catch (err: any) {
      console.error("Mermaid Render Error:", err);
      // Detailed logging for debugging
      console.error("Failed Code Block:", code);
      
      // Format error message for UI
      let msg = "Syntax Error";
      if (err.message) {
        // Mermaid errors can be verbose; take the first relevant line
        msg = err.message.split('\n')[0]; 
      }
      setError(msg);
    }
  };

  // ---------------------------------------------------------------------------
  // Event Handlers - Zoom & Pan
  // ---------------------------------------------------------------------------

  const handleWheel = (e: React.WheelEvent) => {
    // Only zoom if Ctrl/Meta key is held to avoid interfering with page scroll
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(s => Math.min(Math.max(0.2, s + delta), 4));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    // Calculate offset from current position
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // ---------------------------------------------------------------------------
  // Event Handlers - Export
  // ---------------------------------------------------------------------------

  /**
   * Downloads the raw SVG content as a file.
   */
  const handleExportSVG = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagram-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Renders the SVG to a Canvas to export as PNG.
   * Handles high-DPI scaling for better quality.
   */
  const handleExportPNG = () => {
    const svgElement = containerRef.current?.querySelector('svg');
    if (!svgElement) return;

    // Serialize SVG
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Set high resolution canvas
    const rect = svgElement.getBoundingClientRect();
    const scaleFactor = 2; // 2x upscaling
    canvas.width = rect.width * scaleFactor; 
    canvas.height = rect.height * scaleFactor;
    
    img.onload = () => {
      if (!ctx) return;
      // Set background color based on theme (SVGs are often transparent)
      const bgColor = theme === 'light' ? '#ffffff' : theme === 'contrast' ? '#000000' : '#0f172a';
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Trigger Download
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `diagram-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    // Load SVG data into Image
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full w-full animate-in fade-in">
        <div className="bg-red-500/10 p-4 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-red-400 mb-2">Visualization Generation Failed</h3>
        <p className="text-sm opacity-70 max-w-md mb-6 leading-relaxed">
          The AI generated code that contains a syntax error. This is common with complex diagrams.
        </p>
        
        <div className="flex gap-4">
             <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
             >
                <RefreshCw className="w-4 h-4" />
                Reload Application
             </button>
             {/* Optional: Add a "Regenerate" button here if we had access to the parent's reload function */}
        </div>
        
        <div className="mt-8 w-full max-w-lg">
             <p className="text-xs text-left mb-1 opacity-50 font-mono">Technical Details:</p>
             <div className="text-xs font-mono bg-black/30 p-4 rounded text-left overflow-auto max-h-32 w-full border border-white/10 text-red-300/80">
              {error}
             </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden group">
      {/* Floating Toolbar */}
      <div className="absolute top-2 right-2 z-10 flex gap-1 bg-slate-800/80 backdrop-blur rounded-lg p-1 border border-slate-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button onClick={() => setScale(s => Math.min(s + 0.2, 4))} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={() => setScale(s => Math.max(s - 0.2, 0.2))} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={() => { setScale(1); setPosition({x:0,y:0}) }} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition" title="Reset View">
          <Maximize className="w-4 h-4" />
        </button>
        <div className="w-px bg-slate-700 mx-1"></div>
        <button onClick={handleExportSVG} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition" title="Export SVG">
          <Download className="w-4 h-4" />
        </button>
        <button onClick={handleExportPNG} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 transition" title="Export PNG">
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Diagram Container */}
      <div 
        className="w-full h-full overflow-hidden flex items-center justify-center cursor-move"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          ref={containerRef}
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          className="min-w-full min-h-full flex items-center justify-center p-8"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
    </div>
  );
};

export default MermaidRenderer;
