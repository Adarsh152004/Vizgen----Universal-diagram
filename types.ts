
// Supported visualization types
export type VisualizationType = 'mermaid' | 'recharts' | 'svg';
export type Theme = 'light' | 'dark' | 'contrast';
export type MermaidTheme = 'default' | 'neutral' | 'dark' | 'forest' | 'base';

// Recharts specific configuration
export interface RechartsSeries {
  dataKey: string;
  color?: string;
  name?: string;
  stackId?: string;
}

export interface RechartsConfig {
  type: 'bar' | 'line' | 'area' | 'pie' | 'radar' | 'scatter' | 'composed';
  data: any[];
  xAxisKey?: string; // Key for X Axis
  yAxisLabel?: string;
  series: RechartsSeries[];
  title?: string;
  description?: string;
  // Customization Options
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  layout?: 'horizontal' | 'vertical'; // Orientation for bar/line charts
  barSize?: number; // Thickness of bars
  fontFamily?: string; // Font style
}

// Main response structure from Gemini
export interface VizResponse {
  id?: string; // Optional client-side ID
  visualizationType: VisualizationType;
  title: string;
  explanation: string;
  originalPrompt?: string; // The prompt used to generate this visualization
  
  // Content depends on type
  mermaidCode?: string; // Present if type is 'mermaid'
  mermaidTheme?: MermaidTheme; // Specific theme for mermaid diagrams

  svgCode?: string;     // Present if type is 'svg'
  rechartsConfig?: RechartsConfig; // Present if type is 'recharts'
}

export interface HistoryItem extends VizResponse {
  id: string;
  prompt: string;
  timestamp: number;
}
