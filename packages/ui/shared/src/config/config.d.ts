export interface AppConfig {
    site:              Site;
    i18n:              I18N;
    cad:               Cad;
    core:              Core;
    footer_left:       FooterEmail[];
    footer_email:      FooterEmail[];
    email:             Email;
    footer_right:      any[];
    settings:          Settings;
    params:            Params;
    navigation:        Navigation;
    navigation_button: NavigationButton;
    ecommerce:         Ecommerce;
    impressum:         Impressum;
    metadata:          Metadata;
    shopify:           Shopify;
    pages:             Pages;
    dev:               Dev;
    features:          { [key: string]: boolean };
    retail:            Retail;
    osrl:              Osrl;
    products:          Products;
    defaults:          Defaults;
    assets:            Assets;
    optimization:      Optimization;
}

export interface Assets {
    local:      boolean;
    glob:       string;
    cad_url:    string;
    url:        string;
    item_url_r: string;
    item_url:   string;
}

export interface Cad {
    cache:                 boolean;
    export_configurations: boolean;
    export_sub_components: boolean;
    renderer:              string;
    renderer_view:         string;
    renderer_quality:      number;
    extensions:            string[];
    model_ext:             string;
    default_configuration: string;
    main_match:            string;
    cam_main_match:        string;
}

export interface Core {
    logging_namespace: string;
    translate_content: boolean;
    languages:         string[];
    languages_prod:    string[];
    rtl_languages:     string[];
    osr_root:          string;
}

export interface Defaults {
    image_url: string;
    license:   string;
    contact:   string;
}

export interface Dev {
    file_server: string;
}

export interface Ecommerce {
    brand:          string;
    currencySymbol: string;
    currencyCode:   string;
}

export interface Email {
    languages: string[];
}

export interface FooterEmail {
    href: string;
    text: string;
}

export interface I18N {
    store:           string;
    cache:           boolean;
    source_language: string;
    asset_path:      string;
}

export interface Impressum {
    company:             string;
    representative:      string;
    address:             string;
    email:               string;
    phone:               string;
    vat_id:              string;
    register:            string;
    responsible_content: string;
}

export interface Metadata {
    country:     string;
    city:        string;
    author:      string;
    author_bio:  string;
    author_url:  string;
    image:       string;
    description: string;
    keywords:    string;
}

export interface Navigation {
    top: FooterEmail[];
}

export interface NavigationButton {
    enable: boolean;
    label:  string;
    link:   string;
}

export interface Optimization {
    image_settings: ImageSettings;
    presets:        Presets;
}

export interface ImageSettings {
    gallery:  Gallery;
    lightbox: Gallery;
}

export interface Gallery {
    show_title:       boolean;
    show_description: boolean;
    sizes_thumb:      string;
    sizes_large:      string;
    sizes_regular:    string;
}

export interface Presets {
    slow:   Fast;
    medium: Fast;
    fast:   Fast;
}

export interface Fast {
    sizes_medium: string;
    sizes_thumbs: string;
    sizes_large:  string;
}

export interface Osrl {
    env:             string;
    env_dev:         string;
    module_name:     string;
    lang_flavor:     string;
    product_profile: string;
}

export interface Pages {
    home: Home;
}

export interface Home {
    hero:  string;
    _blog: Blog;
}

export interface Blog {
    store: string;
}

export interface Params {
    contact_form_action: string;
    copyright:           string;
}

export interface Products {
    root:            string;
    howto_migration: string;
    glob:            string;
    enabled:         string;
}

export interface Retail {
    products:                      string;
    library_branch:                string;
    projects_branch:               string;
    compile_cache:                 boolean;
    media_cache:                   boolean;
    log_level_i18n_product_assets: string;
    convert_product_media:         boolean;
    translate_product_assets:      boolean;
    populate_product_defaults:     boolean;
}

export interface Settings {
    search:         boolean;
    account:        boolean;
    sticky_header:  boolean;
    theme_switcher: boolean;
    default_theme:  string;
}

export interface Shopify {
    currencySymbol: string;
    currencyCode:   string;
    collections:    Collections;
}

export interface Collections {
    hero_slider:       string;
    featured_products: string;
}

export interface Site {
    title:          string;
    base_url:       string;
    canonical_url:  string;
    description:    string;
    base_path:      string;
    trailing_slash: boolean;
    favicon:        string;
    logo:           string;
    logo_darkmode:  string;
    logo_width:     string;
    logo_height:    string;
    logo_text:      string;
    image:          Image;
}

export interface Image {
    default: string;
    error:   string;
    alt:     string;
}
