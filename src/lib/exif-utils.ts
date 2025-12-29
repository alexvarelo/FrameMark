import exifr from 'exifr';

export interface PhotoMetadata {
    make?: string;
    model?: string;
    focalLength?: number;
    fNumber?: number;
    exposureTime?: number;
    iso?: number;
    lensModel?: string;
    dateTime?: Date;
}

export const extractMetadata = async (file: File | string): Promise<PhotoMetadata> => {
    try {
        const data = await exifr.parse(file, {
            pick: ['Make', 'Model', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO', 'LensModel', 'DateTimeOriginal'],
        });

        return {
            make: data?.Make,
            model: data?.Model,
            focalLength: data?.FocalLength,
            fNumber: data?.FNumber,
            exposureTime: data?.ExposureTime,
            iso: data?.ISO,
            lensModel: data?.LensModel,
            dateTime: data?.DateTimeOriginal,
        };
    } catch (error) {
        console.error('Error extracting metadata:', error);
        return {};
    }
};

export const formatExposureTime = (exposureTime?: number): string => {
    if (!exposureTime) return '';
    if (exposureTime >= 1) return `${exposureTime}s`;
    const denominator = Math.round(1 / exposureTime);
    return `1/${denominator}s`;
};

export const formatFocalLength = (focalLength?: number): string => {
    if (!focalLength) return '';
    return `${focalLength}mm`;
};

export const formatFNumber = (fNumber?: number): string => {
    if (!fNumber) return '';
    return `f/${fNumber}`;
};

export const formatISO = (iso?: number): string => {
    if (!iso) return '';
    return `ISO ${iso}`;
};
