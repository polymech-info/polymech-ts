import { z } from 'zod/v4';
import { ZodMetaMap } from '../map.js';
export declare const CompetitorSchema: z.ZodObject<{
    place_id: z.ZodString;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    gps_coordinates: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    }, z.core.$strip>>>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    website: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    operating_hours: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    thumbnail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    types: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    continent: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    country: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    city: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    updated_at: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    raw_data: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
}, z.core.$strip>;
export declare const GpsCoordinatesSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
}, z.core.$strip>;
export declare const OperatingHoursSchema: z.ZodObject<{
    sunday: z.ZodString;
    monday: z.ZodString;
    tuesday: z.ZodString;
    wednesday: z.ZodString;
    thursday: z.ZodString;
    friday: z.ZodString;
    saturday: z.ZodString;
}, z.core.$strip>;
export declare const AccessibilityExtensionSchema: z.ZodObject<{
    accessibility: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const CrowdExtensionSchema: z.ZodObject<{
    crowd: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const ExtensionsSchema: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
    accessibility: z.ZodArray<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    crowd: z.ZodArray<z.ZodString>;
}, z.core.$strip>]>>;
export declare const AdministrativeAreaFullSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    isoName: z.ZodString;
    order: z.ZodNumber;
    adminLevel: z.ZodNumber;
    isoCode: z.ZodString;
    wikidataId: z.ZodString;
    geonameId: z.ZodNumber;
}, z.core.$strip>;
export declare const AdministrativeAreaMinimalSchema: z.ZodObject<{
    name: z.ZodString;
    order: z.ZodNumber;
    adminLevel: z.ZodNumber;
}, z.core.$strip>;
export declare const AdministrativeAreaWithWikidataSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    order: z.ZodNumber;
    adminLevel: z.ZodNumber;
    wikidataId: z.ZodString;
}, z.core.$strip>;
export declare const AdministrativeAreaWithGeonameSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    order: z.ZodNumber;
    adminLevel: z.ZodNumber;
    wikidataId: z.ZodString;
    geonameId: z.ZodNumber;
}, z.core.$strip>;
export declare const InformativeAreaFullSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    isoName: z.ZodString;
    order: z.ZodNumber;
    isoCode: z.ZodString;
    wikidataId: z.ZodString;
    geonameId: z.ZodNumber;
}, z.core.$strip>;
export declare const InformativeAreaBasicSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    order: z.ZodNumber;
}, z.core.$strip>;
export declare const InformativeAreaWithGeonameSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    order: z.ZodNumber;
    wikidataId: z.ZodString;
    geonameId: z.ZodNumber;
}, z.core.$strip>;
export declare const InformativeAreaWithWikidataSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    order: z.ZodNumber;
    wikidataId: z.ZodString;
}, z.core.$strip>;
export declare const InformativeAreaMinimalSchema: z.ZodObject<{
    name: z.ZodString;
    order: z.ZodNumber;
}, z.core.$strip>;
export declare const LocalityInfoSchema: z.ZodObject<{
    administrative: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        isoName: z.ZodString;
        order: z.ZodNumber;
        adminLevel: z.ZodNumber;
        isoCode: z.ZodString;
        wikidataId: z.ZodString;
        geonameId: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodString;
        order: z.ZodNumber;
        adminLevel: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        order: z.ZodNumber;
        adminLevel: z.ZodNumber;
        wikidataId: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        order: z.ZodNumber;
        adminLevel: z.ZodNumber;
        wikidataId: z.ZodString;
        geonameId: z.ZodNumber;
    }, z.core.$strip>]>>;
    informative: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        isoName: z.ZodString;
        order: z.ZodNumber;
        isoCode: z.ZodString;
        wikidataId: z.ZodString;
        geonameId: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        order: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        order: z.ZodNumber;
        wikidataId: z.ZodString;
        geonameId: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        order: z.ZodNumber;
        wikidataId: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        name: z.ZodString;
        order: z.ZodNumber;
    }, z.core.$strip>]>>;
}, z.core.$strip>;
export declare const GeoSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    localityLanguageRequested: z.ZodString;
    continent: z.ZodString;
    continentCode: z.ZodString;
    countryName: z.ZodString;
    countryCode: z.ZodString;
    principalSubdivision: z.ZodString;
    principalSubdivisionCode: z.ZodString;
    city: z.ZodString;
    locality: z.ZodString;
    postcode: z.ZodString;
    plusCode: z.ZodString;
    localityInfo: z.ZodObject<{
        administrative: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            isoName: z.ZodString;
            order: z.ZodNumber;
            adminLevel: z.ZodNumber;
            isoCode: z.ZodString;
            wikidataId: z.ZodString;
            geonameId: z.ZodNumber;
        }, z.core.$strip>, z.ZodObject<{
            name: z.ZodString;
            order: z.ZodNumber;
            adminLevel: z.ZodNumber;
        }, z.core.$strip>, z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            order: z.ZodNumber;
            adminLevel: z.ZodNumber;
            wikidataId: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            order: z.ZodNumber;
            adminLevel: z.ZodNumber;
            wikidataId: z.ZodString;
            geonameId: z.ZodNumber;
        }, z.core.$strip>]>>;
        informative: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            isoName: z.ZodString;
            order: z.ZodNumber;
            isoCode: z.ZodString;
            wikidataId: z.ZodString;
            geonameId: z.ZodNumber;
        }, z.core.$strip>, z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            order: z.ZodNumber;
        }, z.core.$strip>, z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            order: z.ZodNumber;
            wikidataId: z.ZodString;
            geonameId: z.ZodNumber;
        }, z.core.$strip>, z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            order: z.ZodNumber;
            wikidataId: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            name: z.ZodString;
            order: z.ZodNumber;
        }, z.core.$strip>]>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const SearchMetadataSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodString;
    json_endpoint: z.ZodString;
    created_at: z.ZodString;
    processed_at: z.ZodString;
    google_maps_photos_url: z.ZodString;
    raw_html_file: z.ZodString;
    prettify_html_file: z.ZodString;
    total_time_taken: z.ZodNumber;
}, z.core.$strip>;
export declare const SearchParametersSchema: z.ZodObject<{
    engine: z.ZodString;
    data_id: z.ZodString;
    hl: z.ZodString;
}, z.core.$strip>;
export declare const CategorySchema: z.ZodObject<{
    title: z.ZodString;
    id: z.ZodString;
}, z.core.$strip>;
export declare const PhotoSchema: z.ZodObject<{
    thumbnail: z.ZodString;
    image: z.ZodString;
    photo_meta_serpapi_link: z.ZodString;
}, z.core.$strip>;
export declare const SerpapiPaginationSchema: z.ZodObject<{
    next: z.ZodString;
    next_page_token: z.ZodString;
}, z.core.$strip>;
export declare const GoogleMediaSchema: z.ZodObject<{
    search_metadata: z.ZodObject<{
        id: z.ZodString;
        status: z.ZodString;
        json_endpoint: z.ZodString;
        created_at: z.ZodString;
        processed_at: z.ZodString;
        google_maps_photos_url: z.ZodString;
        raw_html_file: z.ZodString;
        prettify_html_file: z.ZodString;
        total_time_taken: z.ZodNumber;
    }, z.core.$strip>;
    search_parameters: z.ZodObject<{
        engine: z.ZodString;
        data_id: z.ZodString;
        hl: z.ZodString;
    }, z.core.$strip>;
    categories: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        id: z.ZodString;
    }, z.core.$strip>>;
    photos: z.ZodArray<z.ZodObject<{
        thumbnail: z.ZodString;
        image: z.ZodString;
        photo_meta_serpapi_link: z.ZodString;
    }, z.core.$strip>>;
    serpapi_pagination: z.ZodObject<{
        next: z.ZodString;
        next_page_token: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const LocationSchema: z.ZodObject<{
    position: z.ZodOptional<z.ZodNumber>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    place_id: z.ZodOptional<z.ZodString>;
    data_id: z.ZodOptional<z.ZodString>;
    data_cid: z.ZodOptional<z.ZodString>;
    reviews_link: z.ZodOptional<z.ZodString>;
    photos_link: z.ZodOptional<z.ZodString>;
    gps_coordinates: z.ZodOptional<z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    }, z.core.$strip>>;
    place_id_search: z.ZodOptional<z.ZodString>;
    provider_id: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    types: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type_id: z.ZodOptional<z.ZodString>;
    type_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
    address: z.ZodOptional<z.ZodString>;
    open_state: z.ZodOptional<z.ZodString>;
    hours: z.ZodOptional<z.ZodString>;
    operating_hours: z.ZodOptional<z.ZodObject<{
        sunday: z.ZodString;
        monday: z.ZodString;
        tuesday: z.ZodString;
        wednesday: z.ZodString;
        thursday: z.ZodString;
        friday: z.ZodString;
        saturday: z.ZodString;
    }, z.core.$strip>>;
    phone: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    extensions: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
        accessibility: z.ZodArray<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        crowd: z.ZodArray<z.ZodString>;
    }, z.core.$strip>]>>>;
    thumbnail: z.ZodOptional<z.ZodString>;
    serpapi_thumbnail: z.ZodOptional<z.ZodString>;
    page: z.ZodOptional<z.ZodNumber>;
    geo: z.ZodOptional<z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
        localityLanguageRequested: z.ZodString;
        continent: z.ZodString;
        continentCode: z.ZodString;
        countryName: z.ZodString;
        countryCode: z.ZodString;
        principalSubdivision: z.ZodString;
        principalSubdivisionCode: z.ZodString;
        city: z.ZodString;
        locality: z.ZodString;
        postcode: z.ZodString;
        plusCode: z.ZodString;
        localityInfo: z.ZodObject<{
            administrative: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                isoName: z.ZodString;
                order: z.ZodNumber;
                adminLevel: z.ZodNumber;
                isoCode: z.ZodString;
                wikidataId: z.ZodString;
                geonameId: z.ZodNumber;
            }, z.core.$strip>, z.ZodObject<{
                name: z.ZodString;
                order: z.ZodNumber;
                adminLevel: z.ZodNumber;
            }, z.core.$strip>, z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                order: z.ZodNumber;
                adminLevel: z.ZodNumber;
                wikidataId: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                order: z.ZodNumber;
                adminLevel: z.ZodNumber;
                wikidataId: z.ZodString;
                geonameId: z.ZodNumber;
            }, z.core.$strip>]>>;
            informative: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                isoName: z.ZodString;
                order: z.ZodNumber;
                isoCode: z.ZodString;
                wikidataId: z.ZodString;
                geonameId: z.ZodNumber;
            }, z.core.$strip>, z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                order: z.ZodNumber;
            }, z.core.$strip>, z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                order: z.ZodNumber;
                wikidataId: z.ZodString;
                geonameId: z.ZodNumber;
            }, z.core.$strip>, z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                order: z.ZodNumber;
                wikidataId: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                name: z.ZodString;
                order: z.ZodNumber;
            }, z.core.$strip>]>>;
        }, z.core.$strip>;
    }, z.core.$strip>>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    google_media: z.ZodOptional<z.ZodObject<{
        search_metadata: z.ZodObject<{
            id: z.ZodString;
            status: z.ZodString;
            json_endpoint: z.ZodString;
            created_at: z.ZodString;
            processed_at: z.ZodString;
            google_maps_photos_url: z.ZodString;
            raw_html_file: z.ZodString;
            prettify_html_file: z.ZodString;
            total_time_taken: z.ZodNumber;
        }, z.core.$strip>;
        search_parameters: z.ZodObject<{
            engine: z.ZodString;
            data_id: z.ZodString;
            hl: z.ZodString;
        }, z.core.$strip>;
        categories: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            id: z.ZodString;
        }, z.core.$strip>>;
        photos: z.ZodArray<z.ZodObject<{
            thumbnail: z.ZodString;
            image: z.ZodString;
            photo_meta_serpapi_link: z.ZodString;
        }, z.core.$strip>>;
        serpapi_pagination: z.ZodObject<{
            next: z.ZodString;
            next_page_token: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const CompetitorSchemaFull: z.ZodObject<{
    place_id: z.ZodString;
    title: z.ZodString;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    gps_coordinates: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    }, z.core.$strip>>>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    website: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    operating_hours: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        sunday: z.ZodString;
        monday: z.ZodString;
        tuesday: z.ZodString;
        wednesday: z.ZodString;
        thursday: z.ZodString;
        friday: z.ZodString;
        saturday: z.ZodString;
    }, z.core.$strip>>>;
    thumbnail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    types: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    raw_data: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodNumber>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        place_id: z.ZodOptional<z.ZodString>;
        data_id: z.ZodOptional<z.ZodString>;
        data_cid: z.ZodOptional<z.ZodString>;
        reviews_link: z.ZodOptional<z.ZodString>;
        photos_link: z.ZodOptional<z.ZodString>;
        gps_coordinates: z.ZodOptional<z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
        }, z.core.$strip>>;
        place_id_search: z.ZodOptional<z.ZodString>;
        provider_id: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        types: z.ZodOptional<z.ZodArray<z.ZodString>>;
        type_id: z.ZodOptional<z.ZodString>;
        type_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
        address: z.ZodOptional<z.ZodString>;
        open_state: z.ZodOptional<z.ZodString>;
        hours: z.ZodOptional<z.ZodString>;
        operating_hours: z.ZodOptional<z.ZodObject<{
            sunday: z.ZodString;
            monday: z.ZodString;
            tuesday: z.ZodString;
            wednesday: z.ZodString;
            thursday: z.ZodString;
            friday: z.ZodString;
            saturday: z.ZodString;
        }, z.core.$strip>>;
        phone: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
        extensions: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
            accessibility: z.ZodArray<z.ZodString>;
        }, z.core.$strip>, z.ZodObject<{
            crowd: z.ZodArray<z.ZodString>;
        }, z.core.$strip>]>>>;
        thumbnail: z.ZodOptional<z.ZodString>;
        serpapi_thumbnail: z.ZodOptional<z.ZodString>;
        page: z.ZodOptional<z.ZodNumber>;
        geo: z.ZodOptional<z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
            localityLanguageRequested: z.ZodString;
            continent: z.ZodString;
            continentCode: z.ZodString;
            countryName: z.ZodString;
            countryCode: z.ZodString;
            principalSubdivision: z.ZodString;
            principalSubdivisionCode: z.ZodString;
            city: z.ZodString;
            locality: z.ZodString;
            postcode: z.ZodString;
            plusCode: z.ZodString;
            localityInfo: z.ZodObject<{
                administrative: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
                    name: z.ZodString;
                    description: z.ZodString;
                    isoName: z.ZodString;
                    order: z.ZodNumber;
                    adminLevel: z.ZodNumber;
                    isoCode: z.ZodString;
                    wikidataId: z.ZodString;
                    geonameId: z.ZodNumber;
                }, z.core.$strip>, z.ZodObject<{
                    name: z.ZodString;
                    order: z.ZodNumber;
                    adminLevel: z.ZodNumber;
                }, z.core.$strip>, z.ZodObject<{
                    name: z.ZodString;
                    description: z.ZodString;
                    order: z.ZodNumber;
                    adminLevel: z.ZodNumber;
                    wikidataId: z.ZodString;
                }, z.core.$strip>, z.ZodObject<{
                    name: z.ZodString;
                    description: z.ZodString;
                    order: z.ZodNumber;
                    adminLevel: z.ZodNumber;
                    wikidataId: z.ZodString;
                    geonameId: z.ZodNumber;
                }, z.core.$strip>]>>;
                informative: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
                    name: z.ZodString;
                    description: z.ZodString;
                    isoName: z.ZodString;
                    order: z.ZodNumber;
                    isoCode: z.ZodString;
                    wikidataId: z.ZodString;
                    geonameId: z.ZodNumber;
                }, z.core.$strip>, z.ZodObject<{
                    name: z.ZodString;
                    description: z.ZodString;
                    order: z.ZodNumber;
                }, z.core.$strip>, z.ZodObject<{
                    name: z.ZodString;
                    description: z.ZodString;
                    order: z.ZodNumber;
                    wikidataId: z.ZodString;
                    geonameId: z.ZodNumber;
                }, z.core.$strip>, z.ZodObject<{
                    name: z.ZodString;
                    description: z.ZodString;
                    order: z.ZodNumber;
                    wikidataId: z.ZodString;
                }, z.core.$strip>, z.ZodObject<{
                    name: z.ZodString;
                    order: z.ZodNumber;
                }, z.core.$strip>]>>;
            }, z.core.$strip>;
        }, z.core.$strip>>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        google_media: z.ZodOptional<z.ZodObject<{
            search_metadata: z.ZodObject<{
                id: z.ZodString;
                status: z.ZodString;
                json_endpoint: z.ZodString;
                created_at: z.ZodString;
                processed_at: z.ZodString;
                google_maps_photos_url: z.ZodString;
                raw_html_file: z.ZodString;
                prettify_html_file: z.ZodString;
                total_time_taken: z.ZodNumber;
            }, z.core.$strip>;
            search_parameters: z.ZodObject<{
                engine: z.ZodString;
                data_id: z.ZodString;
                hl: z.ZodString;
            }, z.core.$strip>;
            categories: z.ZodArray<z.ZodObject<{
                title: z.ZodString;
                id: z.ZodString;
            }, z.core.$strip>>;
            photos: z.ZodArray<z.ZodObject<{
                thumbnail: z.ZodString;
                image: z.ZodString;
                photo_meta_serpapi_link: z.ZodString;
            }, z.core.$strip>>;
            serpapi_pagination: z.ZodObject<{
                next: z.ZodString;
                next_page_token: z.ZodString;
            }, z.core.$strip>;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    continent: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    country: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    city: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    updated_at: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const CompetitorResponseSchema: z.ZodObject<{
    message: z.ZodString;
    data: z.ZodOptional<z.ZodArray<z.ZodObject<{
        place_id: z.ZodString;
        title: z.ZodString;
        address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        gps_coordinates: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
        }, z.core.$strip>>>;
        phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        website: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        operating_hours: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            sunday: z.ZodString;
            monday: z.ZodString;
            tuesday: z.ZodString;
            wednesday: z.ZodString;
            thursday: z.ZodString;
            friday: z.ZodString;
            saturday: z.ZodString;
        }, z.core.$strip>>>;
        thumbnail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        types: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString>>>;
        raw_data: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodNumber>;
            title: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            place_id: z.ZodOptional<z.ZodString>;
            data_id: z.ZodOptional<z.ZodString>;
            data_cid: z.ZodOptional<z.ZodString>;
            reviews_link: z.ZodOptional<z.ZodString>;
            photos_link: z.ZodOptional<z.ZodString>;
            gps_coordinates: z.ZodOptional<z.ZodObject<{
                latitude: z.ZodNumber;
                longitude: z.ZodNumber;
            }, z.core.$strip>>;
            place_id_search: z.ZodOptional<z.ZodString>;
            provider_id: z.ZodOptional<z.ZodString>;
            type: z.ZodOptional<z.ZodString>;
            types: z.ZodOptional<z.ZodArray<z.ZodString>>;
            type_id: z.ZodOptional<z.ZodString>;
            type_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            address: z.ZodOptional<z.ZodString>;
            open_state: z.ZodOptional<z.ZodString>;
            hours: z.ZodOptional<z.ZodString>;
            operating_hours: z.ZodOptional<z.ZodObject<{
                sunday: z.ZodString;
                monday: z.ZodString;
                tuesday: z.ZodString;
                wednesday: z.ZodString;
                thursday: z.ZodString;
                friday: z.ZodString;
                saturday: z.ZodString;
            }, z.core.$strip>>;
            phone: z.ZodOptional<z.ZodString>;
            website: z.ZodOptional<z.ZodString>;
            extensions: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
                accessibility: z.ZodArray<z.ZodString>;
            }, z.core.$strip>, z.ZodObject<{
                crowd: z.ZodArray<z.ZodString>;
            }, z.core.$strip>]>>>;
            thumbnail: z.ZodOptional<z.ZodString>;
            serpapi_thumbnail: z.ZodOptional<z.ZodString>;
            page: z.ZodOptional<z.ZodNumber>;
            geo: z.ZodOptional<z.ZodObject<{
                latitude: z.ZodNumber;
                longitude: z.ZodNumber;
                localityLanguageRequested: z.ZodString;
                continent: z.ZodString;
                continentCode: z.ZodString;
                countryName: z.ZodString;
                countryCode: z.ZodString;
                principalSubdivision: z.ZodString;
                principalSubdivisionCode: z.ZodString;
                city: z.ZodString;
                locality: z.ZodString;
                postcode: z.ZodString;
                plusCode: z.ZodString;
                localityInfo: z.ZodObject<{
                    administrative: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
                        name: z.ZodString;
                        description: z.ZodString;
                        isoName: z.ZodString;
                        order: z.ZodNumber;
                        adminLevel: z.ZodNumber;
                        isoCode: z.ZodString;
                        wikidataId: z.ZodString;
                        geonameId: z.ZodNumber;
                    }, z.core.$strip>, z.ZodObject<{
                        name: z.ZodString;
                        order: z.ZodNumber;
                        adminLevel: z.ZodNumber;
                    }, z.core.$strip>, z.ZodObject<{
                        name: z.ZodString;
                        description: z.ZodString;
                        order: z.ZodNumber;
                        adminLevel: z.ZodNumber;
                        wikidataId: z.ZodString;
                    }, z.core.$strip>, z.ZodObject<{
                        name: z.ZodString;
                        description: z.ZodString;
                        order: z.ZodNumber;
                        adminLevel: z.ZodNumber;
                        wikidataId: z.ZodString;
                        geonameId: z.ZodNumber;
                    }, z.core.$strip>]>>;
                    informative: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
                        name: z.ZodString;
                        description: z.ZodString;
                        isoName: z.ZodString;
                        order: z.ZodNumber;
                        isoCode: z.ZodString;
                        wikidataId: z.ZodString;
                        geonameId: z.ZodNumber;
                    }, z.core.$strip>, z.ZodObject<{
                        name: z.ZodString;
                        description: z.ZodString;
                        order: z.ZodNumber;
                    }, z.core.$strip>, z.ZodObject<{
                        name: z.ZodString;
                        description: z.ZodString;
                        order: z.ZodNumber;
                        wikidataId: z.ZodString;
                        geonameId: z.ZodNumber;
                    }, z.core.$strip>, z.ZodObject<{
                        name: z.ZodString;
                        description: z.ZodString;
                        order: z.ZodNumber;
                        wikidataId: z.ZodString;
                    }, z.core.$strip>, z.ZodObject<{
                        name: z.ZodString;
                        order: z.ZodNumber;
                    }, z.core.$strip>]>>;
                }, z.core.$strip>;
            }, z.core.$strip>>;
            meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            google_media: z.ZodOptional<z.ZodObject<{
                search_metadata: z.ZodObject<{
                    id: z.ZodString;
                    status: z.ZodString;
                    json_endpoint: z.ZodString;
                    created_at: z.ZodString;
                    processed_at: z.ZodString;
                    google_maps_photos_url: z.ZodString;
                    raw_html_file: z.ZodString;
                    prettify_html_file: z.ZodString;
                    total_time_taken: z.ZodNumber;
                }, z.core.$strip>;
                search_parameters: z.ZodObject<{
                    engine: z.ZodString;
                    data_id: z.ZodString;
                    hl: z.ZodString;
                }, z.core.$strip>;
                categories: z.ZodArray<z.ZodObject<{
                    title: z.ZodString;
                    id: z.ZodString;
                }, z.core.$strip>>;
                photos: z.ZodArray<z.ZodObject<{
                    thumbnail: z.ZodString;
                    image: z.ZodString;
                    photo_meta_serpapi_link: z.ZodString;
                }, z.core.$strip>>;
                serpapi_pagination: z.ZodObject<{
                    next: z.ZodString;
                    next_page_token: z.ZodString;
                }, z.core.$strip>;
            }, z.core.$strip>>;
        }, z.core.$strip>>>;
        continent: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        country: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        city: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        updated_at: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const CompetitorDetailResponseSchema: z.ZodObject<{
    message: z.ZodString;
    data: z.ZodOptional<z.ZodObject<{
        place_id: z.ZodString;
        title: z.ZodString;
        address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        gps_coordinates: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
        }, z.core.$strip>>>;
        phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        website: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        operating_hours: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            sunday: z.ZodString;
            monday: z.ZodString;
            tuesday: z.ZodString;
            wednesday: z.ZodString;
            thursday: z.ZodString;
            friday: z.ZodString;
            saturday: z.ZodString;
        }, z.core.$strip>>>;
        thumbnail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        types: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString>>>;
        raw_data: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodNumber>;
            title: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            place_id: z.ZodOptional<z.ZodString>;
            data_id: z.ZodOptional<z.ZodString>;
            data_cid: z.ZodOptional<z.ZodString>;
            reviews_link: z.ZodOptional<z.ZodString>;
            photos_link: z.ZodOptional<z.ZodString>;
            gps_coordinates: z.ZodOptional<z.ZodObject<{
                latitude: z.ZodNumber;
                longitude: z.ZodNumber;
            }, z.core.$strip>>;
            place_id_search: z.ZodOptional<z.ZodString>;
            provider_id: z.ZodOptional<z.ZodString>;
            type: z.ZodOptional<z.ZodString>;
            types: z.ZodOptional<z.ZodArray<z.ZodString>>;
            type_id: z.ZodOptional<z.ZodString>;
            type_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            address: z.ZodOptional<z.ZodString>;
            open_state: z.ZodOptional<z.ZodString>;
            hours: z.ZodOptional<z.ZodString>;
            operating_hours: z.ZodOptional<z.ZodObject<{
                sunday: z.ZodString;
                monday: z.ZodString;
                tuesday: z.ZodString;
                wednesday: z.ZodString;
                thursday: z.ZodString;
                friday: z.ZodString;
                saturday: z.ZodString;
            }, z.core.$strip>>;
            phone: z.ZodOptional<z.ZodString>;
            website: z.ZodOptional<z.ZodString>;
            extensions: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
                accessibility: z.ZodArray<z.ZodString>;
            }, z.core.$strip>, z.ZodObject<{
                crowd: z.ZodArray<z.ZodString>;
            }, z.core.$strip>]>>>;
            thumbnail: z.ZodOptional<z.ZodString>;
            serpapi_thumbnail: z.ZodOptional<z.ZodString>;
            page: z.ZodOptional<z.ZodNumber>;
            geo: z.ZodOptional<z.ZodObject<{
                latitude: z.ZodNumber;
                longitude: z.ZodNumber;
                localityLanguageRequested: z.ZodString;
                continent: z.ZodString;
                continentCode: z.ZodString;
                countryName: z.ZodString;
                countryCode: z.ZodString;
                principalSubdivision: z.ZodString;
                principalSubdivisionCode: z.ZodString;
                city: z.ZodString;
                locality: z.ZodString;
                postcode: z.ZodString;
                plusCode: z.ZodString;
                localityInfo: z.ZodObject<{
                    administrative: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
                        name: z.ZodString;
                        description: z.ZodString;
                        isoName: z.ZodString;
                        order: z.ZodNumber;
                        adminLevel: z.ZodNumber;
                        isoCode: z.ZodString;
                        wikidataId: z.ZodString;
                        geonameId: z.ZodNumber;
                    }, z.core.$strip>, z.ZodObject<{
                        name: z.ZodString;
                        order: z.ZodNumber;
                        adminLevel: z.ZodNumber;
                    }, z.core.$strip>, z.ZodObject<{
                        name: z.ZodString;
                        description: z.ZodString;
                        order: z.ZodNumber;
                        adminLevel: z.ZodNumber;
                        wikidataId: z.ZodString;
                    }, z.core.$strip>, z.ZodObject<{
                        name: z.ZodString;
                        description: z.ZodString;
                        order: z.ZodNumber;
                        adminLevel: z.ZodNumber;
                        wikidataId: z.ZodString;
                        geonameId: z.ZodNumber;
                    }, z.core.$strip>]>>;
                    informative: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
                        name: z.ZodString;
                        description: z.ZodString;
                        isoName: z.ZodString;
                        order: z.ZodNumber;
                        isoCode: z.ZodString;
                        wikidataId: z.ZodString;
                        geonameId: z.ZodNumber;
                    }, z.core.$strip>, z.ZodObject<{
                        name: z.ZodString;
                        description: z.ZodString;
                        order: z.ZodNumber;
                    }, z.core.$strip>, z.ZodObject<{
                        name: z.ZodString;
                        description: z.ZodString;
                        order: z.ZodNumber;
                        wikidataId: z.ZodString;
                        geonameId: z.ZodNumber;
                    }, z.core.$strip>, z.ZodObject<{
                        name: z.ZodString;
                        description: z.ZodString;
                        order: z.ZodNumber;
                        wikidataId: z.ZodString;
                    }, z.core.$strip>, z.ZodObject<{
                        name: z.ZodString;
                        order: z.ZodNumber;
                    }, z.core.$strip>]>>;
                }, z.core.$strip>;
            }, z.core.$strip>>;
            meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            google_media: z.ZodOptional<z.ZodObject<{
                search_metadata: z.ZodObject<{
                    id: z.ZodString;
                    status: z.ZodString;
                    json_endpoint: z.ZodString;
                    created_at: z.ZodString;
                    processed_at: z.ZodString;
                    google_maps_photos_url: z.ZodString;
                    raw_html_file: z.ZodString;
                    prettify_html_file: z.ZodString;
                    total_time_taken: z.ZodNumber;
                }, z.core.$strip>;
                search_parameters: z.ZodObject<{
                    engine: z.ZodString;
                    data_id: z.ZodString;
                    hl: z.ZodString;
                }, z.core.$strip>;
                categories: z.ZodArray<z.ZodObject<{
                    title: z.ZodString;
                    id: z.ZodString;
                }, z.core.$strip>>;
                photos: z.ZodArray<z.ZodObject<{
                    thumbnail: z.ZodString;
                    image: z.ZodString;
                    photo_meta_serpapi_link: z.ZodString;
                }, z.core.$strip>>;
                serpapi_pagination: z.ZodObject<{
                    next: z.ZodString;
                    next_page_token: z.ZodString;
                }, z.core.$strip>;
            }, z.core.$strip>>;
        }, z.core.$strip>>>;
        continent: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        country: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        city: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        updated_at: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type Competitor = z.infer<typeof CompetitorSchema>;
export type CompetitorResponse = z.infer<typeof CompetitorResponseSchema>;
export type CompetitorDetailResponse = z.infer<typeof CompetitorDetailResponseSchema>;
export type CompetitorFull = z.infer<typeof CompetitorSchemaFull>;
export type OptionsSchemaMeta = Record<string, unknown>;
export declare const CompetitorRequestSchemaMap: () => ZodMetaMap<OptionsSchemaMeta>;
export declare const CompetitorRequestSchema: any;
export declare const CompetitorUISchema: Record<string, unknown>;
export type LocationType = z.infer<typeof LocationSchema>;
export type CompetitorRequest = z.infer<typeof CompetitorRequestSchema>;
