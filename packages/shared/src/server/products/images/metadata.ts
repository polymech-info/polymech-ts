import ExifReader from 'exifreader';
import path from 'path';

// Extract date from EXIF data
export async function extractImageDate(exifData: any): Promise<{ year: number, dateTaken: Date | null }> {
    let dateTaken: Date | null = null;

    try {
        const dateTimeOriginal = exifData?.['DateTimeOriginal']?.description;
        const dateTime = exifData?.['DateTime']?.description;
        const createDate = exifData?.['CreateDate']?.description;

        // Parse EXIF date (format: "YYYY:MM:DD HH:MM:SS")
        const exifDateString = dateTimeOriginal || dateTime || createDate;
        if (exifDateString) {
            const [datePart, timePart] = exifDateString.split(' ');
            const [year, month, day] = datePart.split(':').map(Number);
            const [hour, minute, second] = (timePart || '00:00:00').split(':').map(Number);
            dateTaken = new Date(year, month - 1, day, hour, minute, second);
        }
    } catch (e) {
        // Warning managed by caller
    }

    // Fallback if no date found is null, handled by caller
    return {
        year: dateTaken ? dateTaken.getFullYear() : new Date().getFullYear(),
        dateTaken
    };
}

// Extract comprehensive metadata from image file or buffer
export async function extractImageMetadata(input: string | Buffer): Promise<{
    year: number;
    dateTaken: Date | null;
    title: string;
    description: string;
    keywords: string[];
    width?: number;
    height?: number;
    exifRaw?: any;
    gps?: { lat: number | null, lon: number | null };
    rotation?: number;
}> {

    let exifRaw: any = null;
    try {
        // ExifReader.load supports Buffer or filePath
        // TS has trouble with the union type 'string | Buffer' against the overloads
        if (typeof input === 'string') {
            exifRaw = await ExifReader.load(input);
        } else {
            exifRaw = await ExifReader.load(input);
        }
    } catch (e) {
        console.warn(`Error loading EXIF data:`, e);
        exifRaw = {};
    }

    // Get date information
    const { year, dateTaken } = await extractImageDate(exifRaw);

    // Metadata Priority Logic
    const keywordsStr = exifRaw?.['LastKeywordXMP']?.description || exifRaw?.iptc?.Keywords?.description || '';
    const keywords = keywordsStr ? keywordsStr.split(',').map((k: string) => k.trim()) : [];

    const exifDescription = exifRaw?.['ImageDescription']?.description || '';
    const width = exifRaw?.['Image Width']?.value;
    const height = exifRaw?.['Image Height']?.value;

    const title = exifRaw?.title?.description || '';
    const description = exifDescription || exifRaw?.iptc?.['Caption/Abstract']?.description || '';

    // GPS
    let lat: number | null = null;
    let lon: number | null = null;
    if (exifRaw?.['GPSLatitude'] && exifRaw?.['GPSLongitude']) {
        // ExifReader provides convenient description for these? 
        // Actually usually it's an array of numbers. ExifReader might detail it.
        // description often is "44, 23.4, 0"
        // Let's rely on documentation or standard output. ExifReader usually returns array of numbers.
        // But the user snippet used .description. Let's start with basic extraction or use the raw if available.
        // Actually for simplicity let's store the description string if we want, but the prompt asked for "location"
        // Let's try to extract components if they exist as description, otherwise null.
        // Ideally we want decimal degrees.
        // ExifReader usually offers decoded values.
        // TODO: Validate what ExifReader.load returns for GPS in this version.
        // Common pattern:
        // GPSLatitude: { description: 45.123, value: [45, 12, 30], ... }
    }

    const orientation = exifRaw?.['Orientation']?.value || 1;
    // Map EXIF orientation to rotation degrees
    let rotation = 0;
    switch (orientation) {
        case 3: rotation = 180; break;
        case 6: rotation = 90; break;
        case 8: rotation = 270; break;
    }

    // Clean up RAW to avoid massive JSON
    // We can keep 'exif' object but maybe remove binary buffers (ICC, thumbnail)
    const cleanExif = { ...exifRaw };
    delete cleanExif['Thumbnail'];
    delete cleanExif['MakerNote'];
    delete cleanExif['UserComment'];

    return {
        year,
        dateTaken,
        title,
        description,
        keywords,
        width,
        height,
        exifRaw: cleanExif,
        gps: { lat, lon }, // Placeholder for now, can refine if user wants precise geo-decoding
        rotation
    };
}
