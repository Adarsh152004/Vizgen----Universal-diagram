import { GoogleGenAI, Type, Schema } from "@google/genai";
import { VizResponse } from "../types";

// Schema definition for the expected JSON response
const rechartsSeriesSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    dataKey: { type: Type.STRING, description: "Key in data object for value" },
    color: { type: Type.STRING, description: "Hex color code" },
    name: { type: Type.STRING, description: "Readable name for legend" },
    stackId: { type: Type.STRING, description: "Optional stack ID for stacked charts" },
  },
  required: ["dataKey"],
};

// We must define valid properties for the data objects to satisfy the API's strict schema requirements.
const rechartsDataPointSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    // Categorical / Time keys
    name: { type: Type.STRING },
    category: { type: Type.STRING },
    date: { type: Type.STRING },
    time: { type: Type.STRING },
    month: { type: Type.STRING },
    year: { type: Type.STRING },
    day: { type: Type.STRING },
    label: { type: Type.STRING },
    group: { type: Type.STRING },
    
    // Numerical keys
    value: { type: Type.NUMBER },
    count: { type: Type.NUMBER },
    amount: { type: Type.NUMBER },
    percent: { type: Type.NUMBER },
    score: { type: Type.NUMBER },
    rating: { type: Type.NUMBER },
    total: { type: Type.NUMBER },
    
    // Coordinates
    x: { type: Type.NUMBER },
    y: { type: Type.NUMBER },
    z: { type: Type.NUMBER },
    
    // Financial
    price: { type: Type.NUMBER },
    cost: { type: Type.NUMBER },
    revenue: { type: Type.NUMBER },
    profit: { type: Type.NUMBER },
    sales: { type: Type.NUMBER },
    open: { type: Type.NUMBER },
    high: { type: Type.NUMBER },
    low: { type: Type.NUMBER },
    close: { type: Type.NUMBER },
    
    // Generic Series
    series1: { type: Type.NUMBER },
    series2: { type: Type.NUMBER },
    series3: { type: Type.NUMBER },
    series4: { type: Type.NUMBER },
    series5: { type: Type.NUMBER },
    v1: { type: Type.NUMBER },
    v2: { type: Type.NUMBER },
    v3: { type: Type.NUMBER },
    
    // Styling overrides (sometimes useful)
    fill: { type: Type.STRING, description: "Optional override color" },
  },
  // We do not set 'required' here to allow flexibility, 
  // but the properties map is strictly enforced by the API.
};

const rechartsConfigSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["bar", "line", "area", "pie", "radar", "scatter", "composed"] },
    data: { 
      type: Type.ARRAY, 
      items: rechartsDataPointSchema,
      description: "Array of data objects. You MUST use the defined property keys (e.g., name, value, category, series1, etc.) that match your dataKey configuration." 
    },
    xAxisKey: { type: Type.STRING, description: "Key for X-axis labels. Must match one of the string properties in data items (e.g. 'name', 'month')." },
    yAxisLabel: { type: Type.STRING, description: "Label for Y-axis" },
    series: { type: Type.ARRAY, items: rechartsSeriesSchema },
    title: { type: Type.STRING },
    layout: { type: Type.STRING, enum: ["horizontal", "vertical"], description: "Orientation of the chart." },
    barSize: { type: Type.NUMBER, description: "Width of bars in pixels." },
    fontFamily: { type: Type.STRING, description: "Font family for the chart text." },
  },
  required: ["type", "data", "series"],
};

const vizResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    visualizationType: { 
      type: Type.STRING, 
      enum: ["mermaid", "recharts", "svg"],
      description: "The best tool to visualize the request. Use 'mermaid' for diagrams, 'recharts' for statistical data plots, and 'svg' for custom illustrations." 
    },
    title: { type: Type.STRING, description: "A professional title for the visualization" },
    explanation: { type: Type.STRING, description: "An executive summary of what this visualization demonstrates." },
    mermaidCode: { type: Type.STRING, description: "Valid Mermaid.js code. Ensure newlines are encoded as \\n. The first line MUST be the diagram type ONLY (e.g. 'flowchart TD', 'stateDiagram-v2'), followed by a newline." },
    svgCode: { type: Type.STRING, description: "Valid SVG code if type is svg. Must include xmlns, viewBox, accessibility tags (role='img', title, desc), and CSS animations." },
    rechartsConfig: rechartsConfigSchema,
  },
  required: ["visualizationType", "title", "explanation"],
};

const SYSTEM_INSTRUCTION = `
You are a Senior Visualization Architect and Data Scientist. Your goal is to generate professional, executive-grade visualizations for real-world business, technical, and scientific scenarios.

1. **Analyze the Request**: 
   - Identify the user's core intent. If the data is vague (e.g., "sales chart"), generate REALISTIC, coherent dummy data with seasonality or logical trends, not just random numbers.
   - Choose the tool that delivers the most clarity and impact.
   
   - **Mermaid**: Best for structural logic. 
     - **SUPPORTED TYPES**: Flowcharts, Sequence, Class (UML), State, ERD, Gantt, Git graphs, Use Case Diagrams.
     - **NOT SUPPORTED**: Mindmaps, User Journeys, Sankey, Maps. DO NOT generate these.
   - **Recharts**: Best for quantitative analysis (Bar, Line, Area, Pie, Scatter, Radar).
   - **SVG**: Best for spatial, custom, or artistic layouts (Venn diagrams, custom infographics, simple topology). **DO NOT** attempt complex geographical maps or Sankey diagrams in raw SVG as they require too much data.

2. **Generate the Output**:

   - **For Mermaid (Critical Syntax Rules)**:
     - **DIAGRAM TYPE**: Use 'flowchart' instead of 'graph' where possible.
     - **HEADER**: The first line MUST BE the diagram type (e.g., 'flowchart TD', 'stateDiagram-v2', 'usecaseDiagram'). Follow it immediately with a newline (\\n).
     - **QUOTING**: ALL text labels MUST be enclosed in double quotes. This is NON-NEGOTIABLE for labels with spaces, parentheses (), brackets [], or special characters.
       - Correct: id["User (Admin)"]
       - Incorrect: id[User (Admin)]
       - Incorrect: id(User (Admin)) -> Fix: id("User (Admin)")
       - **EXCEPTION**: For 'stateDiagram' and 'gantt', do NOT quote state identifiers, section names, task names, OR descriptions.
     - **SEQUENCE DIAGRAMS**:
       - Avoid using \`activate\` and \`deactivate\` on participants with spaces in their names (e.g., "Bank System") as this often causes rendering errors. Use aliases if needed.
     - **CLASS DIAGRAMS**:
       - Use \`class\` keyword. Do NOT use \`enum\`. Use \`<<enumeration>>\` stereotype instead.
     - **USE CASE DIAGRAMS**:
       - Use \`usecaseDiagram\`.
       - Wrap use case labels in quotes inside parentheses: e.g., \`("Browse Products")\` instead of \`(Browse Products)\`.
     - **NEWLINES**: Ensure strictly ONE statement per line. Use \\n for newlines in the string.

   - **For Recharts (Data Integrity)**:
     - **REALISM**: Generate at least 7-12 data points for trends.
     - **SCHEMA**: Strict adherence to schema properties.

   - **For SVG (Enhanced Accessibility, Animation & Interactivity)**:
     - **ACCESSIBILITY**: 
       - You MUST add \`role="img"\` and \`aria-labelledby="title desc"\` to the root \`<svg>\`.
       - You MUST include a \`<title id="title">\` and \`<desc id="desc">\` tag inside the SVG explaining the content.
       - Use \`aria-label\` on complex internal groups.
     - **ANIMATION**:
       - You MUST include a \`<style>\` block inside the SVG.
       - Define subtle CSS \`@keyframes\` animations (e.g., gentle pulse for nodes, dash-offset draw for paths, fade-in, or hover effects). 
       - Apply these animations to relevant classes. Keep them professional and subtle (slow duration, ease-in-out).
     - **INTERACTIVITY**:
       - Add the class \`vizgen-interactive\` to significant elements (regions in a map, nodes in a network, specific data bars).
       - Ensure these elements have a \`<title>\` tag as a direct child, which acts as a native tooltip and allows the application to extract info on click.
       - Use \`cursor: pointer\` in the CSS for \`.vizgen-interactive\`.
     - **DESIGN**:
       - **VIEWBOX**: Must provide a responsive \`viewBox\`.
       - **STYLE**: Use inline styles or the internal \`<style>\` block. Support dark mode by using \`currentColor\` or neutral grays/whites where appropriate.

3. **Tone & Quality**:
   - Titles should be descriptive (e.g., "Q3 2024 Revenue Analysis" instead of "Chart").
   - Explanations should be insightful summaries suitable for a presentation.
`;


const cleanJsonString = (str: string): string => {
  // Remove markdown code block syntax if present
  let cleaned = str.replace(/```json/g, "").replace(/```/g, "");
  // Trim whitespace
  cleaned = cleaned.trim();
  return cleaned;
};

const fixMermaidCode = (code: string): string => {
  // 1. Normalize environment
  let fixed = code
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\u00A0/g, " ")
    .replace(/```mermaid/g, "")
    .replace(/```/g, "")
    .trim();

  const lines = fixed.split("\n");
  const header = lines[0].trim();

  // ================================================================
  // === CLASS DIAGRAM (UML) FIXES ==================================
  // ================================================================
  if (header.startsWith("classDiagram")) {
    fixed = fixed
      // Replace 'enum' keyword with stable class + stereotype
      .replace(/enum\s+(\w+)\s*\{/g, "class $1 {\n    <<enumeration>>")
      // Ensure relationships use valid UML arrows if AI gets lazy
      .replace(/(\w+)\s*->\s*(\w+)/g, "$1 --|> $2")
      // Fix visibility markers that lack spacing
      .replace(/^(\s*)([+\-#~])(\w+)/gm, "$1$2 $3");
    return fixed;
  }

  // ================================================================
  // === USECASE DIAGRAM FIXES ======================================
  // ================================================================
  if (header.startsWith("usecaseDiagram")) {
    // Basic cleanup: Use Case diagrams are extremely sensitive to parentheses
    return fixed.replace(/\(([^"\n]+)\)/g, (m, content) => {
      if (content.startsWith('"')) return m;
      return `("${content.trim()}")`;
    });
  }

  // ================================================================
  // === DEFAULT FLOWCHART FIXES ====================================
  // ================================================================
  if (header.startsWith("flowchart") || header.startsWith("graph")) {
    return lines.map(line => {
      if (line.includes("flowchart") || line.includes("graph")) return line;
      
      // Protect labels: ensure anything in brackets/parens is quoted but NOT double-quoted
      return line
        .replace(/\["?(.*?)"?\]/g, '["$1"]')
        .replace(/\("?(.*?)"?\)/g, '("$1")')
        .replace(/\{"?(.*?)"?\}/g, '{"$1"}');
    }).join("\n");
  }

  return fixed;
};


export const generateVisualization = async (prompt: string, context?: VizResponse): Promise<VizResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("System Error: API Key is missing. Please check configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  // Construct context-aware prompt if refining
  let finalPrompt = prompt;
  
  if (context) {
    let contextCode = '';
    if (context.visualizationType === 'mermaid') contextCode = context.mermaidCode || '';
    else if (context.visualizationType === 'recharts') contextCode = JSON.stringify(context.rechartsConfig);
    else if (context.visualizationType === 'svg') contextCode = context.svgCode || '';

    finalPrompt = `
      CURRENT VISUALIZATION CONTEXT (${context.visualizationType}):
      ${contextCode}

      USER REQUEST FOR MODIFICATION:
      "${prompt}"

      INSTRUCTIONS:
      1. Analyze the current visualization code and the user's modification request.
      2. Regenerate the FULL visualization code incorporating the changes. 
      3. Maintain the same visualization type unless explicitly asked to change it.
      4. Ensure all accessibility, animation, and interactivity rules (especially for SVG) are applied to the new version.
      5. Return the complete valid JSON response, not just the diff.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: vizResponseSchema,
        thinkingConfig: { thinkingBudget: 1024 }, 
      },
    });

    const text = response.text;
    if (!text) {
        // Check for safety blocks if text is empty
        if (response.candidates && response.candidates[0] && response.candidates[0].finishReason) {
            const reason = response.candidates[0].finishReason;
            if (reason === 'SAFETY' || reason === 'BLOCKLIST') {
                 throw new Error("The content was blocked due to safety settings. Please revise your prompt.");
            }
        }
        throw new Error("The AI model returned an empty response. Please try again.");
    }

    try {
        const cleanedText = cleanJsonString(text);
        const vizData = JSON.parse(cleanedText) as VizResponse;

        // Post-processing to fix common LLM Mermaid syntax issues
        if (vizData.visualizationType === 'mermaid' && vizData.mermaidCode) {
           const trimmedCode = vizData.mermaidCode.trim();
           // Strict check for unsupported types
           if (trimmedCode.startsWith('mindmap')) {
             throw new Error("The requested diagram type (Mindmap) is not supported. Please request a Flowchart, Use Case, or Class diagram instead.");
           }
           if (trimmedCode.startsWith('journey') || trimmedCode.startsWith('user-journey')) {
             throw new Error("The requested diagram type (User Journey) is not supported. Please request a Sequence Diagram or Flowchart instead.");
           }

           vizData.mermaidCode = fixMermaidCode(vizData.mermaidCode);
        }

        return vizData;
    } catch (parseError: any) {
        if (parseError.message && parseError.message.includes("not supported")) {
            throw parseError; // Rethrow supported error messages
        }
        console.error("JSON Parse Error:", parseError, "Raw Text:", text);
        throw new Error("Failed to process the AI response. The generated visualization data was malformed.");
    }

  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    
    let message = "An unexpected error occurred while communicating with the AI.";
    
    // Network errors (Fetch failures)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        message = "Network Error: Unable to connect to Google Gemini. Please check your internet connection.";
    } 
    
    // API specific errors based on status or message content
    else if (error.status || error.response?.status) {
        const status = error.status || error.response?.status;
        switch (status) {
            case 400:
                message = "Invalid Request: The AI could not understand the prompt. Please try rephrasing.";
                break;
            case 401:
                message = "Authentication Failed: Invalid API Key. Please check your .env configuration.";
                break;
            case 403:
                message = "Access Denied: Your API key does not have permission to access this model, or the project has restricted access.";
                break;
            case 404:
                message = "Model Not Found: The specified AI model version is unavailable.";
                break;
            case 429:
                message = "Rate Limit Exceeded: You are sending requests too quickly. Please wait a moment before trying again.";
                break;
            case 500:
                message = "Google Internal Error: The AI service encountered an internal error. Please try again later.";
                break;
            case 503:
                message = "Service Overloaded: The AI model is currently busy. Please try again in a few seconds.";
                break;
            default:
                if (error.message) message = `API Error: ${error.message}`;
        }
    } 
    // Fallback error message matching
    else if (error.message) {
        if (error.message.includes("API key")) {
            message = "Authentication Configuration Error: API Key is missing or invalid.";
        } else if (error.message.includes("quota")) {
            message = "Quota Exceeded: You have reached the usage limit for your API key.";
        } else if (error.message.includes("safety")) {
             message = "Safety Block: The request was blocked by safety filters.";
        } else {
             message = error.message;
        }
    }

    throw new Error(message);
  }
};