<div align="center">
  <img src="public/favicon.png" width="160" height="160" alt="FrameMark Logo">
  
  # FrameMark
  
  **The extracted metadata camera frame tool.**
  
  *Elevate your photography with minimalist, metadata-rich borders.*

  [![Website](https://img.shields.io/website?url=https%3A%2F%2Fwww.framemark.space%2F&style=flat-square&label=framemark.space)](https://www.framemark.space/)
  [![GitHub license](https://img.shields.io/github/license/alexvarelo/FrameMark?style=flat-square)](https://github.com/alexvarelo/FrameMark/blob/main/LICENSE)
  [![Batch Processing](https://img.shields.io/badge/Privacy-First-green?style=flat-square)](#-features)
</div>

<br />

FrameMark is a professional, minimalist web application designed to give your photography a premium gallery look. It automatically extracts EXIF metadata (Camera Model, Aperture, Shutter Speed, ISO, etc.) and renders your photo framed on a clean background with a sophisticated typographic watermark—all processed locally in your browser.

## 🖼️ Examples

| Classic Style | Editorial Style |
| :---: | :---: |
| <img src="public/examples/example-snow.jpg" width="400" alt="Snow Forest Classic Example"> | <img src="public/examples/example5.jpg" width="400" alt="Olimpics Editorial Example"> |
| *Clean, centered branding and metadata.* | *Sophisticated split-metadata layout.* |

## ✨ Features

- **Automatic Metadata Extraction**: Powered by `exifr`, it pulls technical specs directly from your image.
- **Minimalist Design**: A clean, modern UI built with Tailwind CSS v4.
- **High-Resolution Support**: Robust download logic using `toBlob` ensures your images stay sharp.
- **Premium Typography**: Follows professional photography standards with bold branding and subtle technical specs.
- **Instant Previews**: See your framed masterpiece immediately after upload.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/alexvarelo/FrameMark.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🛠️ Built With

- **React** - Frontend framework
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **exifr** - EXIF metadata parsing
- **Lucide React** - Iconography

## 📄 License

MIT © 2025 FrameMark
