import React, { useEffect, useRef } from 'react';
import type { PhotoMetadata } from '../lib/exif-utils';
import { formatExposureTime, formatFNumber, formatFocalLength, formatISO } from '../lib/exif-utils';
import { getBrandLogo } from '../lib/brand-logos';

export type AspectRatio = 'original' | '1:1' | '4:5' | '9:16';
export type TextPosition = 'bottom' | 'top' | 'compact';
export type FrameStyle = 'classic' | 'editorial';
export type PhotoTheme = 'light' | 'dark';

interface PhotoCanvasProps {
    image: HTMLImageElement;
    metadata: PhotoMetadata;
    onCanvasReady: (canvas: HTMLCanvasElement) => void;
    aspectRatio: AspectRatio;
    textPosition: TextPosition;
    frameStyle?: FrameStyle;
    theme?: PhotoTheme;
    showLogo?: boolean;
    headerScale?: number;
    paramsScale?: number;
    marginScale?: number;
}

export const PhotoCanvas: React.FC<PhotoCanvasProps> = ({
    image,
    metadata,
    onCanvasReady,
    aspectRatio,
    textPosition,
    frameStyle = 'classic',
    theme = 'light',
    showLogo = true,
    headerScale = 1,
    paramsScale = 1,
    marginScale = 1
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const draw = async () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Theme colors
            const bgColor = theme === 'light' ? 'white' : '#111111';
            const primaryTextColor = theme === 'light' ? '#1a1a1a' : '#eeeeee';
            const secondaryTextColor = theme === 'light' ? '#999999' : '#666666';
            const separatorColor = theme === 'light' ? '#eeeeee' : '#333333';
            const paramsTextColor = theme === 'light' ? '#bbbbbb' : '#444444';

            // Font Base Unit (independent of margin, relative to image)
            const fontBasePadding = Math.min(image.width, image.height) * 0.1;

            // Layout Padding (affected by margin scale)
            const basePadding = fontBasePadding * marginScale;

            let canvasWidth = 0;
            let canvasHeight = 0;
            let imageX = 0;
            let imageY = 0;
            let textY = 0;

            const extraVerticalSpace = textPosition === 'compact' ? fontBasePadding * 1.5 : fontBasePadding * 2.5;
            const contentWidth = image.width + basePadding * 2;
            const contentHeight = image.height + basePadding + extraVerticalSpace;

            const textGapFactor = 0.25;

            // 1. Calculate Canvas Dimensions
            if (aspectRatio === 'original') {
                canvasWidth = contentWidth;
                canvasHeight = contentHeight;

                if (textPosition === 'top') {
                    imageX = basePadding;
                    imageY = extraVerticalSpace;
                    textY = extraVerticalSpace * (1 - textGapFactor);
                } else {
                    imageX = basePadding;
                    imageY = basePadding;
                    textY = imageY + image.height + extraVerticalSpace * textGapFactor;
                }
            } else {
                const targetRatio = aspectRatio === '1:1' ? 1
                    : aspectRatio === '4:5' ? 4 / 5
                        : 9 / 16;

                let finalW = contentWidth;
                let finalH = contentHeight;

                const currentRatio = finalW / finalH;

                if (currentRatio > targetRatio) {
                    finalH = finalW / targetRatio;
                } else {
                    finalW = finalH * targetRatio;
                }

                canvasWidth = finalW;
                canvasHeight = finalH;

                const centerX = canvasWidth / 2;
                const centerY = canvasHeight / 2;

                if (textPosition === 'top') {
                    const contentStartY = centerY - contentHeight / 2;
                    imageY = contentStartY + extraVerticalSpace;
                    imageX = centerX - image.width / 2;
                    textY = contentStartY + extraVerticalSpace * (1 - textGapFactor);
                } else {
                    const contentStartY = centerY - contentHeight / 2;
                    imageY = contentStartY + basePadding;
                    imageX = centerX - image.width / 2;
                    textY = imageY + image.height + extraVerticalSpace * textGapFactor;
                }
            }

            // Fill background
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Draw Image
            ctx.drawImage(image, imageX, imageY, image.width, image.height);

            // Draw Metadata logic
            const fontSizeTitle = Math.round(fontBasePadding * 0.22 * headerScale);
            const fontSizeSettings = Math.round(fontBasePadding * 0.14 * paramsScale);
            const centerX = canvasWidth / 2;

            const brandLogoInfo = showLogo ? getBrandLogo(metadata.make) : null;
            let brandLogoImg: HTMLImageElement | null = null;
            if (brandLogoInfo) {
                // If the user says it's opposite, then 'light' folder likely contains icons FOR light backgrounds (black)
                // and 'dark' folder contains icons FOR dark backgrounds (white).
                const iconPath = `/icons/${theme}/${brandLogoInfo.filename}`;
                brandLogoImg = await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => resolve(null);
                    img.src = iconPath;
                });
            }

            if (frameStyle === 'editorial') {
                // Editorial Layout: Split left/right
                const sidePadding = basePadding + fontBasePadding * 0.2;

                // Left Side: Model & Date
                const model = (metadata.model || "Unknown").toUpperCase();
                const dateStr = metadata.dateTime ? metadata.dateTime.toISOString().split('T')[0] : '';

                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';

                // Draw Model
                ctx.font = `700 ${fontSizeTitle * 1.2}px Inter, sans-serif`;
                ctx.fillStyle = primaryTextColor;
                ctx.fillText(model, sidePadding, textY);

                // Draw Date (below model)
                if (dateStr) {
                    ctx.font = `400 ${fontSizeSettings}px Inter, sans-serif`;
                    ctx.fillStyle = secondaryTextColor;
                    ctx.fillText(dateStr, sidePadding, textY + fontSizeTitle * 1.1);
                }

                // Right Side: Logo | Params
                const settingsArr = [
                    formatFocalLength(metadata.focalLength),
                    formatFNumber(metadata.fNumber),
                    formatExposureTime(metadata.exposureTime),
                    formatISO(metadata.iso)
                ].filter(Boolean);
                const settingsText = settingsArr.join('  ');

                ctx.textAlign = 'right';
                ctx.font = `500 ${fontSizeSettings * 1.1}px Inter, sans-serif`;
                ctx.fillStyle = primaryTextColor;
                const paramsWidth = ctx.measureText(settingsText).width;

                ctx.fillText(settingsText, canvasWidth - sidePadding, textY);

                // Draw vertical separator and Brand Logo
                if (brandLogoImg) {
                    const logoHeight = fontSizeTitle * 1.2;
                    const aspect = brandLogoImg.width / brandLogoImg.height;
                    const logoWidth = logoHeight * aspect;
                    const separatorX = canvasWidth - sidePadding - paramsWidth - fontSizeSettings * 1.5;

                    // Draw separator
                    ctx.strokeStyle = separatorColor;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(separatorX, textY - fontSizeTitle * 0.6);
                    ctx.lineTo(separatorX, textY + fontSizeTitle * 0.6);
                    ctx.stroke();

                    // Draw Logo
                    const logoX = separatorX - fontSizeSettings * 1.5 - logoWidth;
                    const logoY = textY - logoHeight / 2;
                    ctx.drawImage(brandLogoImg, logoX, logoY, logoWidth, logoHeight);
                }

            } else {
                // Classic Layout: Centered
                const textShotOn = "Shot on ";
                const model = (metadata.model || "Unknown").toUpperCase();
                const make = (metadata.make || "").toUpperCase();
                const textModel = `${model} `;
                const textMake = make;

                // Measure Line 1
                ctx.font = `400 ${fontSizeTitle}px Inter, sans-serif`;
                const widthShotOn = ctx.measureText(textShotOn).width;
                ctx.font = `700 ${fontSizeTitle}px Inter, sans-serif`;
                const widthModel = ctx.measureText(textModel).width;
                ctx.font = `400 ${fontSizeTitle}px Inter, sans-serif`;
                const widthMake = ctx.measureText(textMake).width;
                const widthLine1 = widthShotOn + widthModel + widthMake;

                const settingsArr = [
                    formatFocalLength(metadata.focalLength),
                    formatFNumber(metadata.fNumber),
                    formatExposureTime(metadata.exposureTime),
                    formatISO(metadata.iso)
                ].filter(Boolean);
                const settingsText = settingsArr.join('  ');
                ctx.font = `400 ${fontSizeSettings}px Inter, sans-serif`;
                const widthLine2 = ctx.measureText(settingsText).width;

                const textBlockWidth = Math.max(widthLine1, widthLine2);

                let brandLogoTotalWidth = 0;
                let logoHeight = 0;
                let logoWidth = 0;
                let separatorWidth = 0;

                if (brandLogoImg) {
                    logoHeight = fontSizeTitle * 1.2;
                    const aspect = brandLogoImg.width / brandLogoImg.height;
                    logoWidth = logoHeight * aspect;
                    separatorWidth = fontSizeTitle * 1.2;
                    brandLogoTotalWidth = logoWidth + separatorWidth;
                }

                const totalContentWidth = brandLogoTotalWidth + textBlockWidth;
                let currentX = centerX - totalContentWidth / 2;

                const textLineSpacing = fontSizeTitle * 1.05;
                const textBlockCenterY = textY + textLineSpacing / 2;

                // Draw Logo and Separator if exists
                if (brandLogoImg) {
                    const logoY = textBlockCenterY - logoHeight / 2;
                    ctx.drawImage(brandLogoImg, currentX, logoY, logoWidth, logoHeight);

                    // Draw separator
                    const sepX = currentX + logoWidth + separatorWidth / 2;
                    ctx.strokeStyle = separatorColor;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(sepX, textY - fontSizeTitle * 0.5);
                    ctx.lineTo(sepX, textY + textLineSpacing + fontSizeSettings * 0.5);
                    ctx.stroke();

                    currentX += brandLogoTotalWidth;
                }

                // Draw Line 1 (Metadata Header)
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'left';
                ctx.font = `400 ${fontSizeTitle}px Inter, sans-serif`;
                ctx.fillStyle = secondaryTextColor;
                ctx.fillText(textShotOn, currentX, textY);
                let line1X = currentX + widthShotOn;

                ctx.font = `700 ${fontSizeTitle}px Inter, sans-serif`;
                ctx.fillStyle = primaryTextColor;
                ctx.fillText(textModel, line1X, textY);
                line1X += widthModel;

                ctx.font = `400 ${fontSizeTitle}px Inter, sans-serif`;
                ctx.fillStyle = primaryTextColor;
                ctx.fillText(textMake, line1X, textY);

                // Draw Line 2 (Settings) - Aligned to currentX
                ctx.font = `400 ${fontSizeSettings}px Inter, sans-serif`;
                ctx.fillStyle = paramsTextColor;
                ctx.textAlign = 'left';

                const textY2 = textY + textLineSpacing;
                ctx.fillText(settingsText, currentX, textY2);
            }

            onCanvasReady(canvas);
        };

        draw();
    }, [image, metadata, onCanvasReady, aspectRatio, textPosition, frameStyle, theme, showLogo, headerScale, paramsScale, marginScale]);

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
