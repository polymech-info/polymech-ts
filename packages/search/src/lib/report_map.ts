import * as path from 'path'
import xlsx from 'node-xlsx'
import { sync as write } from "@polymech/fs/write"
import { IOptionsGoogleMaps, logger } from '../index.js'
import { IOptionsMap } from '../types.js'
import { LocalResult } from './map_types.js'

const extension = (file: string) => path.parse(file).ext

const createGoogleMapLink = (latitude: number, longitude: number, zoomLevel: number): string => {
    const link = `https://www.google.com/maps/@${latitude},${longitude},${zoomLevel}z`;
    return link;
}
const createGoogleMapLinkFromPlaceId = (placeId: string): string => {
    const link = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    return link;
}

export const writerJSON = (locations: LocalResult[], dst: string, opts: IOptionsMap) => {
    if(!dst){
        return
    }
    logger.debug(`Writing users to ${dst}`)
    write(opts.dst, locations)
}
export const writerXLS = (locations: LocalResult[], dst: string, opts: IOptionsMap) => {
    if (dst) {
        const locationsMap: any = locations.map((u) => {
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
            ]
        })

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
        ]

        let data =
            [
                columns,
                ...locationsMap
            ]

        const sheetOptions = { '!cols': [{ wch: 5 }, { wch: 10 }, { wch: 10 }, { wch: 30 }, , { wch: 30 }, { wch: 40 }] }
        const buffer = xlsx.build([{ name: 'raw', data: data, options: sheetOptions as any }])
        write(opts.dst, buffer)
        opts.debug && logger.debug(`Writing users to ${opts.dst}`)
        return data
    }
}

const writerMarkdown = (locations: LocalResult[], dst: string, opts: IOptionsMap) => {
    if (dst) {
        const bulletList = locations.map((u) =>
            `- ${u.title} (${u.address} ) - [${u.website}](${u.website}) - 
            [Phone: ${u.phone}] -
            [Google Place](${createGoogleMapLinkFromPlaceId(u.place_id)}) - 
            [Continent] ${(u as any).geo.continent} - 
            [Country] ${(u as any).geo.countryName} - 
            [City] ${(u as any).geo.city} - 
            [Maps](${createGoogleMapLink(u.gps_coordinates.latitude, u.gps_coordinates.longitude, 9)})
        `)
        const markdownContent = `### ${opts.query} \n\n  ${bulletList.join('\n')}`
        write(opts.dst, markdownContent)
        opts.debug && logger.debug(`Writing users to ${opts.dst}`)
        return markdownContent
    }
}

export const WRITERS = {
    '.xls': writerXLS,
    '.json': writerJSON,
    '.xlsx': writerXLS,
    '.md': writerMarkdown
}
export const writeReport = (locations: LocalResult[], dst: string, opts: IOptionsGoogleMaps) =>
    WRITERS[extension(dst)](locations,dst, opts)