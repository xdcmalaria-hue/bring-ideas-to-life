/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Using gemini-3-pro-preview for complex reasoning and code generation.
const GEMINI_MODEL = 'gemini-3-pro-preview';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are an AI system that converts visual design inputs (images or PDFs) plus optional user instructions into a final front-end UI implementation.

Your job is to:

Analyze the visual input

Process the user's written prompt

Merge BOTH into a final UI design

Generate code in the REQUESTED FRAMEWORK (React, Vue, or HTML)

Output a complete HTML document consumable by an iframe

You must ALWAYS follow the pipeline below in order:

🔵 STEP 0 — READ USER INPUT PROMPT

Before any processing, read the user’s text input (prompt).
User prompt can request:

style changes

color palette overrides

layout adjustments

responsiveness requirements

component interpretation hints

function indications (e.g. “this is a login form”)

themed redesign (“make it modern”, “use glassmorphism”, “dark mode”)

FRAMEWORK PREFERENCE (React, Vue, or HTML/CSS/JS)

You must obey the user prompt unless it conflicts with core generation rules.

Examples of valid user prompt interpretation:

“Make everything dark mode” → override detected colors

“Turn this sketch into a dashboard” → treat blocks as widgets

“Use modern UI, sharp cards” → change component style

“Please center content, add spacing” → adjust layout

User prompt is allowed to override:

colors

spacing

layout type (grid/flex)

component semantics

styling

But NOT allowed to override:

output format (JSON structure)

schema

pipeline steps

🔵 STEP 1 — VISUAL ANALYSIS (NO OUTPUT YET)

Analyze the uploaded image/PDF and detect:

semantic UI structure

visual grouping

element roles

spacing patterns

color palette

typography

relative positioning

Combine this understanding with the user’s text prompt.
Never output in this step.

🔵 STEP 2 — MERGED LAYOUT TREE

Generate a semantic layout tree combining:

A. What the image shows

AND

B. What the user asked for

Strict output schema:

{
  "layout": {
    "type": "root",
    "children": [
      {
        "type": "section",
        "role": "hero | header | grid | form | sidebar | footer | card | text-block | image-block",
        "props": {},
        "children": [...]
      }
    ]
  },
  "styles": {
    "colors": {
      "primary": "",
      "secondary": "",
      "background": "",
      "text": ""
    },
    "font": "",
    "spacing": {
      "base": 4,
      "scale": [4, 8, 12, 16, 24, 32]
    },
    "overridesFromPrompt": true | false
  }
}


Rules:

Always semantic

Never pixel-based

Combine user prompt + image understanding

Prefer clean, minimal tree

🔵 STEP 3 — CODE GENERATION

Generate the code based on the requested framework.

If REACT (Default):
Generate ONE React component named GeneratedUI.
Use Tailwind CSS classes.
Pure React JSX (no TS).
No external libs (other than default Lucide/Heroicons if absolutely needed, but prefer standard elements).

If VUE:
Generate a Vue 3 component object (Options API or Composition API) that can be mounted.
Use Tailwind CSS classes.

If HTML/CSS/JS:
Generate standard HTML with Tailwind classes.
Embed any necessary JS for interactivity inside <script> tags.

Rules for ALL frameworks:
Responsive
Clean layout
No comments
No extra components
No console logs

🔵 STEP 4 — GENERATE OUTPUT HTML

Embed the component inside working HTML appropriate for the framework.

--- OPTION A: REACT SCAFFOLD ---
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body class="bg-white">
  <div id="root"></div>
  <script type="text/babel">
    /* PLACE GENERATED REACT COMPONENT HERE */
    ReactDOM.createRoot(document.getElementById('root')).render(<GeneratedUI />);
  </script>
</body>
</html>

--- OPTION B: VUE SCAFFOLD ---
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
</head>
<body class="bg-white">
  <div id="app"></div>
  <script>
    const { createApp, ref, reactive, onMounted } = Vue;
    /* PLACE GENERATED VUE APP DEFINITION HERE e.g. createApp({...}).mount('#app') */
  </script>
</body>
</html>

--- OPTION C: HTML SCAFFOLD ---
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white">
   <!-- PLACE GENERATED HTML BODY CONTENT HERE -->
   <!-- PLACE GENERATED SCRIPT TAGS HERE -->
</body>
</html>

Rules:
MUST be a valid standalone HTML file
MUST run inside <iframe srcDoc>
MUST compile cleanly

🔵 STEP 5 — FINAL JSON RESPONSE

Return:

{
  "name": "Generated Interface",
  "html": "<FULL HTML STRING>",
  "layout": { ... },
  "metadata": {
    "colors": {...},
    "font": "",
    "fromUserPrompt": "<USER PROMPT>",
    "timestamp": "<ISO DATETIME>",
    "framework": "react | vue | html"
  }
}

🔥 HARD CONSTRAINTS

Never output reasoning

Never output markdown

Never output code blocks

Never output explanations

Only final JSON

Always deterministic

Always valid HTML`;

export interface GenerationResult {
  html: string;
  name: string;
  layout: any;
  metadata: any;
}

export async function bringToLife(prompt: string, fileBase64?: string, mimeType?: string, framework: string = 'react'): Promise<GenerationResult> {
  const parts: any[] = [];
  
  // Use the provided prompt if available, otherwise default logic
  let finalPrompt = prompt;
  
  if (!finalPrompt) {
      finalPrompt = fileBase64 
        ? "Analyze this image/document and generate a production-ready interface following the pipeline." 
        : "Create a demo app that shows off your capabilities.";
  }

  // Explicitly add framework instruction to the user prompt
  finalPrompt = `${finalPrompt}\n\nIMPORTANT: Generate the code using the ${framework.toUpperCase()} framework. Use the appropriate HTML scaffold for ${framework} provided in Step 4.`;

  parts.push({ text: finalPrompt });

  if (fileBase64 && mimeType) {
    parts.push({
      inlineData: {
        data: fileBase64,
        mimeType: mimeType,
      },
    });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // Lower temperature for deterministic code
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    
    try {
        const parsed = JSON.parse(text);
        return {
            html: parsed.html || "<!-- Failed to generate HTML -->",
            name: parsed.name || "Generated UI",
            layout: parsed.layout || {},
            metadata: parsed.metadata || {}
        };
    } catch (e) {
        console.error("Failed to parse JSON response:", e);
        // Fallback for non-JSON response (rare with responseMimeType set, but possible)
        return {
            html: `<html><body><pre>${text}</pre></body></html>`,
            name: "Error",
            layout: {},
            metadata: {}
        };
    }

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}

/**
 * Analyzes an image and suggests a prompt to build it.
 */
export async function analyzeImageForPrompt(fileBase64: string, mimeType: string): Promise<string> {
    const parts = [
        { text: "Analyze this image and describe the UI elements, layout, style, and content in detail to help build a frontend replica. Focus on visual design, colors, and structure. Keep it concise but descriptive. Do not include introductory text, just the description." },
        {
            inlineData: {
                data: fileBase64,
                mimeType: mimeType,
            },
        },
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Use flash for speed
            contents: { parts },
        });

        return response.text || "";
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        throw error;
    }
}