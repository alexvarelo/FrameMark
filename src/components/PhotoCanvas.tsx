import React, { useEffect, useRef } from 'react';
import type { PhotoMetadata } from '../lib/exif-utils';
import { formatExposureTime, formatFNumber, formatFocalLength, formatISO } from '../lib/exif-utils';

interface PhotoCanvasProps {
    image: HTMLImageElement;
    metadata: PhotoMetadata;
    onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

export const PhotoCanvas: React.FC<PhotoCanvasProps> = ({ image, metadata, onCanvasReady }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Calculate dimensions
        // We want a white border. Let's say 10% of the shortest side as padding.
        const padding = Math.min(image.width, image.height) * 0.1;
        const bottomPadding = padding * 2.5; // More space at the bottom for text

        canvas.width = image.width + padding * 2;
        canvas.height = image.height + padding + bottomPadding;

        // Fill white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image
        ctx.drawImage(image, padding, padding, image.width, image.height);

        // Draw metadata text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const centerX = canvas.width / 2;
        const baseY = image.height + padding;

        // Line 1: "Shot on" (Lighter Grey) + "MODEL MAKE" (Bold Black)
        const fontSizeTitle = Math.round(padding * 0.28); // Even smaller
        const textShotOn = 'Shot on ';
        const model = (metadata.model || 'Unknown Camera').toUpperCase();
        const make = (metadata.make || '').toUpperCase();
        const textModelMake = `${model} ${make}`.trim();

        // Measure widths for centering
        ctx.font = `400 ${fontSizeTitle}px Inter, sans-serif`;
        const widthShotOn = ctx.measureText(textShotOn).width;
        ctx.font = `700 ${fontSizeTitle}px Inter, sans-serif`;
        const widthModelMake = ctx.measureText(textModelMake).width;
        const totalWidth = widthShotOn + widthModelMake;

        let currentX = centerX - totalWidth / 2;
        const titleY = baseY + bottomPadding * 0.40; // Slightly lower but tighter relative to settings

        // Draw "Shot on"
        ctx.font = `400 ${fontSizeTitle}px Inter, sans-serif`;
        ctx.fillStyle = '#999999'; // Lighter grey
        ctx.textAlign = 'left';
        ctx.fillText(textShotOn, currentX, titleY);
        currentX += widthShotOn;

        // Draw "MODEL MAKE"
        ctx.font = `700 ${fontSizeTitle}px Inter, sans-serif`;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(textModelMake, currentX, titleY);

        // Line 2: Settings (Even smaller and lighter)
        const fontSizeSettings = Math.round(padding * 0.18); // Ultra small
        ctx.font = `400 ${fontSizeSettings}px Inter, sans-serif`;
        ctx.fillStyle = '#bbbbbb'; // Very light grey
        ctx.textAlign = 'center';

        const settingsArr = [
            formatFocalLength(metadata.focalLength),
            formatFNumber(metadata.fNumber),
            formatExposureTime(metadata.exposureTime),
            formatISO(metadata.iso)
        ].filter(Boolean);

        const settings = settingsArr.join('  ');

        ctx.fillText(settings, centerX, titleY + fontSizeTitle * 1.2); // Position relative to Line 1

        onCanvasReady(canvas);
    }, [image, metadata, onCanvasReady]);

    return (
        <div className="flex justify-center w-full overflow-hidden rounded-lg shadow-xl bg-gray-100 p-4">
            <canvas ref={canvasRef} className="max-w-full h-auto shadow-2xl" />
        </div>
    );
};
