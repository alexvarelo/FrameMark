import React, { useState, useRef } from 'react';
import { extractMetadata } from '../lib/exif-utils';
import type { PhotoMetadata } from '../lib/exif-utils';
import { PhotoCanvas } from './PhotoCanvas';
import type { AspectRatio, TextPosition } from './PhotoCanvas';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../lib/crop-utils';
import { Upload, Download, RefreshCcw, ExternalLink, Image as ImageIcon, Layout, ArrowUp, ArrowDown, Minimize, Maximize2, Camera, Type, Crop as CropIcon } from 'lucide-react';

export const PhotoMetadataApp: React.FC = () => {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [metadata, setMetadata] = useState<PhotoMetadata | null>(null);
    const [loading, setLoading] = useState(false);
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [downloading, setDownloading] = useState(false);

    // Customization State
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('original');
    const [textPosition, setTextPosition] = useState<TextPosition>('bottom');
    const [headerScale, setHeaderScale] = useState(1.0);
    const [paramsScale, setParamsScale] = useState(1.0);
    const [marginScale, setMarginScale] = useState(1.0);

    // Cropping State
    const [isCropping, setIsCropping] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

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
                setOriginalImageSrc(img.src);
                setLoading(false);
            };
            img.src = URL.createObjectURL(file);
        } catch (error) {
            console.error('Error processing image:', error);
            setLoading(false);
        }
    };

    const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const showCroppedImage = async () => {
        if (!originalImageSrc || !croppedAreaPixels) return;
        try {
            setLoading(true);
            const croppedImageBlob = await getCroppedImg(
                originalImageSrc,
                croppedAreaPixels
            );

            const img = new Image();
            img.onload = () => {
                setImage(img);
                setLoading(false);
                setIsCropping(false);
            };
            img.src = croppedImageBlob;
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!canvas) {
            alert('Canvas not ready. Please try again in a second.');
            return;
        }
        setDownloading(true);

        try {
            canvas.toBlob((blob) => {
                if (!blob || blob.size < 100) {
                    setDownloading(false);
                    alert('Generated image is empty. Please try "Open Image" instead.');
                    return;
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const date = new Date();
                const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
                const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');
                link.download = `framemark_${dateStr}_${timeStr}.jpg`;
                link.href = url;
                link.type = 'image/jpeg';
                link.style.display = 'none';
                document.body.appendChild(link);

                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                link.dispatchEvent(clickEvent);

                setTimeout(() => {
                    setDownloading(false);
                }, 2000);

                setTimeout(() => {
                    if (document.body.contains(link)) {
                        document.body.removeChild(link);
                    }
                    URL.revokeObjectURL(url);
                }, 60000);
            }, 'image/jpeg', 0.95);
        } catch (err) {
            console.error('Download error:', err);
            setDownloading(false);
            alert('Download failed.');
        }
    };

    const handleOpenOriginal = () => {
        if (!canvas) return;
        try {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            const win = window.open();
            if (win) {
                win.document.write(
                    `<img src="${dataUrl}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">` +
                    `<div style="text-align: center; padding: 20px; font-family: sans-serif;">` +
                    `<p>Right-click the image and select <strong>"Save Image As..."</strong></p>` +
                    `</div>`
                );
                win.document.title = "FrameMark - Save Image";
            } else {
                alert('Pop-up blocked. Please allow pop-ups for this site to open the image.');
            }
        } catch (err) {
            console.error('Error opening image:', err);
            alert('Failed to open image. It might be too large.');
        }
    };

    const reset = () => {
        setImage(null);
        setMetadata(null);
        setCanvas(null);
        setDownloading(false);
        setAspectRatio('original');
        setTextPosition('bottom');
        setHeaderScale(1.0);
        setParamsScale(1.0);
        setMarginScale(1.0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const formatShutterSpeed = (exposureTime?: number): string => {
        if (!exposureTime) return '-';
        if (exposureTime >= 1) return `${exposureTime}s`;
        return `1/${Math.round(1 / exposureTime)}s`;
    };

    // If no image, show the landing/upload view
    if (!image || !metadata) {
        return (
            <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-neutral-200 flex flex-col items-center justify-center p-6">
                <header className="mb-12 text-center">
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-500">
                        FrameMark
                    </h1>
                    <p className="text-neutral-500 text-lg max-w-lg mx-auto">
                        Professional framing for your photography. Minimalist metadata borders.
                    </p>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center gap-4 py-20 animate-in fade-in duration-700">
                        <RefreshCcw className="w-10 h-10 animate-spin text-neutral-400" />
                        <p className="text-neutral-500 font-medium italic">Developing your photo...</p>
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full max-w-2xl aspect-video border-2 border-dashed border-neutral-300 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-neutral-400 hover:bg-neutral-100 transition-all group relative overflow-hidden bg-white shadow-sm"
                    >
                        <div className="p-5 rounded-full bg-neutral-50 border border-neutral-100 shadow-sm group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-neutral-600" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-neutral-700 text-lg">Click to upload or drag and drop</p>
                            <p className="text-sm text-neutral-400 mt-1">JPG, PNG or HEIC with EXIF data</p>
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

                <footer className="mt-20 text-center text-neutral-400 text-sm">
                    <p>© 2025 FrameMark • Minimal Design</p>
                </footer>
            </div>
        );
    }

    // Studio Layout
    return (
        <div className="h-screen w-full bg-neutral-100 flex flex-col lg:flex-row overflow-hidden font-sans text-neutral-900">

            {/* Main Stage (Canvas) */}
            <div className="flex-1 bg-neutral-200/50 relative flex items-center justify-center overflow-hidden p-4 lg:p-8">
                <PhotoCanvas
                    image={image}
                    metadata={metadata}
                    onCanvasReady={setCanvas}
                    aspectRatio={aspectRatio}
                    textPosition={textPosition}
                    headerScale={headerScale}
                    paramsScale={paramsScale}
                    marginScale={marginScale}
                />
            </div>

            {/* Crop Overlay */}
            {isCropping && originalImageSrc && (
                <div className="absolute inset-0 z-50 bg-black flex flex-col">
                    <div className="relative flex-1">
                        <Cropper
                            image={originalImageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={undefined} // Free crop or maybe lock to aspectRatio? Let's leave free for now or match selected. 
                            // User wants to "crop the image". Usually means composition.
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>
                    <div className="p-6 bg-neutral-900 flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-2 w-1/3">
                            <span className="text-white text-xs font-bold uppercase tracking-widest">Zoom</span>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsCropping(false)}
                                className="px-6 py-3 rounded-xl font-medium text-white hover:bg-neutral-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={showCroppedImage}
                                className="px-6 py-3 rounded-xl font-bold bg-white text-black hover:bg-neutral-200 transition-colors"
                            >
                                Apply Crop
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Control Panel (Sidebar) */}
            <div className="w-full lg:w-[400px] bg-white/80 backdrop-blur-xl border-l border-white/20 shadow-2xl lg:shadow-none z-10 flex flex-col h-auto lg:h-full transition-all overflow-y-auto">
                <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-white/50">
                    <h2 className="text-xl font-bold tracking-tight">FrameMark</h2>
                    <button onClick={reset} className="text-xs font-semibold text-neutral-400 hover:text-neutral-900 uppercase tracking-widest flex items-center gap-1">
                        <RefreshCcw className="w-3 h-3" /> Start Over
                    </button>
                </div>

                <div className="flex-1 p-6 flex flex-col gap-8 overflow-y-auto">

                    {/* Image Tools */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-neutral-500">
                            <ImageIcon className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Image</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsCropping(true)}
                                className="flex-1 py-3 px-4 bg-white border border-neutral-200 text-neutral-700 rounded-xl font-medium text-sm hover:bg-neutral-50 hover:border-neutral-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <CropIcon className="w-4 h-4" /> Crop / Resize
                            </button>
                        </div>
                    </div>

                    {/* Spacing */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-neutral-500">
                            <Maximize2 className="w-4 h-4" /> {/* Reusing Maximize2 or Layout icon */}
                            <span className="text-xs font-bold uppercase tracking-widest">Spacing</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-center text-xs text-neutral-500 font-medium uppercase tracking-wider">
                                    <span>Margins</span>
                                    <span>{Math.round(marginScale * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.05"
                                    value={marginScale}
                                    onChange={(e) => setMarginScale(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Metadata Summary */}
                    <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
                        <div className="flex items-center gap-2 mb-3 text-neutral-400">
                            <Camera className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Metadata</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold block mb-1">Model</span>
                                <span className="text-sm font-semibold text-neutral-800 truncate block" title={metadata.model}>{metadata.model || 'Unknown'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold block mb-1">ISO</span>
                                <span className="text-sm font-semibold text-neutral-800 block">{metadata.iso || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold block mb-1">Aperture</span>
                                <span className="text-sm font-semibold text-neutral-800 block">{metadata.fNumber ? `f/${metadata.fNumber}` : '-'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold block mb-1">Shutter</span>
                                <span className="text-sm font-semibold text-neutral-800 block">{formatShutterSpeed(metadata.exposureTime)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Aspect Ratio */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-neutral-500">
                            <Maximize2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Format</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {(['original', '1:1', '4:5', '9:16'] as AspectRatio[]).map((ratio) => (
                                <button
                                    key={ratio}
                                    onClick={() => setAspectRatio(ratio)}
                                    className={`py-3 px-4 text-sm font-medium rounded-xl border transition-all text-left flex items-center justify-between group ${aspectRatio === ratio
                                        ? 'bg-neutral-900 border-neutral-900 text-white shadow-md'
                                        : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                                        }`}
                                >
                                    <span className="capitalize">{ratio === 'original' ? 'Original' : ratio}</span>
                                    {aspectRatio === ratio && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Typography */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-neutral-500">
                            <Type className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Typography</span>
                        </div>
                        <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
                            {/* Header Size */}
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-center text-xs text-neutral-500 font-medium uppercase tracking-wider">
                                    <span>Header Size</span>
                                    <span>{Math.round(headerScale * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="1.5"
                                    step="0.05"
                                    value={headerScale}
                                    onChange={(e) => setHeaderScale(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                                />
                            </div>

                            {/* Params Size */}
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-center text-xs text-neutral-500 font-medium uppercase tracking-wider">
                                    <span>Data Size</span>
                                    <span>{Math.round(paramsScale * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="1.5"
                                    step="0.05"
                                    value={paramsScale}
                                    onChange={(e) => setParamsScale(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Layout */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-neutral-500">
                            <Layout className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Layout</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex p-1 bg-neutral-100 rounded-xl">
                                <button
                                    onClick={() => setTextPosition('top')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${textPosition === 'top'
                                        ? 'bg-white text-neutral-900 shadow-sm'
                                        : 'text-neutral-500 hover:text-neutral-700'
                                        }`}
                                >
                                    <ArrowUp className="w-4 h-4" /> Top
                                </button>
                                <button
                                    onClick={() => setTextPosition('bottom')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${textPosition === 'bottom'
                                        ? 'bg-white text-neutral-900 shadow-sm'
                                        : 'text-neutral-500 hover:text-neutral-700'
                                        }`}
                                >
                                    <ArrowDown className="w-4 h-4" /> Bottom
                                </button>
                                <button
                                    onClick={() => setTextPosition('compact')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${textPosition === 'compact'
                                        ? 'bg-white text-neutral-900 shadow-sm'
                                        : 'text-neutral-500 hover:text-neutral-700'
                                        }`}
                                >
                                    <Minimize className="w-4 h-4" /> Compact
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-white border-t border-neutral-100 flex flex-col gap-3">
                    <button
                        onClick={handleDownload}
                        disabled={!canvas || downloading}
                        className="w-full py-4 bg-neutral-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-neutral-200"
                    >
                        {downloading ? (
                            <>
                                <RefreshCcw className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                Download Frame
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleOpenOriginal}
                        disabled={!canvas || downloading}
                        className="w-full py-3 text-neutral-500 font-medium text-sm flex items-center justify-center gap-2 hover:text-neutral-900 transition-colors"
                    >
                        Open in new tab <ExternalLink className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Hidden Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
};
