import React, { useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart,
} from 'recharts';
import { RechartsConfig, Theme } from '../types';
import { Download, Image as ImageIcon, AlertCircle } from 'lucide-react';

/**
 * Props for the RechartsRenderer component
 */
interface RechartsRendererProps {
  config: RechartsConfig;
  theme: Theme;
}

// ---------------------------------------------------------------------------
// Constants & Configuration
// ---------------------------------------------------------------------------

/**
 * Color palettes tailored for each theme mode.
 * - Dark: Pastel/Neons that pop on dark backgrounds.
 * - Light: Standard professional data colors.
 * - Contrast: Maximum visibility high-contrast colors.
 */
const PALETTES = {
  dark: ['#818cf8', '#f472b6', '#a78bfa', '#2dd4bf', '#fbbf24', '#f87171', '#34d399'],
  light: ['#4f46e5', '#db2777', '#7c3aed', '#0d9488', '#d97706', '#dc2626', '#059669'],
  contrast: ['#ffff00', '#00ffff', '#ff00ff', '#ffffff', '#00ff00', '#ff0000', '#0000ff']
};

/**
 * RechartsRenderer
 * 
 * Dynamic component that takes a JSON configuration and renders the appropriate 
 * Recharts component. Handles theme adaptation, exports, and tooltips.
 */
const RechartsRenderer: React.FC<RechartsRendererProps> = ({ config, theme }) => {
  const { type, data, xAxisKey, yAxisLabel, series, showGrid, showLegend, showTooltip, layout, barSize, fontFamily } = config;
  const containerRef = useRef<HTMLDivElement>(null);

  // Default display values if not present
  const shouldShowGrid = showGrid !== false;
  const shouldShowLegend = showLegend !== false;
  const shouldShowTooltip = showTooltip !== false;

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
        <p>No data points available to render.</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Style Computation
  // ---------------------------------------------------------------------------
  
  const colors = PALETTES[theme];
  // Determine grid and text colors based on active theme
  const gridColor = theme === 'light' ? '#e2e8f0' : theme === 'contrast' ? '#ffffff' : '#334155';
  const textColor = theme === 'light' ? '#475569' : theme === 'contrast' ? '#ffff00' : '#94a3b8';
  
  // Custom Tooltip styles
  const tooltipStyle = {
    backgroundColor: theme === 'light' ? '#ffffff' : '#1e293b',
    borderColor: theme === 'light' ? '#cbd5e1' : '#334155',
    color: theme === 'light' ? '#0f172a' : '#f1f5f9',
    fontFamily: fontFamily || 'inherit'
  };

  /**
   * Custom Tooltip Component
   * Renders a clean list of values for the hovered data point.
   */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={tooltipStyle} className="border p-3 rounded shadow-lg text-sm z-50">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}: {entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // ---------------------------------------------------------------------------
  // Render Logic
  // ---------------------------------------------------------------------------

  /**
   * Switch statement to select the correct Recharts component based on `config.type`
   */
  const renderChart = () => {
    const isVertical = layout === 'vertical';

    const commonProps = {
      data,
      layout: layout || 'horizontal',
      margin: { top: 10, right: 30, left: 20, bottom: 0 }, // Added left margin for vertical labels
      style: { fontFamily: fontFamily || 'inherit' }
    };

    const cartesianGrid = shouldShowGrid ? (
      <CartesianGrid 
        strokeDasharray="3 3" 
        stroke={gridColor} 
        opacity={theme === 'contrast' ? 1 : 0.5} 
      />
    ) : null;

    // Logic for swapping Axes based on Layout
    // Vertical Layout: X Axis is Numeric, Y Axis is Categorical (Data Key)
    // Horizontal Layout: X Axis is Categorical (Data Key), Y Axis is Numeric
    const commonXAxis = (
      <XAxis 
        type={isVertical ? "number" : "category"}
        dataKey={isVertical ? undefined : xAxisKey}
        stroke={textColor} 
        fontSize={12} 
        tickLine={false} 
        fontFamily={fontFamily}
      />
    );

    const commonYAxis = (
      <YAxis 
        type={isVertical ? "category" : "number"}
        dataKey={isVertical ? xAxisKey : undefined}
        label={!isVertical && yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', fill: textColor } : undefined} 
        stroke={textColor} 
        fontSize={12} 
        tickLine={false} 
        width={isVertical ? 100 : 40} // More space for labels in vertical
        fontFamily={fontFamily}
      />
    );

    const tooltip = shouldShowTooltip ? (
      <Tooltip 
        content={<CustomTooltip />} 
        cursor={{fill: theme === 'light' ? '#f1f5f9' : '#334155', opacity: 0.4}} 
      />
    ) : null;

    const legend = shouldShowLegend ? <Legend wrapperStyle={{ paddingTop: '10px', fontFamily: fontFamily || 'inherit' }} /> : null;
    
    // Safety check for series
    if (!series) return null;

    switch (type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {cartesianGrid}
            {commonXAxis}
            {commonYAxis}
            {tooltip}
            {legend}
            {series.map((s, i) => (
              <Bar 
                key={s.dataKey} 
                dataKey={s.dataKey} 
                name={s.name || s.dataKey} 
                fill={s.color || colors[i % colors.length]} 
                stackId={s.stackId}
                radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                barSize={barSize}
              />
            ))}
          </BarChart>
        );
        
      case 'line':
        return (
          <LineChart {...commonProps}>
            {cartesianGrid}
            {commonXAxis}
            {commonYAxis}
            {tooltip}
            {legend}
            {series.map((s, i) => (
              <Line 
                key={s.dataKey} 
                type="monotone" 
                dataKey={s.dataKey} 
                name={s.name || s.dataKey} 
                stroke={s.color || colors[i % colors.length]} 
                strokeWidth={theme === 'contrast' ? 4 : 3}
                dot={{ r: 4, fill: s.color || colors[i % colors.length] }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {cartesianGrid}
            {commonXAxis}
            {commonYAxis}
            {tooltip}
            {legend}
            {series.map((s, i) => (
              <Area 
                key={s.dataKey} 
                type="monotone" 
                dataKey={s.dataKey} 
                name={s.name || s.dataKey} 
                stroke={s.color || colors[i % colors.length]} 
                fill={s.color || colors[i % colors.length]} 
                fillOpacity={0.3}
                stackId={s.stackId}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        if (!series[0]) return null;
        return (
          <PieChart style={{ fontFamily: fontFamily || 'inherit' }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              innerRadius={60}
              paddingAngle={5}
              dataKey={series[0].dataKey}
              nameKey={xAxisKey || 'name'}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={series[0].color || colors[index % colors.length]} stroke={theme === 'contrast' ? '#000' : 'none'} />
              ))}
            </Pie>
            {shouldShowTooltip && <Tooltip content={<CustomTooltip />} />}
            {shouldShowLegend && <Legend />}
          </PieChart>
        );

      case 'radar':
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data} style={{ fontFamily: fontFamily || 'inherit' }}>
            <PolarGrid stroke={gridColor} />
            <PolarAngleAxis dataKey={xAxisKey} tick={{ fill: textColor, fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
            {series.map((s, i) => (
              <Radar
                key={s.dataKey}
                name={s.name || s.dataKey}
                dataKey={s.dataKey}
                stroke={s.color || colors[i % colors.length]}
                fill={s.color || colors[i % colors.length]}
                fillOpacity={0.4}
              />
            ))}
            {tooltip}
            {legend}
          </RadarChart>
        );

      case 'scatter':
         if (!series[0]) return null;
         return (
          <ScatterChart style={{ fontFamily: fontFamily || 'inherit' }}>
            {cartesianGrid}
            <XAxis type="number" dataKey={xAxisKey} name={xAxisKey} unit="" stroke={textColor} fontFamily={fontFamily} />
            <YAxis type="number" dataKey={series[0].dataKey} name={series[0].name} unit="" stroke={textColor} fontFamily={fontFamily} />
            {shouldShowTooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />}
            {legend}
            {series.map((s, i) => (
              <Scatter 
                key={s.dataKey} 
                name={s.name || s.dataKey} 
                data={data} 
                fill={s.color || colors[i % colors.length]} 
              />
            ))}
          </ScatterChart>
         );

      case 'composed':
        return (
           <ComposedChart data={data} layout={layout || 'horizontal'} margin={{ top: 10, right: 30, left: 20, bottom: 0 }} style={{ fontFamily: fontFamily || 'inherit' }}>
              {cartesianGrid}
              {commonXAxis}
              {commonYAxis}
              {tooltip}
              {legend}
              {series.map((s, i) => (
                 <Bar 
                  key={s.dataKey} 
                  dataKey={s.dataKey} 
                  name={s.name || s.dataKey} 
                  fill={s.color || colors[i % colors.length]} 
                  barSize={barSize}
                  radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                 />
              ))}
           </ComposedChart>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-slate-500">
            Unsupported chart type: {type}
          </div>
        );
    }
  };

  // ---------------------------------------------------------------------------
  // Export Handlers
  // ---------------------------------------------------------------------------

  const handleExportPNG = () => {
     const svgElement = containerRef.current?.querySelector('.recharts-surface');
     if (!svgElement) return;
     
     // Serialize current SVG
     const svgData = new XMLSerializer().serializeToString(svgElement);
     const canvas = document.createElement('canvas');
     const ctx = canvas.getContext('2d');
     const img = new Image();
     
     // 2x Scaling for Retina display quality
     const rect = svgElement.getBoundingClientRect();
     canvas.width = rect.width * 2;
     canvas.height = rect.height * 2;
     
     img.onload = () => {
       if (!ctx) return;
       ctx.fillStyle = theme === 'light' ? '#ffffff' : theme === 'contrast' ? '#000000' : '#0f172a';
       ctx.fillRect(0, 0, canvas.width, canvas.height);
       ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
       
       const pngUrl = canvas.toDataURL('image/png');
       const a = document.createElement('a');
       a.href = pngUrl;
       a.download = `chart-${Date.now()}.png`;
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
     };
     
     img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleExportSVG = () => {
    const svgElement = containerRef.current?.querySelector('.recharts-surface');
    if (!svgElement) return;

    let svgData = new XMLSerializer().serializeToString(svgElement);
    // Add XML declaration if missing
    if (!svgData.match(/^<\?xml/)) {
      svgData = '<?xml version="1.0" standalone="no"?>\r\n' + svgData;
    }

    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chart-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full h-full flex flex-col group" ref={containerRef}>
      {/* Export Controls (Visible on Hover) */}
      <div className="absolute top-0 right-0 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleExportSVG} className="p-1.5 hover:bg-slate-700/50 rounded text-slate-400 hover:text-slate-200 transition" title="Export SVG">
          <Download className="w-4 h-4" />
        </button>
        <button onClick={handleExportPNG} className="p-1.5 hover:bg-slate-700/50 rounded text-slate-400 hover:text-slate-200 transition" title="Export PNG">
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="w-full h-[400px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart() || <div></div>}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RechartsRenderer;