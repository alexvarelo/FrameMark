import React, { useEffect, useRef } from 'react';
import type { PhotoMetadata } from '../lib/exif-utils';
import { formatExposureTime, formatFNumber, formatFocalLength, formatISO } from '../lib/exif-utils';

export type AspectRatio = 'original' | '1:1' | '4:5' | '9:16';
export type TextPosition = 'bottom' | 'top' | 'compact';

interface PhotoCanvasProps {
    image: HTMLImageElement;
    metadata: PhotoMetadata;
    onCanvasReady: (canvas: HTMLCanvasElement) => void;
    aspectRatio: AspectRatio;
    textPosition: TextPosition;
    headerScale?: number;
    paramsScale?: number;
}

export const PhotoCanvas: React.FC<PhotoCanvasProps> = ({
    image,
    metadata,
    onCanvasReady,
    aspectRatio,
    textPosition,
    headerScale = 1,
    paramsScale = 1
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Base padding calculation (relative to image size)
        const basePadding = Math.min(image.width, image.height) * 0.1;

        let canvasWidth = 0;
        let canvasHeight = 0;
        let imageX = 0;
        let imageY = 0;
        let textY = 0;

        // 1. Calculate Canvas Dimensions AND Content Position

        // "Required Content Area" = Image + Padding + Text Space
        const extraVerticalSpace = textPosition === 'compact' ? basePadding * 1.5 : basePadding * 2.5;
        const contentWidth = image.width + basePadding * 2;
        const contentHeight = image.height + basePadding + extraVerticalSpace;

        if (aspectRatio === 'original') {
            canvasWidth = contentWidth;
            canvasHeight = contentHeight;

            if (textPosition === 'top') {
                imageX = basePadding;
                imageY = extraVerticalSpace;
                textY = extraVerticalSpace * 0.44;
            } else {
                imageX = basePadding;
                imageY = basePadding;
                textY = imageY + image.height + extraVerticalSpace * 0.44;
            }
        } else {
            // Fixed Aspect Ratios
            const targetRatio = aspectRatio === '1:1' ? 1
                : aspectRatio === '4:5' ? 4 / 5
                    : 9 / 16;

            let finalW = contentWidth;
            let finalH = contentHeight;

            const currentRatio = finalW / finalH;

            if (currentRatio > targetRatio) {
                // Content is WIDER than target -> Increase Height
                finalH = finalW / targetRatio;
            } else {
                // Content is TALLER than target -> Increase Width
                finalW = finalH * targetRatio;
            }

            canvasWidth = finalW;
            canvasHeight = finalH;

            // Center Content
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;

            if (textPosition === 'top') {
                const contentStartY = centerY - contentHeight / 2;
                imageY = contentStartY + extraVerticalSpace;
                imageX = centerX - image.width / 2;
                textY = contentStartY + extraVerticalSpace * 0.44;

            } else {
                const contentStartY = centerY - contentHeight / 2;
                imageY = contentStartY + basePadding;
                imageX = centerX - image.width / 2;
                textY = imageY + image.height + extraVerticalSpace * 0.44;
            }
        }

        // Fill background
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw Image
        ctx.drawImage(image, imageX, imageY, image.width, image.height);

        // Draw Metadata - HEADER (Shot on...)
        const fontSizeTitle = Math.round(basePadding * 0.22 * headerScale);

        const textShotOn = "Shot on ";
        const model = (metadata.model || "Unknown").toUpperCase();
        const make = (metadata.make || "").toUpperCase();
        const textModel = `${model} `;
        const textMake = make;

        // Measure
        ctx.font = `400 ${fontSizeTitle}px Inter, sans-serif`;
        const widthShotOn = ctx.measureText(textShotOn).width;
        ctx.font = `700 ${fontSizeTitle}px Inter, sans-serif`;
        const widthModel = ctx.measureText(textModel).width;
        ctx.font = `400 ${fontSizeTitle}px Inter, sans-serif`;
        const widthMake = ctx.measureText(textMake).width;
        const totalWidth = widthShotOn + widthModel + widthMake;

        const centerX = canvasWidth / 2;
        let currentX = centerX - totalWidth / 2;

        // Draw Line 1
        ctx.textBaseline = 'middle';
        ctx.font = `400 ${fontSizeTitle}px Inter, sans-serif`;
        ctx.fillStyle = '#999999';
        ctx.textAlign = 'left';
        ctx.fillText(textShotOn, currentX, textY);
        currentX += widthShotOn;

        ctx.font = `700 ${fontSizeTitle}px Inter, sans-serif`;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(textModel, currentX, textY);
        currentX += widthModel;

        ctx.font = `400 ${fontSizeTitle}px Inter, sans-serif`;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(textMake, currentX, textY);

        // Draw Line 2 (Settings) - PARAMS
        const fontSizeSettings = Math.round(basePadding * 0.14 * paramsScale);
        ctx.font = `400 ${fontSizeSettings}px Inter, sans-serif`;
        ctx.fillStyle = '#bbbbbb';
        ctx.textAlign = 'center';

        const settingsArr = [
            formatFocalLength(metadata.focalLength),
            formatFNumber(metadata.fNumber),
            formatExposureTime(metadata.exposureTime),
            formatISO(metadata.iso)
        ].filter(Boolean);
        const settings = settingsArr.join('  ');

        // Line 2 Y position (adjust based on header size)
        const spacing = fontSizeTitle * 1.05;
        const textY2 = textY + spacing;
        ctx.fillText(settings, centerX, textY2);

        onCanvasReady(canvas);

    }, [image, metadata, onCanvasReady, aspectRatio, textPosition, headerScale, paramsScale]);

    return (
        <div className="flex items-center justify-center w-full h-full min-h-0 min-w-0">
            <canvas
                ref={canvasRef}
                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                style={{ width: 'auto', height: 'auto' }}
            />
        </div>
    );
};
