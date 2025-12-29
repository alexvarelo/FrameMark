import React, { useState, useRef } from 'react';
import { extractMetadata } from '../lib/exif-utils';
import type { PhotoMetadata } from '../lib/exif-utils';
import { PhotoCanvas } from './PhotoCanvas';
import { Upload, Download, RefreshCcw } from 'lucide-react';

export const PhotoMetadataApp: React.FC = () => {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [metadata, setMetadata] = useState<PhotoMetadata | null>(null);
    const [loading, setLoading] = useState(false);
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [downloading, setDownloading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            // Extract Metadata
            const meta = await extractMetadata(file);
            setMetadata(meta);

            // Load Image
            const img = new Image();
            img.onload = () => {
                setImage(img);
                setLoading(false);
            };
            img.src = URL.createObjectURL(file);
        } catch (error) {
            console.error('Error processing image:', error);
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!canvas) return;
        setDownloading(true);

        try {
            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error('Failed to create blob from canvas');
                    setDownloading(false);
                    return;
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');

                // Ensure the filename is safe and has the correct extension
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                link.download = `photo-frame-${timestamp}.jpg`;
                link.href = url;

                // For some browsers, the link must be in the DOM to work
                document.body.appendChild(link);
                link.click();

                // Cleanup
                setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    setDownloading(false);
                }, 1000);
            }, 'image/jpeg', 0.95);
        } catch (err) {
            console.error('Download error:', err);
            setDownloading(false);
        }
    };

    const reset = () => {
        setImage(null);
        setMetadata(null);
        setCanvas(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const formatShutterSpeed = (exposureTime?: number): string => {
        if (!exposureTime) return '-';
        if (exposureTime >= 1) return `${exposureTime}s`;
        return `1/${Math.round(1 / exposureTime)}s`;
    };

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-neutral-200">
            <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-500">
                        FrameMark
                    </h1>
                    <p className="text-neutral-500 text-lg max-w-lg mx-auto">
                        Professional framing for your photography. Automatically extracts metadata and adds a clean minimalist border.
                    </p>
                </header>

                <main className="flex flex-col items-center gap-8">
                    {!image && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full max-w-2xl aspect-video border-2 border-dashed border-neutral-300 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-neutral-400 hover:bg-neutral-100 transition-all group relative overflow-hidden"
                        >
                            <div className="p-4 rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-neutral-600" />
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-neutral-700">Click to upload or drag and drop</p>
                                <p className="text-sm text-neutral-400">JPG, PNG or HEIC with EXIF data</p>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center gap-4 py-20">
                            <RefreshCcw className="w-10 h-10 animate-spin text-neutral-400" />
                            <p className="text-neutral-500 font-medium italic">Developing your photo...</p>
                        </div>
                    )}

                    {image && metadata && (
                        <div className="w-full flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="w-full max-w-3xl">
                                <PhotoCanvas
                                    image={image}
                                    metadata={metadata}
                                    onCanvasReady={setCanvas}
                                />
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                                <button
                                    onClick={handleDownload}
                                    disabled={!canvas || downloading}
                                    className="px-8 py-3 bg-neutral-900 text-white rounded-full font-semibold flex items-center gap-2 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-neutral-200 min-w-[220px] justify-center"
                                >
                                    {downloading ? (
                                        <>
                                            <RefreshCcw className="w-5 h-5 animate-spin" />
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5" />
                                            Download Framed Photo
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={reset}
                                    className="px-8 py-3 border border-neutral-200 bg-white text-neutral-600 rounded-full font-semibold flex items-center gap-2 hover:bg-neutral-50 transition-all active:scale-95"
                                >
                                    <RefreshCcw className="w-5 h-5" />
                                    Try Another
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-3xl mt-12 p-8 rounded-3xl bg-white border border-neutral-100 shadow-sm">
                                <div className="flex flex-col gap-1 text-center md:text-left">
                                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Camera</span>
                                    <span className="text-sm font-medium text-neutral-700 truncate">{metadata.model || 'Unknown'}</span>
                                </div>
                                <div className="flex flex-col gap-1 text-center md:text-left">
                                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Aperture</span>
                                    <span className="text-sm font-medium text-neutral-700">{metadata.fNumber ? `f/${metadata.fNumber}` : '-'}</span>
                                </div>
                                <div className="flex flex-col gap-1 text-center md:text-left">
                                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Shutter</span>
                                    <span className="text-sm font-medium text-neutral-700">{formatShutterSpeed(metadata.exposureTime)}</span>
                                </div>
                                <div className="flex flex-col gap-1 text-center md:text-left">
                                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">ISO</span>
                                    <span className="text-sm font-medium text-neutral-700">{metadata.iso || '-'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <footer className="mt-20 py-8 text-center text-neutral-400 text-sm border-t border-neutral-100">
                <p>© 2025 FrameMark • Minimal Design</p>
            </footer>
        </div>
    );
};
