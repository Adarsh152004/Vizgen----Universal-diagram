
import React from 'react';
import { VizResponse, RechartsConfig, MermaidTheme } from '../types';
import { 
  Layout, 
  Palette, 
  Grid, 
  Type, 
  ArrowRightLeft, 
  ArrowDown, 
  Check,
  X,
  AlignVerticalSpaceAround,
  CaseSensitive,
  PaintBucket
} from 'lucide-react';
import clsx from 'clsx';

interface CustomizationPanelProps {
  viz: VizResponse;
  onUpdate: (viz: VizResponse) => void;
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark' | 'contrast';
}

const PALETTES = [
  { name: 'Default', colors: [] }, // Keeps existing
  { name: 'Ocean', colors: ['#0ea5e9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490'] },
  { name: 'Sunset', colors: ['#f43f5e', '#fb7185', '#fda4af', '#e11d48', '#be123c'] },
  { name: 'Forest', colors: ['#22c55e', '#4ade80', '#86efac', '#16a34a', '#15803d'] },
  { name: 'Violet', colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9'] },
  { name: 'Neon', colors: ['#facc15', '#a3e635', '#2dd4bf', '#f472b6', '#c084fc'] },
];

const CHART_TYPES = ['bar', 'line', 'area', 'scatter', 'composed'];
const FONTS = [
  { name: 'Default', value: 'inherit' },
  { name: 'Mono', value: 'monospace' },
  { name: 'Serif', value: 'serif' },
  { name: 'Sans', value: 'sans-serif' },
];

const MERMAID_THEMES: { name: string, value: MermaidTheme }[] = [
  { name: 'Default', value: 'default' },
  { name: 'Neutral', value: 'neutral' },
  { name: 'Dark', value: 'dark' },
  { name: 'Forest', value: 'forest' },
  { name: 'Base', value: 'base' },
];

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ viz, onUpdate, isOpen, onClose, theme }) => {
  if (!isOpen) return null;

  const bgClass = theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800';
  const textClass = theme === 'light' ? 'text-slate-900' : 'text-slate-200';

  // --- Recharts Handlers ---

  const handleRechartsTypeChange = (type: RechartsConfig['type']) => {
    if (!viz.rechartsConfig) return;
    onUpdate({
      ...viz,
      rechartsConfig: { ...viz.rechartsConfig, type }
    });
  };

  const handleRechartsToggle = (key: 'showGrid' | 'showLegend' | 'showTooltip') => {
    if (!viz.rechartsConfig) return;
    onUpdate({
      ...viz,
      rechartsConfig: { 
        ...viz.rechartsConfig, 
        [key]: viz.rechartsConfig[key] === undefined ? false : !viz.rechartsConfig[key] 
      }
    });
  };

  const handlePaletteChange = (colors: string[]) => {
    if (!viz.rechartsConfig) return;
    const newSeries = viz.rechartsConfig.series.map((s, i) => ({
      ...s,
      color: colors.length > 0 ? colors[i % colors.length] : undefined
    }));
    
    onUpdate({
      ...viz,
      rechartsConfig: { ...viz.rechartsConfig, series: newSeries }
    });
  };

  const handleLayoutChange = (layout: 'horizontal' | 'vertical') => {
    if (!viz.rechartsConfig) return;
    onUpdate({
      ...viz,
      rechartsConfig: { ...viz.rechartsConfig, layout }
    });
  };

  const handleFontChange = (fontFamily: string) => {
    if (!viz.rechartsConfig) return;
    onUpdate({
      ...viz,
      rechartsConfig: { ...viz.rechartsConfig, fontFamily }
    });
  };

  // --- Mermaid Handlers ---

  const getMermaidDirection = (code: string) => {
    const match = code.match(/(graph|flowchart|classDiagram|stateDiagram-v2|usecaseDiagram)\s+(TD|TB|BT|LR|RL)/);
    return match ? match[2] : null;
  };

  const handleMermaidDirection = (dir: string) => {
    if (!viz.mermaidCode) return;
    let code = viz.mermaidCode;
    const match = code.match(/(graph|flowchart|classDiagram|stateDiagram-v2|usecaseDiagram)\s+(TD|TB|BT|LR|RL)/);
    
    if (match) {
      code = code.replace(match[0], `${match[1]} ${dir}`);
      onUpdate({ ...viz, mermaidCode: code });
    }
  };

  const handleMermaidThemeChange = (mTheme: MermaidTheme) => {
    onUpdate({ ...viz, mermaidTheme: mTheme });
  };

  return (
    <div className={clsx("absolute top-16 right-4 z-30 w-72 rounded-xl shadow-2xl border p-4 animate-in fade-in slide-in-from-top-2 overflow-y-auto max-h-[80vh] custom-scrollbar", bgClass, textClass)}>
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-inherit">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Layout className="w-4 h-4" /> Customize
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-500/10 rounded transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6">
        
        {/* Recharts Customization */}
        {viz.visualizationType === 'recharts' && viz.rechartsConfig && (
          <>
            {/* Chart Type */}
            <div className="space-y-2">
              <label className="text-xs font-semibold opacity-60 uppercase tracking-wider flex items-center gap-2">
                <Type className="w-3 h-3" /> Chart Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CHART_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => handleRechartsTypeChange(type as any)}
                    className={clsx(
                      "px-2 py-1.5 text-xs rounded border capitalize transition truncate",
                      viz.rechartsConfig?.type === type 
                        ? "bg-indigo-500 text-white border-indigo-500" 
                        : "border-transparent hover:bg-slate-500/10"
                    )}
                    title={type}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

             {/* Layout Orientation (Only for Cartesian) */}
             {['bar', 'line', 'area', 'composed'].includes(viz.rechartsConfig.type) && (
               <div className="space-y-2">
                 <label className="text-xs font-semibold opacity-60 uppercase tracking-wider flex items-center gap-2">
                   <AlignVerticalSpaceAround className="w-3 h-3" /> Orientation
                 </label>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => handleLayoutChange('horizontal')}
                      className={clsx(
                        "flex-1 px-2 py-1.5 text-xs rounded border transition",
                        (viz.rechartsConfig.layout || 'horizontal') === 'horizontal' 
                          ? "bg-indigo-500 text-white border-indigo-500" 
                          : "border-transparent hover:bg-slate-500/10"
                      )}
                    >
                      Horizontal
                    </button>
                    <button 
                      onClick={() => handleLayoutChange('vertical')}
                      className={clsx(
                        "flex-1 px-2 py-1.5 text-xs rounded border transition",
                        viz.rechartsConfig.layout === 'vertical' 
                          ? "bg-indigo-500 text-white border-indigo-500" 
                          : "border-transparent hover:bg-slate-500/10"
                      )}
                    >
                      Vertical
                    </button>
                 </div>
               </div>
             )}

            {/* Display Options */}
            <div className="space-y-2">
              <label className="text-xs font-semibold opacity-60 uppercase tracking-wider flex items-center gap-2">
                <Grid className="w-3 h-3" /> Display
              </label>
              <div className="space-y-1">
                 {[
                   { k: 'showGrid', label: 'Grid Lines', default: true },
                   { k: 'showLegend', label: 'Legend', default: true },
                   { k: 'showTooltip', label: 'Tooltip', default: true }
                 ].map(({k, label, default: def}) => {
                   const key = k as 'showGrid' | 'showLegend' | 'showTooltip';
                   const val = viz.rechartsConfig![key] !== undefined ? viz.rechartsConfig![key] : def;
                   return (
                     <button
                       key={key}
                       onClick={() => handleRechartsToggle(key)}
                       className="w-full flex items-center justify-between px-3 py-2 text-xs rounded hover:bg-slate-500/10 transition"
                     >
                       {label}
                       {val ? <Check className="w-3 h-3 text-emerald-500" /> : <div className="w-3 h-3 rounded-full border border-slate-500/30"></div>}
                     </button>
                   )
                 })}
              </div>
            </div>

            {/* Font Options */}
            <div className="space-y-2">
              <label className="text-xs font-semibold opacity-60 uppercase tracking-wider flex items-center gap-2">
                <CaseSensitive className="w-3 h-3" /> Font Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FONTS.map(font => (
                  <button
                    key={font.name}
                    onClick={() => handleFontChange(font.value)}
                    className={clsx(
                      "px-2 py-1.5 text-xs rounded border transition",
                      viz.rechartsConfig?.fontFamily === font.value 
                        ? "bg-indigo-500 text-white border-indigo-500" 
                        : "border-transparent hover:bg-slate-500/10"
                    )}
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Palette */}
            <div className="space-y-2">
              <label className="text-xs font-semibold opacity-60 uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-3 h-3" /> Palette
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PALETTES.map(p => (
                  <button
                    key={p.name}
                    onClick={() => handlePaletteChange(p.colors)}
                    className="group relative h-8 w-full rounded border border-white/10 overflow-hidden hover:scale-105 transition-transform"
                    title={p.name}
                  >
                     <div className="absolute inset-0 flex">
                        {p.colors.length > 0 ? p.colors.map(c => (
                          <div key={c} className="flex-1 h-full" style={{ backgroundColor: c }} />
                        )) : (
                          <div className={clsx("w-full h-full", theme === 'light' ? "bg-slate-200" : "bg-slate-700")}></div>
                        )}
                     </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Mermaid Customization */}
        {viz.visualizationType === 'mermaid' && viz.mermaidCode && (
          <div className="space-y-6">
             <div className="space-y-2">
                 <label className="text-xs font-semibold opacity-60 uppercase tracking-wider flex items-center gap-2">
                    <ArrowRightLeft className="w-3 h-3" /> Direction
                  </label>
                  {getMermaidDirection(viz.mermaidCode) ? (
                     <div className="flex gap-2">
                        <button 
                          onClick={() => handleMermaidDirection('TD')}
                          className={clsx(
                            "flex-1 px-3 py-2 rounded border text-xs flex flex-col items-center gap-1 transition",
                             getMermaidDirection(viz.mermaidCode!) === 'TD' || getMermaidDirection(viz.mermaidCode!) === 'TB'
                               ? "bg-indigo-500 text-white border-indigo-500" 
                               : "border-transparent hover:bg-slate-500/10"
                          )}
                        >
                           <ArrowDown className="w-4 h-4" /> Top-Down
                        </button>
                        <button 
                          onClick={() => handleMermaidDirection('LR')}
                          className={clsx(
                            "flex-1 px-3 py-2 rounded border text-xs flex flex-col items-center gap-1 transition",
                             getMermaidDirection(viz.mermaidCode!) === 'LR'
                               ? "bg-indigo-500 text-white border-indigo-500" 
                               : "border-transparent hover:bg-slate-500/10"
                          )}
                        >
                           <ArrowRightLeft className="w-4 h-4" /> Left-Right
                        </button>
                     </div>
                  ) : (
                    <p className="text-xs opacity-50 italic">Direction customization not available for this diagram type.</p>
                  )}
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-semibold opacity-60 uppercase tracking-wider flex items-center gap-2">
                    <PaintBucket className="w-3 h-3" /> Theme
                  </label>
                  <select 
                    value={viz.mermaidTheme || 'default'}
                    onChange={(e) => handleMermaidThemeChange(e.target.value as MermaidTheme)}
                    className={clsx(
                      "w-full px-3 py-2 rounded border text-sm appearance-none outline-none focus:ring-2 focus:ring-indigo-500/50 transition",
                      theme === 'light' 
                        ? "bg-slate-50 border-slate-200 text-slate-800" 
                        : "bg-slate-800 border-slate-700 text-slate-200"
                    )}
                  >
                    {MERMAID_THEMES.map(t => (
                      <option key={t.value} value={t.value}>{t.name}</option>
                    ))}
                  </select>
              </div>
          </div>
        )}

        {viz.visualizationType === 'svg' && (
          <div className="text-center py-4">
            <p className="text-xs opacity-50">Customization for raw SVG is currently limited to code editing.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default CustomizationPanel;
