export const defaultDocs = [
  {
    name: 'About.md',
    content: `# About DependsiT Markdown Studio

A free, open-source Markdown editor and document converter that runs entirely in your browser. No servers, no databases, no tracking.

## How It Works

When you drop a PDF or Word file into the editor, a local WebAssembly engine extracts the content and converts it to Markdown. Nothing leaves your device.

## Open Source

The full source code is available on GitHub under the MIT license:

[Depends-iT/dependsit-markdown-studio](https://github.com/Depends-iT/dependsit-markdown-studio)
`
  },
  {
    name: 'Privacy.md',
    content: `# Privacy Policy

## No Data Collection

DependsiT Markdown Studio does not collect, store, or transmit any personal data or document contents.

## Local Processing

All document conversions (PDF, DOCX, XLSX, etc.) and Markdown editing happen within your browser using WebAssembly and local JavaScript engines. No files are uploaded to a server.

## Local Storage

Your workspace and open tabs are saved to your browser's \`localStorage\` and \`IndexedDB\` to prevent data loss. This data stays on your device and can be deleted at any time by clicking the reset button (trash icon) in the toolbar.

## Analytics

No analytics, tracking scripts, or cookies are used.
`
  },
  {
    name: 'FAQ.md',
    content: `# FAQ

### Is Markdown Studio free?
Yes. It's free and open source under the MIT license.

### Does my data leave the browser?
No. All processing happens locally. Your files are never uploaded anywhere.

### Can I use it offline?
Yes. Install it as a Progressive Web App from your browser's address bar or menu.

### What file formats can I import?
- PDF (\`.pdf\`)
- Word (\`.docx\`)
- PowerPoint (\`.pptx\`)
- Excel (\`.xlsx\`, \`.csv\`)
- HTML (\`.html\`)
- Data files (\`.json\`, \`.xml\`, \`.epub\`, \`.rtf\`)

### How do I report a bug?
Open an issue on [GitHub](https://github.com/Depends-iT/dependsit-markdown-studio/issues).
`
  },
  {
    name: 'Documentation.md',
    content: `# Documentation

Welcome to the complete guide for DependsiT Markdown Studio. This covers every feature from writing your first word to exporting your final document.

---

## Getting Started

When you open Markdown Studio, you'll see a welcome document. You can start typing immediately, paste content, import a file, or create a new blank tab. Everything saves automatically — no account needed.

---

## The Interface

### Toolbar (top bar)

- **File menu** — New File, Import File, and Export options (Markdown, PDF, Word, HTML, Plain Text)
- **Import** (upload icon) — Opens the file picker
- **Export** (download icon) — Quick download as .md
- **Print** (printer icon) — Print with optimized layout
- **Toolbar Toggle** (panel icon) — Hide/show the formatting toolbar
- **Find** (search icon) — Open find & replace
- **Focus Mode** (maximize icon) — Distraction-free writing
- **Outline** (tree icon) — Document heading outline
- **Statistics** (chart icon) — Document statistics panel
- **Snippets** (bookmark icon) — Custom snippet manager
- **Command Palette** (command icon) — Search all actions
- **Shortcuts** (keyboard icon) — Keyboard shortcut reference
- **Theme** (moon/palette/sun) — Cycle Light → Sepia → Dark
- **Reset** (trash icon) — Delete all tabs, restore welcome

### Tab Bar

- **Click** to switch tabs
- **Double-click** to rename
- **Right-click** for Duplicate / Rename / Close / Close others / Close all
- **Drag** to reorder
- **+ button** to create a new tab
- Active tab shows a word count badge

### Editor

- **Left pane** — Type Markdown here
- **Right pane** — Live preview
- **Formatting toolbar** — Bold, italic, headings, lists, links, code, tables, and more
- Toggle between split, edit-only, and preview-only modes

### Status Bar

- Connection status (green = Ready)
- Word count, line count, reading time
- Save status (green check = Saved, amber dot = Unsaved)
- Spell check toggle
- Word count goal progress ring
- Links to About, Privacy, FAQ, Docs, GitHub

---

## Writing & Editing

### Basic Markdown

\`\`\`markdown
# Heading 1
## Heading 2

**Bold** and *italic* text.

- Bullet list
1. Numbered list

> Blockquote

[Link](https://example.com)
![Image](url.jpg)
\`\`\`

### Auto-Pairing

The editor automatically pairs \`()\`, \`[]\`, \`{}\`, \`**\`, and backticks. Selecting text and typing a pair character wraps the selection. Backspace between an empty pair deletes both characters.

### Spell Check

On by default. Toggle via the spell-check icon in the status bar. Right-click misspelled words for suggestions.

---

## Importing Files

All conversion happens locally — your files never leave your device.

### Supported Formats

| Format | Extensions | Method |
|---|---|---|
| Markdown | .md, .markdown | Direct read |
| Plain text | .txt | Direct read |
| PDF | .pdf | pdf.js |
| Word | .docx | mammoth.js |
| PowerPoint | .pptx | Pyodide + MarkItDown |
| Excel/CSV | .xlsx, .csv | Pyodide + MarkItDown |
| HTML | .html | Pyodide + MarkItDown |
| JSON/XML/EPUB/RTF | various | Pyodide + MarkItDown |

### How to Import

1. **File → Import File** — Pick a file from your device
2. **Upload icon** in the toolbar
3. **Drag and drop** a file onto the window

PowerPoint/Excel/etc. conversions use a Python WebAssembly engine — the first conversion takes ~30 seconds to initialize, subsequent ones are fast. Max file size: 50 MB.

---

## Working with Tabs

- **Create** — Click +, Ctrl+N, or File → New File
- **Switch** — Click a tab, or Alt+1 through Alt+9
- **Rename** — Double-click the tab name
- **Reorder** — Drag a tab left or right
- **Duplicate** — Right-click → Duplicate, or Ctrl+Shift+D
- **Close** — Click ×, right-click → Close, or Ctrl+W
- **Close others/all** — Right-click for these options

All tabs persist in your browser's IndexedDB and restore on your next visit.

---

## Command Palette

Press **Ctrl+K** to open a search bar for every action in the editor. Type to filter, arrow keys to navigate, Enter to execute.

Includes: all file operations, export formats, view toggles, and 17+ Markdown snippets (headings, bold, code blocks, tables, Mermaid, math, TOC, and more).

---

## Find & Replace

- **Ctrl+F** — Find
- **Ctrl+H** — Find and replace

### Options

- **Aa** — Case sensitive
- **W** — Whole word only
- **.\*** — Regular expression

Matches are highlighted in the preview pane. Use Enter/Shift+Enter to navigate between matches.

---

## Document Outline

Click the tree icon or press **Ctrl+Shift+L** to open a sidebar showing your document's headings. Click any heading to jump to it. The current heading is highlighted as you scroll.

You can also insert a clickable TOC into your document via the command palette — search "table of contents".

---

## Document Statistics

Press **Ctrl+Shift+S** or click the chart icon to see:

- Word, character, line, paragraph, and sentence counts
- Heading, list, link, image, and code block counts
- Reading time (200 wpm)
- Flesch reading ease score (color-coded)
- Grade level
- Longest paragraph word count

---

## Word Count Goal

Click "Set goal" in the status bar to set a writing target. Choose a preset (100–2000) or type a custom number. A progress ring fills as you write and turns green when you reach your goal.

---

## Mermaid Diagrams

Use fenced code blocks with the \`mermaid\` language identifier:

\`\`\`mermaid
graph TD
    A[Start] --> B{Ready?}
    B -- Yes --> C[Deploy]
    B -- No --> D[Fix]
\`\`\`

Hover over any rendered diagram to download it as **PNG** (2x resolution) or **SVG**. The PNG export works for any diagram — including ones you create yourself.

---

## Math Formulas (KaTeX)

**Inline:** \`$E = mc^2$\`

**Block:**

\`\`\`
$$
\\frac{n!}{k!(n-k)!} = \\binom{n}{k}
$$
\`\`\`

---

## Themes

Three themes: **Light** (warm paper), **Sepia** (low-contrast reading), **Dark** (night writing). Click the theme icon or press **Ctrl+J** to cycle. Your choice persists across sessions.

---

## Focus Mode

Press **Ctrl+Shift+Enter** to hide the toolbar, tabs, and status bar. The editor widens to a comfortable 820px column. Press Escape or Ctrl+Shift+Enter again to exit.

---

## Custom Snippets

Click the bookmark icon to open the snippet manager. Create reusable Markdown snippets — use \`|\` to mark where the caret lands after insertion. Snippets appear in the command palette under "My snippets".

---

## Printing

Press **Ctrl+P** to print. The print layout automatically hides the editor chrome and renders only the preview content in a clean, paginated format with proper page breaks.

---

## Exporting

| Format | Extension | Description |
|---|---|---|
| Markdown | .md | Raw Markdown source |
| PDF | .pdf | Rendered document via html2pdf.js |
| Word | .docx | Microsoft Word via html-docx-js |
| HTML | .html | Standalone HTML with KaTeX styles |
| Plain Text | .txt | Text extracted from preview |

All exports work from the rendered preview, so they include tables, math, diagrams, and formatting — even if the editor is in edit-only mode.

---

## Keyboard Shortcuts

Press **Ctrl+/** at any time to see the full reference.

| Shortcut | Action |
|---|---|
| Ctrl+S | Save now |
| Ctrl+N | New tab |
| Ctrl+W | Close tab |
| Ctrl+Shift+D | Duplicate tab |
| Ctrl+K | Command palette |
| Ctrl+P | Print |
| Ctrl+F | Find |
| Ctrl+H | Find and replace |
| Ctrl+Shift+L | Toggle outline |
| Ctrl+Shift+Enter | Focus mode |
| Ctrl+Shift+S | Statistics |
| Ctrl+J | Cycle theme |
| Alt+1–9 | Switch to tab N |
| Ctrl+/ | Shortcuts help |

---

## Privacy

- No servers, databases, analytics, or tracking
- All processing happens in your browser
- Tab content stored in IndexedDB, metadata in localStorage
- Click the Reset button (trash icon) to delete all data

---

## Source Code & Issues

- **GitHub:** [Depends-iT/dependsit-markdown-studio](https://github.com/Depends-iT/dependsit-markdown-studio)
- **Report a bug:** [GitHub Issues](https://github.com/Depends-iT/dependsit-markdown-studio/issues)
- **License:** MIT
`
  }
];
