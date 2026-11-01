// paths
export const BAZAR_SLUG = `bazar`;
export const CONFIG_FILE = 'config.json';
export const VENDOR_CONFIG = `${BAZAR_SLUG}/${CONFIG_FILE}`;
export const PRODUCT_CONFIG = (product_path) => `${product_path}/${CONFIG_FILE}`;

// template keys
export const PRODUCT_TEMPLATE = 'product';
export const VENDOR_TEMPLATE = 'vendor';

// config keys
export interface VendorConfig {
  vendor_name?: string;
}

export interface ProductConfig {
  vendor_name?: string;
}