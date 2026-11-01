import { saveAs } from 'file-saver';
import { type PlaceFull } from '@polymech/shared';
import { findSocialUrl } from '../useGridColumns';

/**
 * Common formatting for Place data for exports
 */
const formatPlacesForExport = (places: PlaceFull[]) => {
    const results = [];
    
    for (const place of places) {
        const p = place as any;
        
        // Handle emails - get only first email
        const emailsRaw = p.emails || p.meta?.emails || [];
        let firstEmail = "";
        
        if (Array.isArray(emailsRaw) && emailsRaw.length > 0) {
            const e = emailsRaw[0];
            firstEmail = typeof e === 'string' ? e : e.email;
        } else if (typeof emailsRaw === 'string' && emailsRaw.length > 0) {
            firstEmail = emailsRaw;
        }

        // Export only rows with emails
        if (!firstEmail) continue;

        // Handle social links
        const platforms = ['instagram', 'facebook', 'linkedin', 'youtube', 'twitter', 'github', 'tiktok'];
        const socialLinks = platforms
            .map(platform => {
                const url = findSocialUrl(p, platform);
                return url ? `${platform}: ${url}` : null;
            })
            .filter(Boolean)
            .join('; ');

        results.push({
            'Name': p.title,
            'Email': firstEmail,
            'Social Links': socialLinks,
            'Website': p.website || '',
            'Phone': p.phone || '',
            'Address': p.address || '',
            'City': p.city || p.geo?.city || p.meta?.geo?.city || p.raw_data?.geo?.city || '',
            'Country': p.country || p.geo?.country || p.geo?.countryName || p.meta?.geo?.countryName || p.meta?.geo?.country || p.raw_data?.geo?.countryName || '',
            'Rating': p.rating || p.raw_data?.rating || '',
            'Types': (p.types || []).join(', ')
        });
    }

    return results;
};

/**
 * Export to CSV
 */
export const exportToCSV = (places: PlaceFull[], filename = 'places-export.csv') => {
    const formattedData = formatPlacesForExport(places);
    if (!formattedData.length) return;

    const headers = Object.keys(formattedData[0]);
    const csvRows = [
        headers.join(','),
        ...formattedData.map(row => 
            headers.map(header => {
                const val = (row as any)[header] || '';
                // Escape quotes and wrap in quotes if contains comma or newline
                const escaped = String(val).replace(/"/g, '""');
                return /[,\n"]/.test(escaped) ? `"${escaped}"` : escaped;
            }).join(',')
        )
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, filename);
};

/**
 * Export to JSON
 */
export const exportToJSON = (places: PlaceFull[], filename = 'places-export.json') => {
    const formattedData = formatPlacesForExport(places);
    if (!formattedData.length) return;

    const jsonContent = JSON.stringify(formattedData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    saveAs(blob, filename);
};
