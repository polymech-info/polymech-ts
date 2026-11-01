import * as path from 'path';
import xlsx from 'node-xlsx';
import { sync as write } from "@polymech/fs/write";
import { logger } from '../index.js';
const extension = (file) => path.parse(file).ext;
const createGoogleMapLink = (latitude, longitude, zoomLevel) => {
    const link = `https://www.google.com/maps/@${latitude},${longitude},${zoomLevel}z`;
    return link;
};
const createGoogleMapLinkFromPlaceId = (placeId) => {
    const link = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    return link;
};
export const writerJSON = (locations, dst, opts) => {
    if (!dst) {
        return;
    }
    logger.debug(`Writing users to ${dst}`);
    write(opts.dst, locations);
};
export const writerXLS = (locations, dst, opts) => {
    if (dst) {
        const locationsMap = locations.map((u) => {
            return [
                u.position,
                u.title,
                '',
                '',
                u.email,
                u.phone,
                u.type,
                u.address,
                u.website,
                u.instagram,
                u.youtube,
                u.facebook,
                u.linkedin,
                u.twitter,
                u.gps_coordinates.latitude + ',' + u.gps_coordinates.longitude,
                0,
                u.reviews,
                u.rating,
                u.geo.continent,
                u.geo.countryName,
                u.geo.city,
                createGoogleMapLinkFromPlaceId(u.place_id),
                createGoogleMapLink(u.gps_coordinates.latitude, u.gps_coordinates.longitude, 9)
            ];
        });
        let columns = [
            'Position',
            'Title',
            'EMail',
            'EMail - Finder.io',
            'EMail - ChatGPT',
            'Phone',
            'Type',
            'Address',
            'Web',
            'Instagram',
            'Youtube',
            'Facebook',
            'Linkedin',
            'Twitter',
            'Coords',
            'Status',
            'Reviews',
            'Rating',
            'Continent',
            'Country',
            'City',
            'Map Place',
            'Map Link'
        ];
        let data = [
            columns,
            ...locationsMap
        ];
        const sheetOptions = { '!cols': [{ wch: 5 }, { wch: 10 }, { wch: 10 }, { wch: 30 }, , { wch: 30 }, { wch: 40 }] };
        const buffer = xlsx.build([{ name: 'raw', data: data, options: sheetOptions }]);
        write(opts.dst, buffer);
        opts.debug && logger.debug(`Writing users to ${opts.dst}`);
        return data;
    }
};
const writerMarkdown = (locations, dst, opts) => {
    if (dst) {
        const bulletList = locations.map((u) => `- ${u.title} (${u.address} ) - [${u.website}](${u.website}) - 
            [Phone: ${u.phone}] -
            [Google Place](${createGoogleMapLinkFromPlaceId(u.place_id)}) - 
            [Continent] ${u.geo.continent} - 
            [Country] ${u.geo.countryName} - 
            [City] ${u.geo.city} - 
            [Maps](${createGoogleMapLink(u.gps_coordinates.latitude, u.gps_coordinates.longitude, 9)})
        `);
        const markdownContent = `### ${opts.query} \n\n  ${bulletList.join('\n')}`;
        write(opts.dst, markdownContent);
        opts.debug && logger.debug(`Writing users to ${opts.dst}`);
        return markdownContent;
    }
};
export const WRITERS = {
    '.xls': writerXLS,
    '.json': writerJSON,
    '.xlsx': writerXLS,
    '.md': writerMarkdown
};
export const writeReport = (locations, dst, opts) => WRITERS[extension(dst)](locations, dst, opts);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwb3J0X21hcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvcmVwb3J0X21hcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssSUFBSSxNQUFNLE1BQU0sQ0FBQTtBQUM1QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUE7QUFDNUIsT0FBTyxFQUFFLElBQUksSUFBSSxLQUFLLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQTtBQUNsRCxPQUFPLEVBQXNCLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQTtBQUl4RCxNQUFNLFNBQVMsR0FBRyxDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUE7QUFFeEQsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLFFBQWdCLEVBQUUsU0FBaUIsRUFBRSxTQUFpQixFQUFVLEVBQUU7SUFDM0YsTUFBTSxJQUFJLEdBQUcsZ0NBQWdDLFFBQVEsSUFBSSxTQUFTLElBQUksU0FBUyxHQUFHLENBQUM7SUFDbkYsT0FBTyxJQUFJLENBQUM7QUFDaEIsQ0FBQyxDQUFBO0FBQ0QsTUFBTSw4QkFBOEIsR0FBRyxDQUFDLE9BQWUsRUFBVSxFQUFFO0lBQy9ELE1BQU0sSUFBSSxHQUFHLGlEQUFpRCxPQUFPLEVBQUUsQ0FBQztJQUN4RSxPQUFPLElBQUksQ0FBQztBQUNoQixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxVQUFVLEdBQUcsQ0FBQyxTQUF3QixFQUFFLEdBQVcsRUFBRSxJQUFpQixFQUFFLEVBQUU7SUFDbkYsSUFBRyxDQUFDLEdBQUcsRUFBQyxDQUFDO1FBQ0wsT0FBTTtJQUNWLENBQUM7SUFDRCxNQUFNLENBQUMsS0FBSyxDQUFDLG9CQUFvQixHQUFHLEVBQUUsQ0FBQyxDQUFBO0lBQ3ZDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFBO0FBQzlCLENBQUMsQ0FBQTtB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