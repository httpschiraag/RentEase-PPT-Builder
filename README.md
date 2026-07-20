# RentEase PPT Builder

RentEase PPT Builder is an enterprise-grade, AI-powered PPT Builder tool engineered specifically for RentEase Limited. Designed to accelerate workflow and ensure strict brand consistency, this application allows users to generate comprehensive, industry-specific slide decks instantly based on a single topic prompt.

By leveraging Google's advanced Gemini 2.5 Flash model, the software acts as a specialized corporate communications assistant. It autonomously structures the narrative, populates deep-dive professional content, and formats the output into strict corporate branding guidelines.

## Key Capabilities

- **Intelligent Content Generation:** Utilizes the Gemini AI model to instantly draft professional, context-aware content tailored to the equipment rental and services industry.
- **Interactive Slide Editor:** Fully editable slides allowing users to modify text, swap images, and tweak layouts in real-time, providing an MS PowerPoint-like editing experience directly in the browser.
- **Automated Brand Formatting:** Enforces RentEase's corporate identity by automatically applying the official color palette, typography, logos, and structural guidelines to every generated slide.
- **Dynamic Slide Layouts:** Intelligently allocates content across diverse layout templates, including Title, Image & Text, Multi-Column, and Contact slides, ensuring optimal readability and visual hierarchy.
- **Native Dual Export Options:** 
  - **PowerPoint (.pptx):** Export generated slides directly into an native Microsoft PowerPoint file using PptxGenJS.
  - **PDF Document (.pdf):** Export presentations into high-resolution, fixed-layout PDF format using jsPDF, ideal for client distribution and cross-platform viewing.
- **Zero-Footprint Architecture:** Operates entirely within the user's web browser as a secure, serverless application. No backend databases or server installations are required.

## Technical Stack

- **Core:** HTML5, CSS3, JavaScript (ES6+)
- **Artificial Intelligence:** Google Gemini API 
- **Export Engines:** 
  - `pptxgenjs` for dynamic PowerPoint generation.
  - `jspdf` and `html2canvas` for high-fidelity PDF rendering.
- **Deployment:** GitHub Pages

## Deployment & Usage

Because the application is built on a serverless front-end architecture, it can be executed from any modern web browser without prior configuration.

1. To test the software live, navigate to the **Deployments** section on the right sidebar of this GitHub repository, click on the `github-pages` environment, and then click the website link to open the live site.
2. Enter the desired presentation topic, define the slide count, and click **Generate**.
3. Review and edit the generated slides in the interactive Edit Slides window.
4. Select your preferred format (PPTX or PDF) on the Export page and download the final asset directly to your local machine.

*Note: Due to standard browser CORS (Cross-Origin Resource Sharing) security policies regarding local file access, the PPTX and PDF export engines require the application to be hosted on a web server. Always utilize the live GitHub Pages link to ensure full export functionality.*
