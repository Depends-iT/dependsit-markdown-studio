import StudioClient from "./StudioClient";

const APP_NAME = "DependsiT Markdown Studio";
const APP_DESCRIPTION =
  "A free, open-source Markdown editor and document converter that runs entirely in your browser. Import PDF, DOCX, PPTX, XLSX and more. Your files never leave your device.";

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: APP_NAME,
  description: APP_DESCRIPTION,
  applicationCategory: "TextEditor",
  operatingSystem: "Any (web browser)",
  browserRequirements: "Requires a modern web browser with JavaScript enabled.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  license: "https://opensource.org/licenses/MIT",
  isAccessibleForFree: true,
  isFamilyFriendly: true,
  url: "https://github.com/Depends-iT/dependsit-markdown-studio",
  downloadUrl: "https://github.com/Depends-iT/dependsit-markdown-studio/releases",
  installUrl: "https://github.com/Depends-iT/dependsit-markdown-studio",
  softwareVersion: "1.0.0",
  datePublished: "2025-01-01",
  author: {
    "@type": "Organization",
    name: "DependsiT",
    url: "https://github.com/Depends-iT",
  },
  publisher: {
    "@type": "Organization",
    name: "DependsiT",
    url: "https://github.com/Depends-iT",
    logo: {
      "@type": "ImageObject",
      url: "/pwa-192x192.png",
      width: 192,
      height: 192,
    },
  },
  featureList: [
    "Markdown editing with live split-pane preview",
    "Import PDF, DOCX, PPTX, XLSX, CSV, HTML, JSON, XML, EPUB, RTF",
    "Export to Markdown, PDF, Word, HTML, plain text",
    "GitHub Flavored Markdown (GFM) tables and task lists",
    "KaTeX math rendering (inline and block)",
    "Mermaid diagram rendering with PNG/SVG export",
    "Tabbed workspace with IndexedDB persistence",
    "Find and replace with regex and whole-word matching",
    "Command palette with 30+ actions",
    "Light, sepia, and dark themes",
    "Focus mode, document statistics, custom snippets",
    "Works offline (installable PWA)",
    "100% client-side — no servers, no tracking",
  ],
  screenshot: "/og-image.webp",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is DependsiT Markdown Studio free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. DependsiT Markdown Studio is 100% free and open-source under the MIT license. There are no ads, no accounts, no subscriptions, and no premium tiers.",
      },
    },
    {
      "@type": "Question",
      name: "Are my files uploaded to a server?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. All file processing happens locally in your browser. Files you import or edit never leave your device. The editor uses WebAssembly (Pyodide) and client-side libraries (pdfjs, mammoth) to convert documents without any server round-trips.",
      },
    },
    {
      "@type": "Question",
      name: "What file formats can I import?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can import Markdown (.md, .markdown), plain text (.txt), PDF (.pdf), Word (.docx), PowerPoint (.pptx), Excel (.xlsx), CSV (.csv), HTML (.html), JSON (.json), XML (.xml), EPUB (.epub), and RTF (.rtf) files. All are converted to Markdown for editing.",
      },
    },
    {
      "@type": "Question",
      name: "What file formats can I export to?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can export your work as Markdown (.md), PDF (.pdf via the browser's print dialog), Word (.docx), HTML (.html), or plain text (.txt).",
      },
    },
    {
      "@type": "Question",
      name: "Does it work offline?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. DependsiT Markdown Studio is a Progressive Web App (PWA). Once you install it (via your browser's install prompt or the 'Install' button in the toolbar), it works fully offline. Your documents are stored locally in IndexedDB.",
      },
    },
    {
      "@type": "Question",
      name: "Does it support Mermaid diagrams and KaTeX math?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Mermaid diagrams (flowcharts, sequence diagrams, Gantt charts, etc.) render inline with PNG and SVG export options. KaTeX renders both inline ($...$) and block ($$...$$) math equations with fast, server-free rendering.",
      },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: APP_NAME,
      item: "/",
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <h1 className="sr-only">
        {APP_NAME} — Private Markdown Editor &amp; Document Converter
      </h1>
      <div className="sr-only">
        <p>
          A free, open-source Markdown editor and document converter that runs
          entirely in your browser. Import PDF, Word, PowerPoint, Excel, CSV,
          HTML, JSON, EPUB, or XML files and convert them to Markdown. Features
          GFM tables, KaTeX math, Mermaid diagrams, tabbed workspace with
          IndexedDB persistence, and export to PDF, DOCX, HTML, plain text, or
          raw Markdown. Your files never leave your device.
        </p>
        <p>
          Key features include a split-pane editor with live preview, drag and
          drop file import, command palette, find and replace with regex,
          document statistics with readability scoring, custom snippets, focus
          mode, word count goals, and three themes (light, sepia, dark). All
          processing happens locally — no servers, no tracking, no analytics.
        </p>
        <p>
          Supported import formats: Markdown (.md, .markdown), plain text
          (.txt), PDF (.pdf), Word (.docx), PowerPoint (.pptx), Excel (.xlsx),
          CSV (.csv), HTML (.html, .htm), JSON (.json), XML (.xml), EPUB
          (.epub), and RTF (.rtf). Supported export formats: Markdown, PDF,
          Word (.docx), HTML, and plain text (.txt).
        </p>
        <p>
          The editor is a Progressive Web App (PWA) and works offline once
          installed. It is licensed under the MIT license and the source code
          is available on GitHub at
          github.com/Depends-iT/dependsit-markdown-studio.
        </p>
        <noscript>
          {APP_NAME} requires JavaScript to run. Please enable JavaScript in
          your browser to start editing Markdown documents.
        </noscript>
      </div>
      <StudioClient />
    </>
  );
}
