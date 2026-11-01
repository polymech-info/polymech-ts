//////////////////////////////////////////////////////////////
//
//  Keys
//
//////////////////////////////////////////////////////////////
//
//  Paths
//
export const SYNC_TRACK_FILENAME = 'discourse-sync.json';
export const OSR_CACHE_ROOT = '${OSR_CACHE}';
export const OSR_DISCOURSE_CACHE = '${OSR_CACHE}/discourse';
export const DISCOURSE_CATEGORY_CACHE = '${OSR_CACHE}/discourse/cats.json';
export const DISCOURSE_TOPICS_CACHE = '${OSR_CACHE}/discourse/topics.json';
export const DISCOURSE_TAGS_CACHE = '${OSR_CACHE}/discourse/tags.json';
export const DISCOURSE_USER_CACHE = '${OSR_CACHE}/discourse/users.json';
//////////////////////////////////////////////////////////////
//
//  OA - User Import
//
export const OA_DIRECTORY_OVERVIEW_TOPIC = 28873;
export const OA_USER_IMPORT_GROUP = 43;
export const KB_USERS = '${KB_ROOT}/static/users';
export const DATA_PATH = '${OSR_ROOT}/osr-directory/pp';
export const LATEST_TRACK = '${OSR_ROOT}/osr-directory/pp/merged.json';
export const LATEST_TEST = './latest_test.json';
export const FETCH_DUSERS = false;
export const F_USERS_NOW = './fusers.json';
export const F_USERS_ALL = './fusers-all.json';
export const DEFAULT_PASSWORD = () => '4g0&KPN$e*Un';
export const HOWTOS_ASSETS_URL = () => `https://kb.osr-plastic.org/howtos/`;
export const MACHINES_ASSETS_URL = () => `https://assets.osr-plastic.org/machines/`;
export const CAT_TEST = 65;
export const TAGS_TEST = 'plastic, meta';
export const DEFAULT_IMPORT_OWNER = 1;
//////////////////////////////////////////////////////////////
//
//  OA - Directory Import
//
export const D_ROOT_CAT = 97;
export const D_ROOT_AFRICA = 79;
export const D_ROOT_ASIA = 60;
export const D_ROOT_EUROPE = 59;
export const D_ROOT_AUSTRALIA = 76;
export const D_ROOT_NAMERICA = 101;
export const D_ROOT_SAMERICA = 102;
export const D_ROOT_OCEANIA = 103;
//////////////////////////////////////////////////////////////
//
//  OA - Howto Import
//
export const HT_CAT_ROOT = 54;
export const HT_CAT_GUIDES = 86;
export const HT_CAT_MACHINES = 87;
export const HT_CAT_PRODUCTS = 88;
export const HT_CAT_MOULDS = 89;
export const HT_CAT_IDS = {
    HT_CAT_ROOT,
    HT_CAT_GUIDES,
    HT_CAT_MACHINES,
    HT_CAT_PRODUCTS,
    HT_CAT_MOULDS
};
export const HT_CATS = {
    'Guides': HT_CAT_GUIDES,
    'Machines': HT_CAT_MACHINES,
    'Products': HT_CAT_PRODUCTS,
    'Moulds': HT_CAT_MOULDS
};
//////////////////////////////////////////////////////////////
//
//  OA - Library Import
//
export const MACHINE_CAT_INJECTION = 50;
export const MACHINE_CAT_EXTRUSION = 51;
export const MACHINE_CAT_SHREDDER = 52;
export const MACHINE_CAT_SHEETPRESS = 63;
export const MACHINE_CAT_3DPRINT = 70;
export const MACHINE_CAT_MOULDS = 71;
export const MACHINE_CAT_IDS = {
    MACHINE_CAT_INJECTION,
    MACHINE_CAT_EXTRUSION,
    MACHINE_CAT_SHREDDER,
    MACHINE_CAT_SHEETPRESS,
    MACHINE_CAT_3DPRINT,
    MACHINE_CAT_MOULDS
};
export const MACHINE_CATS = {
    'Injection': MACHINE_CAT_INJECTION,
    'Extrusion': MACHINE_CAT_EXTRUSION,
    'Sheetpress': MACHINE_CAT_SHEETPRESS,
    '3DPrint': MACHINE_CAT_3DPRINT,
    'Moulds': HT_CAT_MOULDS
};
//# sourceMappingURL=constants.js.map