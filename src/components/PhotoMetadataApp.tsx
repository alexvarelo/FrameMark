import React, { useState, useRef } from 'react';
import { extractMetadata } from '../lib/exif-utils';
import type { PhotoMetadata } from '../lib/exif-utils';
import { PhotoCanvas } from './PhotoCanvas';
import type { AspectRatio, TextPosition } from './PhotoCanvas';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../lib/crop-utils';
import FlipGallery from './ui/flip-gallery';
import { Upload, Download, RefreshCcw, ExternalLink, Image as ImageIcon, Layout, ArrowUp, ArrowDown, Minimize, Maximize2, Camera, Type, Crop as CropIcon, Trash2, CheckCircle2, Info, X } from 'lucide-react';

interface PhotoData {
    id: string;
    image: HTMLImageElement;
    metadata: PhotoMetadata;
    originalImageSrc: string;
    settings: {
        aspectRatio: AspectRatio;
        textPosition: TextPosition;
        headerScale: number;
        paramsScale: number;
        marginScale: number;
    };
}

export const PhotoMetadataApp: React.FC = () => {
    const [photos, setPhotos] = useState<PhotoData[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [downloading, setDownloading] = useState(false);

    // Get current photo data
    const currentPhoto = photos[selectedIndex];

    // Cropping State
    const [isCropping, setIsCropping] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const updateCurrentSettings = (updates: Partial<PhotoData['settings']>) => {
        if (!currentPhoto) return;
        setPhotos(prev => prev.map((p, i) =>
            i === selectedIndex ? { ...p, settings: { ...p.settings, ...updates } } : p
        ));
    };

    const applyToAll = () => {
        if (!currentPhoto) return;
        const settings = currentPhoto.settings;
        setPhotos(prev => prev.map(p => ({ ...p, settings: { ...settings } })));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        processFiles(files);
    };

    const processFiles = async (files: File[]) => {
        setLoading(true);
        const newPhotos: PhotoData[] = [];

        for (const file of files) {
            try {
                const meta = await extractMetadata(file);
                const img = await new Promise<HTMLImageElement>((resolve) => {
                    const i = new Image();
                    i.onload = () => resolve(i);
                    i.src = URL.createObjectURL(file);
                });

                newPhotos.push({
                    id: Math.random().toString(36).substr(2, 9),
                    image: img,
                    metadata: meta,
                    originalImageSrc: img.src,
                    settings: {
                        aspectRatio: 'original',
                        textPosition: 'bottom',
                        headerScale: 1.0,
                        paramsScale: 1.0,
                        marginScale: 1.0,
                    }
                });
            } catch (error) {
                console.error('Error processing file:', file.name, error);
            }
        }

        setPhotos(prev => [...prev, ...newPhotos]);
        setLoading(false);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const files = Array.from(e.dataTransfer.files || []);
        if (files.length > 0) {
            processFiles(files);
        }
    };

    const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const showCroppedImage = async () => {
        if (!currentPhoto || !croppedAreaPixels) return;
        try {
            setLoading(true);
            const croppedImageBlob = await getCroppedImg(
                currentPhoto.originalImageSrc,
                croppedAreaPixels
            );

            const img = new Image();
            img.onload = () => {
                setPhotos(prev => prev.map((p, i) =>
                    i === selectedIndex ? { ...p, image: img } : p
                ));
                setLoading(false);
                setIsCropping(false);
            };
            img.src = croppedImageBlob;
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    const downloadPhoto = async (photo: PhotoData, canvasElement: HTMLCanvasElement): Promise<void> => {
        return new Promise((resolve, reject) => {
            canvasElement.toBlob((blob) => {
                if (!blob || blob.size < 100) {
                    reject(new Error('Empty blob'));
                    return;
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const date = new Date();
                const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
                const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');
                link.download = `framemark_${photo.metadata.model || 'photo'}_${dateStr}_${timeStr}.jpg`;
                link.href = url;
                link.type = 'image/jpeg';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    if (document.body.contains(link)) document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    resolve();
                }, 100);
            }, 'image/jpeg', 0.95);
        });
    };

    const handleDownload = async () => {
        if (!canvas) {
            alert('Canvas not ready. Please try again in a second.');
            return;
        }
        setDownloading(true);
        try {
            await downloadPhoto(currentPhoto, canvas);
        } catch (err) {
            console.error('Download error:', err);
            alert('Download failed.');
        } finally {
            setDownloading(false);
        }
    };

    const handleDownloadAll = async () => {
        if (photos.length === 0) return;
        setDownloading(true);

        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            // Update selected index to trigger re-render on the main canvas 
            // OR use a dedicated rendering function. 
            // For simplicity and speed, let's just trigger sequential downloads if possible,
            // but the main canvas is reactive to selectedIndex.
            setSelectedIndex(i);
            // Wait for canvas to update (next tick)
            await new Promise(resolve => setTimeout(resolve, 300));
            if (canvas) {
                await downloadPhoto(photo, canvas);
            }
        }

        setDownloading(false);
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
        setPhotos([]);
        setSelectedIndex(0);
        setCanvas(null);
        setDownloading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => {
            const next = prev.filter((_, i) => i !== index);
            if (selectedIndex >= next.length && next.length > 0) {
                setSelectedIndex(next.length - 1);
            }
            return next;
        });
    };

    const formatShutterSpeed = (exposureTime?: number): string => {
        if (!exposureTime) return '-';
        if (exposureTime >= 1) return `${exposureTime}s`;
        return `1/${Math.round(1 / exposureTime)}s`;
    };

    // If no images, show the landing/upload view
    if (photos.length === 0) {
        return (
            <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-neutral-200 flex flex-col items-center p-6">
                <div className="flex-1 w-full flex flex-col items-center justify-center">
                    <header className="mb-6 text-center space-y-3 pt-16">
                        <div className="flex flex-col items-center justify-center">
                            <img src="/favicon.png" alt="FrameMark" className="w-32 h-32 md:w-56 md:h-56 drop-shadow-sm" />
                            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-neutral-900 via-neutral-700 to-neutral-500 -mt-2 md:-mt-6 px-4">
                                Framemark
                            </h1>
                        </div>
                        <div className="space-y-2 max-w-xl mx-auto">
                            <p className="text-lg font-medium text-neutral-800">
                                The extracted metadata camera frame tool.
                            </p>
                            <p className="text-sm text-neutral-500 leading-relaxed">
                                Elevate your photography with minimalist, metadata-rich borders.
                            </p>
                        </div>
                    </header>

                    {loading ? (
                        <div className="flex flex-col items-center gap-4 py-20 animate-in fade-in duration-700">
                            <RefreshCcw className="w-10 h-10 animate-spin text-neutral-400" />
                            <p className="text-neutral-500 font-medium italic">Developing your photo...</p>
                        </div>
                    ) : (
                        <div className="w-full max-w-6xl mx-auto">
                            {/* Desktop: side-by-side, Mobile: stacked */}
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-12">
                                {/* Upload Area */}
                                <div className="flex-1">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        className={`w-full max-w-xl mx-auto md:mx-0 aspect-[21/9] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group relative overflow-hidden ${dragActive
                                            ? "border-neutral-900 bg-neutral-100 shadow-2xl scale-[1.02]"
                                            : "border-neutral-200 bg-neutral-50/50 hover:border-neutral-400 hover:bg-white hover:shadow-xl"
                                            }`}
                                    >
                                        <div className="p-4 rounded-full bg-white border border-neutral-100 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                            <Upload className="w-8 h-8 text-neutral-800" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="font-bold text-neutral-800 text-lg">Drop your photo/s here</p>
                                            <p className="text-sm text-neutral-400">Supports JPG, PNG, HEIC with EXIF</p>
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                        />
                                    </div>
                                </div>

                                {/* FlipGallery with label */}
                                <div className="flex-shrink-0">
                                    <p className="text-center text-xs font-light uppercase tracking-widest text-neutral-400 mb-4">
                                        Inspiration
                                    </p>
                                    <FlipGallery />
                                </div>
                            </div>

                            {/* SEO / Content Sections */}
                            <div className="mt-24 space-y-32">
                                {/* Features Section */}
                                <section className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-24">
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center overflow-hidden">
                                            <img src="/assets/privacy-cat.png" alt="Privacy First" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-neutral-900 via-neutral-700 to-neutral-500">
                                                Privacy First
                                            </h3>
                                            <p className="text-neutral-500 text-base md:text-lg leading-relaxed max-w-sm mx-auto">
                                                Your photos never leave your device. All processing happens locally in your browser.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center overflow-hidden">
                                            <img src="/assets/batch-cat.png" alt="Batch Processing" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-neutral-900 via-neutral-700 to-neutral-500">
                                                Batch Power
                                            </h3>
                                            <p className="text-neutral-500 text-base md:text-lg leading-relaxed max-w-sm mx-auto">
                                                Upload multiple photos, apply uniform settings, and download everything in one go.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center overflow-hidden">
                                            <img src="/assets/metadata-cat.png" alt="Pro Metadata" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-neutral-900 via-neutral-700 to-neutral-500">
                                                Pro Metadata
                                            </h3>
                                            <p className="text-neutral-500 text-base md:text-lg leading-relaxed max-w-sm mx-auto">
                                                Extract ISO, Aperture, and Shutter Speed to give your photography a pro edge.
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* FAQ Section */}
                                <section className="max-w-3xl mx-auto space-y-12 pb-32 pt-16">
                                    <div className="text-center space-y-4">
                                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-neutral-900 via-neutral-700 to-neutral-500">
                                            Frequently Asked Questions
                                        </h2>
                                        <p className="text-neutral-500 text-lg">Everything you need to know about FrameMark.</p>
                                    </div>
                                    <div className="space-y-10">
                                        <div className="space-y-3">
                                            <h4 className="text-xl md:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-neutral-900 via-neutral-700 to-neutral-500 flex items-center gap-3">
                                                <Info className="w-5 h-5 text-neutral-400 shrink-0" />
                                                Does it support RAW or HEIC?
                                            </h4>
                                            <p className="text-neutral-500 text-sm md:text-base leading-relaxed pl-8">
                                                FrameMark supports JPG, PNG, and HEIC. For RAW files, we recommend converting to a high-quality JPG first for the best browser performance.
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="text-xl md:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-neutral-900 via-neutral-700 to-neutral-500 flex items-center gap-3">
                                                <Info className="w-5 h-5 text-neutral-400 shrink-0" />
                                                Is it free?
                                            </h4>
                                            <p className="text-neutral-500 text-sm md:text-base leading-relaxed pl-8">
                                                Absolutely. FrameMark is a free community tool built for photographers who appreciate minimalist design and metadata precision.
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="text-xl md:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-neutral-900 via-neutral-700 to-neutral-500 flex items-center gap-3">
                                                <Info className="w-5 h-5 text-neutral-400 shrink-0" />
                                                Where are my photos stored?
                                            </h4>
                                            <p className="text-neutral-500 text-sm md:text-base leading-relaxed pl-8">
                                                Nowhere. All processing happens locally in your browser. Once you close the tab, your images are cleared from temporary memory.
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}
                </div>
                <footer className="mt-24 py-12 text-center text-neutral-400 text-[10px] md:text-xs space-y-6 w-full border-t border-neutral-100">
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 font-medium uppercase tracking-widest text-neutral-300">
                        <span className="hover:text-neutral-500 transition-colors cursor-default">Photo Framing Tool</span>
                        <span className="hover:text-neutral-500 transition-colors cursor-default">EXIF Data</span>
                        <span className="hover:text-neutral-500 transition-colors cursor-default">Photography</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2">
                            <Camera className="w-3 h-3" />
                            <span>Built by</span>
                            <a
                                href="https://alexvareloraw.site/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-neutral-600 hover:text-neutral-900 transition-colors underline underline-offset-4 decoration-neutral-200 hover:decoration-neutral-400"
                            >
                                alexvarelo
                            </a>
                        </div>
                        <p className="tracking-wide">© 2026 FrameMark • Minimal Design & Ethics</p>
                    </div>
                </footer>
            </div>
        );
    }

    // Studio Layout
    return (
        <div className="min-h-screen lg:h-screen w-full bg-neutral-100 flex flex-col lg:flex-row font-sans text-neutral-900 lg:overflow-hidden overflow-auto">

            {/* Main Stage (Canvas) */}
            <div className="flex-1 bg-neutral-200/50 relative flex flex-col items-center justify-center overflow-hidden p-4 lg:p-8 min-h-[60vh] lg:min-h-0">
                {/* Thumbnail Strip */}
                <div className="absolute top-4 left-4 right-4 z-20 flex justify-center">
                    <div className="flex gap-2 p-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg overflow-x-auto max-w-full">
                        {photos.map((p, i) => (
                            <div key={p.id} className="relative group">
                                <button
                                    onClick={() => setSelectedIndex(i)}
                                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${selectedIndex === i ? 'border-neutral-900 scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <img src={p.originalImageSrc} className="w-full h-full object-cover" alt={`Photo ${i + 1}`} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                                    className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-red-500"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-12 h-12 rounded-lg border-2 border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:border-neutral-400 transition-all"
                        >
                            <Upload className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <PhotoCanvas
                    image={currentPhoto.image}
                    metadata={currentPhoto.metadata}
                    onCanvasReady={setCanvas}
                    aspectRatio={currentPhoto.settings.aspectRatio}
                    textPosition={currentPhoto.settings.textPosition}
                    headerScale={currentPhoto.settings.headerScale}
                    paramsScale={currentPhoto.settings.paramsScale}
                    marginScale={currentPhoto.settings.marginScale}
                />
            </div>

            {/* Crop Overlay */}
            {isCropping && currentPhoto.originalImageSrc && (
                <div className="absolute inset-0 z-50 bg-black flex flex-col">
                    <div className="relative flex-1">
                        <Cropper
                            image={currentPhoto.originalImageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={undefined}
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
                                    <span>{Math.round(currentPhoto.settings.marginScale * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.05"
                                    value={currentPhoto.settings.marginScale}
                                    onChange={(e) => updateCurrentSettings({ marginScale: parseFloat(e.target.value) })}
                                    className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Batch Tool */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-neutral-500">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Batch</span>
                        </div>
                        <button
                            onClick={applyToAll}
                            className="w-full py-3 px-4 bg-white border border-neutral-200 text-neutral-700 rounded-xl font-medium text-sm hover:bg-neutral-50 hover:border-neutral-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            Apply settings to all {photos.length > 1 ? `(${photos.length})` : ''}
                        </button>
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
                                <span className="text-sm font-semibold text-neutral-800 truncate block" title={currentPhoto.metadata.model}>{currentPhoto.metadata.model || 'Unknown'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold block mb-1">ISO</span>
                                <span className="text-sm font-semibold text-neutral-800 block">{currentPhoto.metadata.iso || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold block mb-1">Aperture</span>
                                <span className="text-sm font-semibold text-neutral-800 block">{currentPhoto.metadata.fNumber ? `f/${currentPhoto.metadata.fNumber}` : '-'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold block mb-1">Shutter</span>
                                <span className="text-sm font-semibold text-neutral-800 block">{formatShutterSpeed(currentPhoto.metadata.exposureTime)}</span>
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
                                    onClick={() => updateCurrentSettings({ aspectRatio: ratio })}
                                    className={`py-3 px-4 text-sm font-medium rounded-xl border transition-all text-left flex items-center justify-between group ${currentPhoto.settings.aspectRatio === ratio
                                        ? 'bg-neutral-900 border-neutral-900 text-white shadow-md'
                                        : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                                        }`}
                                >
                                    <span className="capitalize">{ratio === 'original' ? 'Original' : ratio}</span>
                                    {currentPhoto.settings.aspectRatio === ratio && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
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
                                    <span>{Math.round(currentPhoto.settings.headerScale * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="1.5"
                                    step="0.05"
                                    value={currentPhoto.settings.headerScale}
                                    onChange={(e) => updateCurrentSettings({ headerScale: parseFloat(e.target.value) })}
                                    className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                                />
                            </div>

                            {/* Params Size */}
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-center text-xs text-neutral-500 font-medium uppercase tracking-wider">
                                    <span>Data Size</span>
                                    <span>{Math.round(currentPhoto.settings.paramsScale * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="1.5"
                                    step="0.05"
                                    value={currentPhoto.settings.paramsScale}
                                    onChange={(e) => updateCurrentSettings({ paramsScale: parseFloat(e.target.value) })}
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
                                    onClick={() => updateCurrentSettings({ textPosition: 'top' })}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${currentPhoto.settings.textPosition === 'top'
                                        ? 'bg-white text-neutral-900 shadow-sm'
                                        : 'text-neutral-500 hover:text-neutral-700'
                                        }`}
                                >
                                    <ArrowUp className="w-4 h-4" /> Top
                                </button>
                                <button
                                    onClick={() => updateCurrentSettings({ textPosition: 'bottom' })}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${currentPhoto.settings.textPosition === 'bottom'
                                        ? 'bg-white text-neutral-900 shadow-sm'
                                        : 'text-neutral-500 hover:text-neutral-700'
                                        }`}
                                >
                                    <ArrowDown className="w-4 h-4" /> Bottom
                                </button>
                                <button
                                    onClick={() => updateCurrentSettings({ textPosition: 'compact' })}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${currentPhoto.settings.textPosition === 'compact'
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
                                Download {photos.length > 1 ? `Selection (${photos.length})` : 'Frame'}
                            </>
                        )}
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        {photos.length > 1 && (
                            <button
                                onClick={handleDownloadAll}
                                disabled={!canvas || downloading}
                                className="py-3 bg-neutral-100 text-neutral-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                            >
                                <Download className="w-4 h-4" />
                                All
                            </button>
                        )}
                        <a
                            href={`https://twitter.com/intent/tweet?text=Check%20out%20my%20photography%20with%20minimalist%20metadata%20frames%20on%20FrameMark!%20%23photography%20%23framemark%20https://framemark.space`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-3 bg-neutral-100 text-neutral-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all text-sm"
                        >
                            <X className="w-4 h-4" />
                            Share
                        </a>
                    </div>

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
                multiple
                className="hidden"
            />
        </div>
    );
};
