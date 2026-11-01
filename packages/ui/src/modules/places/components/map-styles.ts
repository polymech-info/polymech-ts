// 2D base style — no terrain, no hillshade. Used as default to avoid
// redundant DEM tile fetches on every viewport change.
export const MAP_STYLE_OSM_2D = {
    version: 8 as const,
    sources: {
        osm: {
            type: 'raster' as const,
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap Contributors',
            maxzoom: 19
        }
    },
    layers: [
        { id: 'osm', type: 'raster' as const, source: 'osm' }
    ]
};

// 3D style — terrain + hillshade. Only used when user opts in.
// NOTE: previously had TWO sources (terrainSource + hillshadeSource) pointing
// to the same MapTiler URL, causing double tile fetches. Now merged into one.
export const MAP_STYLE_OSM_3D = {
    version: 8 as const,
    sources: {
        osm: {
            type: 'raster' as const,
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap Contributors',
            maxzoom: 19
        },
        terrainSource: {
            type: 'raster-dem' as const,
            url: 'https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=aQ5CJxgn3brYPrfV3ws9',
            tileSize: 256
        }
    },
    layers: [
        { id: 'osm', type: 'raster' as const, source: 'osm' },
        {
            id: 'hills', type: 'hillshade' as const, source: 'terrainSource',
            layout: { visibility: 'visible' as const },
            paint: { 'hillshade-shadow-color': '#473B24' }
        }
    ],
    terrain: { source: 'terrainSource', exaggeration: 1 },
    sky: {}
};

export const MAP_STYLES = {
    light: MAP_STYLE_OSM_2D,
    '3d': MAP_STYLE_OSM_3D,
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    osm_raster: MAP_STYLE_OSM_2D,
    vector_light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
};

export type MapStyleKey = keyof typeof MAP_STYLES;
