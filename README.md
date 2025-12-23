# VizGen - Universal Diagram Generator

VizGen is an AI-powered tool that generates diagrams, charts, and visualizations from text prompts using Mermaid.js, Recharts, and raw SVG.

## 🚀 Setup for VS Code

Follow these steps to run the project locally on your machine.

### Prerequisites

1.  **Node.js**: Ensure you have Node.js (version 18 or higher) installed. [Download Here](https://nodejs.org/).
2.  **API Key**: You need a Google Gemini API Key. [Get it here](https://aistudio.google.com/app/apikey).

### Installation

1.  Open the project folder in VS Code.
2.  Open the terminal (`Ctrl + ~`) and install dependencies:

    ```bash
    npm install
    ```

### Configuration

1.  Create a file named `.env` in the root directory.
2.  Add your API Key to the file:

    ```env
    API_KEY=your_gemini_api_key_here
    ```

    *(Note: The variable name must match what is used in `services/geminiService.ts`. Since this project uses Vite, you might typically see `VITE_API_KEY`, but the provided code uses a replacement plugin or `process.env`. If using standard Vite, use `VITE_API_KEY` and update the code to `import.meta.env.VITE_API_KEY` or configure `vite.config.ts` to expose `process.env`).*
    
    *For this specific codebase config:*
    ```env
    API_KEY=AIzaSy...
    ```

### Running the App

1.  Start the development server:

    ```bash
    npm run dev
    ```

2.  Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

## 🛠️ Tech Stack

*   **Frontend**: React (TypeScript), Vite
*   **Styling**: Tailwind CSS
*   **AI Model**: Google Gemini 2.5 Flash
*   **Visualization**:
    *   *Mermaid.js* (Diagrams)
    *   *Recharts* (Charts)
    *   *SVG* (Custom Visuals)

## 🐛 Troubleshooting

*   **API Errors**: Check your `.env` file and ensure your API key is valid.
*   **Rendering Issues**: If a diagram fails to render, check the console for syntax errors. The app includes auto-fixers for common Mermaid issues.
