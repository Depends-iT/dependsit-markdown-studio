export const DEFAULT_MARKDOWN_CONTENT = `
# Welcome to DependsiT Markdown Studio

A private markdown editor that runs entirely in your browser. Your files never leave your device.

## Features

- **Edit Markdown** with a live split-pane preview, GFM tables, KaTeX math, and Mermaid diagrams.
- **Convert Documents** — drag and drop PDF, Word, PowerPoint, Excel, CSV, HTML, JSON, or XML files to extract their content as Markdown.
- **Export** your work as PDF, Word (.docx), HTML, plain text, or raw Markdown from the File menu.
- **Work Offline** — install this as a desktop app (PWA) and use it without an internet connection.
- **Manage Tabs** — open multiple files at once. Everything auto-saves to your browser's local storage.

## Markdown Extensions

### 1. Math (KaTeX)

Inline: $E = mc^2$, or as a block:

$$
\\frac{1}{\\Bigl(\\sqrt{\\phi \\sqrt{5}}-\\phi\\Bigr) e^{\\frac25 \\pi}} =
1+\\frac{e^{-2\\pi}} {1+\\frac{e^{-4\\pi}} {1+\\frac{e^{-6\\pi}}
{1+\\frac{e^{-8\\pi}} {1+\\ldots} } } }
$$

### 2. Diagrams (Mermaid)

\`\`\`mermaid
graph TD;
    A[Upload File] --> B{Is it a PDF?};
    B -- Yes --> C[Use Local PDF Parser];
    B -- No --> D[Use Local Converter];
    C --> E[Convert to Markdown];
    D --> E;
    E --> F[Edit & Export];
\`\`\`

### 3. GitHub Flavored Markdown (GFM)

- [x] Tables and task lists
- [x] Strikethrough and autolinks
- [ ] Your next project

| Syntax      | Description | Test Text     |
| :---        |    :----:   |          ---: |
| Header      | Title       | Here's this   |
| Paragraph   | Text        | And more      |

## Privacy

This editor runs 100% client-side using WebAssembly. There are no servers, databases, analytics, or tracking scripts involved. Your documents stay on your machine.

## Architecture

\`\`\`mermaid
graph TB
    Import[Drag & Drop / Upload File] --> PDF[PDF Documents]
    Import --> Word[Word .docx]
    Import --> Data[Office & Data: .pptx, .xlsx, .csv, .json, .xml]

    PDF --> PDF_P("pdf.js Layout Engine")
    Word --> Mammoth("Mammoth HTML Parser")
    Data --> WASM["Pyodide WebAssembly Worker"]
    WASM --> MarkItDown["Microsoft MarkItDown Engine"]

    PDF_P --> Editor["Split-Pane Editor Workspace"]
    Mammoth --> Editor
    MarkItDown --> Editor

    Editor --> IDB[("IndexedDB Document Cache")]
    Editor --> Local["localStorage Headers"]

    Editor --> GFM["GitHub GFM Tables/Tasks"]
    Editor --> Math["KaTeX Math Formulas"]
    Editor --> Diagrams["Mermaid Diagram Renderer"]

    Editor --> Export["Export Options"]
    Export --> MD_Out[".md Markdown"]
    Export --> PDF_Out[".pdf Document"]
    Export --> Doc_Out[".docx Word Document"]
    Export --> HTML_Out[".html Web Page"]
    Export --> TXT_Out[".txt Plain Text"]

    PWA["Offline PWA Framework"] -.-> Import
    PWA -.-> Editor

    classDef engine fill:#e8f4f8,stroke:#3b82f6,color:#1e3a8a;
    classDef io fill:#fdf4e3,stroke:#eab308,color:#713f12;
    classDef editor fill:#f0fdf4,stroke:#22c55e,color:#14532d;
    classDef storage fill:#faf5ff,stroke:#a855f7,color:#581c87;
    classDef system fill:#fff1f2,stroke:#f43f5e,color:#881337;

    class PDF_P,Mammoth,WASM,MarkItDown engine;
    class Import,PDF,Word,Data,MD_Out,PDF_Out,Doc_Out,HTML_Out,TXT_Out,Export io;
    class Editor,GFM,Math,Diagrams editor;
    class IDB,Local storage;
    class PWA system;
\`\`\`

Found a bug or want a feature? Open an issue on [GitHub](https://github.com/Depends-iT/dependsit-markdown-studio/issues).
`;
