import * as path from 'path'
import { resolve } from '@plastichub/osr-commons'

export const OSR_ROOT = () => path.resolve(resolve("${OSR_ROOT}"))

// Grunt Commons
export const LOG_LEVEL_GRUNT = 'info'
// Supported languages
export const LANGUAGES = ['de']

// i18n constants
export const I18N_STORE = (root, lang) => `${root}/i18n-store/store-${lang}.json`
export const I18N_SOURCE_LANGUAGE = 'en'

// Product compiler
export const PRODUCT_BODY = `templates/shared/body.md`
export const PRODUCT_ROOT = () => path.resolve(resolve("${OSR_ROOT}/products"))
export const PRODUCT_CONFIG = (product) =>
  path.resolve(resolve("${OSR_ROOT}/products/${product}/config.json", false, { product }))
export const PRODUCT_DIR = (product) =>
  path.resolve(resolve("${OSR_ROOT}/products/${product}", false, { product }))
export const IS_DEV = true
export const OSRL_ENV = 'bazar-release'
export const OSRL_ENV_DEV = 'hugo-debug'
export const OSRL_ENVIRONMENT = IS_DEV ? OSRL_ENV_DEV : OSRL_ENV
export const PRODUCT_HUGO_TEMPLATE = './osr/hugo/root.html'
export const PRODUCTS_TARGET_SRC = './src/content/en/retail'

// OSRL - Language
export const OSRL_MODULE_NAME = 'osr-site'

// Task - Logging
export const TASK_LOG_DIRECTORY = './logs/'

// Task - Retail Config

export const RETAIL_DEFAULT_BRANCH = 'dev'
export const RETAIL_MEDIA_CACHE = true
export const RETAIL_LOG_LEVEL_I18N_PRODUCT_ASSETS = 'info'

export const ConvertProductMedia = true
export const TranslateProductAssets = true
export const PopulateProductDefaults = true

export const PRODUCT_TEMPLATE = './osr/bazar/root.html'
export const HTML_DEFAULT_PATH = 'resources/edrawings.html'

export const DEFAULT_CAD_CAM_EXPORT = '${SRC_DIR}/${SRC_NAME}.+(step)'
export const DEFAULT_CAD_EXPORT = '${SRC_DIR}/${SRC_NAME}.+(json|html|step|x_t)'
export const DEFAULT_CAD_EXPORT_CONFIGURATION = '${SRC_DIR}/${SRC_NAME}-${CONFIGURATION}.+(json|html|step|x_t)'
export const DEFAULT_CAD_EXPORT_MIN = '${SRC_DIR}/${SRC_NAME}.+(json)'
export const DEFAULT_CAD_EXPORT_MIN_CONFIGURATION = '${SRC_DIR}/${SRC_NAME}-${CONFIGURATION}.+(json)'

export const SYNC_PROFILE = '${OSR_ROOT}/osr-commons/profiles/.osr-sync-public.json'
export const PRODUCT_ROOT_REL = '${PRODUCT_ROOT}/products'
export const SYNC_TARGET = '${OSR_ROOT}/osr-machines/'

export const CAD_MAIN_MATCH = (product) => `${product}/cad*/**/*Global*.+(SLDASM)`
export const CAD_CAM_MAIN_MATCH = (product) => `${product}/cad*/**/*-CNC*.+(SLDASM)`

export const CAD_CACHE = false
export const CAD_EXPORT_CONFIGURATIONS = false
export const CAD_EXPORT_SUB_COMPONENTS = false
export const CAD_MODEL_FILE_PATH = (SOURCE, CONFIGURATION = '') =>
  SOURCE.replace('.json', `${CONFIGURATION ? '-' + CONFIGURATION : ''}.tree.json`)
export const CAD_DEFAULT_CONFIGURATION = 'Default'
export const CAD_RENDERER = 'solidworks'
export const CAD_RENDERER_VIEW = 'Render'
export const CAD_RENDERER_QUALITY = 1

////////////////////////////////////////////////////////////
//
//  Content Tasks

export const ENABLE_NEWSLETTER = true
export const ENABLE_MAIL = false

// newsletter
export const NEWSLETTER_ROOT = `company/new sletter/2024/08`
export const NEWSLETTER_LOG_LEVEL = 'debug'
export const NEWSLETTER_LANGUAGES = ['en']
export const NEWSLETTER_TEMPLATE_FILE = 'root.osr'
export const NEWSLETTER_SRC_FILE = 'mail.html'
export const NEWSLETTER_DST_DIR = '${OSR_ROOT}/products/products/assets/newsletter/'
export const NEWSLETTER_DST_FILE = '${prefix}_newsletter_${YYYY}-${MM}_${targetLanguage}.html'
export const NEWSLETTER_DEFAULT_ENV = 'hugo-release'
export const NEWSLETTER_DEBUG_PROFILE = 'hugo-debug'
export const NEWSLETTER_RELEASE_PROFILE = 'hugo-release'
export const NEWSLETTER_COMPILE_CACHE = false

// mail
export const MAIL_ROOT = `company/mail/2024/08`
export const MAIL_LOG_LEVEL = 'debug'
export const MAIL_CONTACTS_ROOT = () => `${PRODUCT_ROOT()}/company/campaign/contacts`
export const MAIL_ASSETS_ROOT = () => `${PRODUCT_ROOT()}/company/campaign/data`
export const MAIL_OUTPUT_DIR = '/products/assets/newsletter/mail/'
export const MAIL_OUTPUT_FILE_NAME = 'mail_2024_09'
export const MAIL_OUTPUT_FILE_NAME_PROD = `${MAIL_OUTPUT_FILE_NAME}_public`
export const MAIL_OUTPUT_FILE_EXT = '.html'
export const MAIL_PROFILE = "${OSR_ROOT}/osr-templates/osrl/.osrl.json"
export const MAIL_SRC_LANGUAGE = 'en'
export const MAIL_LANGUAGES = ['en', 'es']
export const MAIL_LANGUAGES_RELEASE = ['en', 'es', 'de', 'fr']
export const MAIL_ENV_DEV = 'hugo-debug'
export const MAIL_ENV_PROD = 'hugo-release'
export const MAIL_TEMPLATE = "./root.osr"
export const MAIL_SOURCE_FILE = "mail.html"
export const MAIL_COMPILE_CACHE = false
export const MAIL_I18N_CACHE = true
export const MAIL_SEND_INTERVAL = 1000
export const MAIL_DEFAULT_OUTPUT_PATH = "${SRC_DIR}/${SRC_NAME-0}-${DST_LANG}${SRC_EXT}"
//////////////////////////////////////////////////////
//
//  Store query templates
export const buildQuery = (typeFilter, emailRequired = true, geoFilter = {}, params = "", additionalFilter = "") => {
  const types = typeFilter || [
    "Carpenter",
    "Woodworker",
    "Furniture maker",
    "Cabinet maker",
    "Furniture manufacturer"
  ]
  const typeCondition = types.map(type => `@.type == "${type}"`).join(" || ")
  const emailCondition = emailRequired ? "&& @.email != null" : ""
  const geoConditions = Object.entries(geoFilter).map(([key, value]) => `&& @.geo.${key} == "${value}"`).join(" ")
  return `$[?(((${typeCondition}) ${emailCondition} ${geoConditions} ${additionalFilter}) ${params})]`
}

export const QUERY_TEMPLATES = {

}