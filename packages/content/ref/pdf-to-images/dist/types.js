import { z } from 'zod';
// Define the base shape for arguments
export const ConvertCommandArgsSchema = z.object({
    input: z.string().describe('Path to the input PDF file'),
    output: z.string().describe('Output path template (e.g., output/page_{PAGE}.png)').optional(),
    dpi: z.number().int().positive().default(300).describe('Resolution for the output images'),
    scale: z.number().positive().default(2).describe('Scaling factor to apply before rendering (e.g., 2 for 2x size)').optional(),
    format: z.enum(['png', 'jpg']).default('png').describe('Output image format'),
    startPage: z.number().int().positive().describe('First page to convert (1-based index)').optional(),
    endPage: z.number().int().positive().describe('Last page to convert (1-based index)').optional()
});
// Add refinements, transformations, and catchall for final validation/parsing
export const ConvertCommandSchema = ConvertCommandArgsSchema
    .catchall(z.any()) // Allow var-* and other properties
    .transform((data) => {
    // Explicitly pick known fields + extras (var-*)
    const known = {
        input: data.input,
        output: data.output,
        dpi: data.dpi,
        format: data.format,
        startPage: data.startPage,
        endPage: data.endPage,
        scale: data.scale,
    };
    // Keep only extra properties (like var-*)
    const extras = Object.keys(data)
        .filter(key => !['input', 'output', 'dpi', 'format', 'startPage', 'endPage', 'scale', '_', '$0'].includes(key))
        .reduce((acc, key) => { acc[key] = data[key]; return acc; }, {});
    return { ...known, ...extras };
})
    .refine((data) => {
    if (data.startPage !== undefined && data.endPage !== undefined) {
        return data.startPage <= data.endPage;
    }
    return true;
}, {
    message: "startPage must be less than or equal to endPage",
    path: ["startPage"],
});
