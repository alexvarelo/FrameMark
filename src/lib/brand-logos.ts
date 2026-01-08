
export interface BrandLogo {
    name: string;
    filename: string;
}

const BRANDS: Record<string, BrandLogo> = {
    FUJIFILM: { name: 'Fujifilm', filename: 'fujifilm.png' },
    SONY: { name: 'Sony', filename: 'sony.png' },
    CANON: { name: 'Canon', filename: 'canon.png' },
    NIKON: { name: 'Nikon', filename: 'nikon.png' },
    LEICA: { name: 'Leica', filename: 'leica.png' },
    APPLE: { name: 'Apple', filename: 'apple.png' },
    RICOH: { name: 'Ricoh', filename: 'ricoh.png' },
    HASSELBLAD: { name: 'Hasselblad', filename: 'hasselblad.png' },
    PANASONIC: { name: 'Panasonic', filename: 'lumix.png' },
    LUMIX: { name: 'Lumix', filename: 'lumix.png' },
    SAMSUNG: { name: 'Samsung', filename: 'samsung.png' },
    GOOGLE: { name: 'Google', filename: 'apple.png' }, // Google often uses similar metadata or generic logos, but let's stick to what we have
    OLYMPUS: { name: 'Olympus', filename: 'olympus.png' },
    OM: { name: 'OM System', filename: 'om.png' },
    PENTAX: { name: 'Pentax', filename: 'pentax.png' },
    SIGMA: { name: 'Sigma', filename: 'sigma.png' },
    DJI: { name: 'DJI', filename: 'dji.png' },
    CONTAX: { name: 'Contax', filename: 'contax.png' },
    MAMIYA: { name: 'Mamiya', filename: 'mamiya.png' },
    PHASEONE: { name: 'Phase One', filename: 'phaseone.png' },
    EPSON: { name: 'Epson', filename: 'epson.png' },
};

export const getBrandLogo = (make?: string): BrandLogo | null => {
    if (!make) return null;
    const normalizedMake = make.toUpperCase();

    // Exact or partial matches
    for (const key in BRANDS) {
        if (normalizedMake.includes(key)) return BRANDS[key];
    }

    // Special cases
    if (normalizedMake.includes('IPHONE')) return BRANDS.APPLE;

    return null;
};
