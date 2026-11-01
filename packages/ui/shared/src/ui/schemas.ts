import { z } from 'zod/v4';

// =========================================
//  Utility Enums & Common Schemas
// =========================================

export const ContentDisplaySchema = z.enum(['below', 'overlay', 'overlay-always']);
export const ImageFitSchema = z.enum(['contain', 'cover']);

export const WidgetTypeSchema = z.enum([
    'html-widget',
    'photo-grid',
    'photo-card',
    'photo-grid-widget',
    'tabs-widget',
    'gallery-widget',
    'page-card',
    'markdown-text',
    'layout-container-widget',
    'file-browser',
    'video-banner',
    'menu-widget'
]);

export type WidgetType = z.infer<typeof WidgetTypeSchema>;

export const WidgetVariablesSchema = z.union([
    z.string(),
    z.record(z.string(), z.string())
]).optional().default({});

export type WidgetVariables = z.infer<typeof WidgetVariablesSchema>;

// =========================================
//  HTML Widget
// =========================================
export const HtmlWidgetSchema = z.object({
    content: z.string().default('<div>Hello World</div>'),
    variables: WidgetVariablesSchema, // JSON string or object
    className: z.string().optional().default(''),
});

export type HtmlWidgetProps = z.infer<typeof HtmlWidgetSchema>;


// =========================================
//  Photo Grid (Simple)
// =========================================
export const PhotoGridSchema = z.object({
    variables: WidgetVariablesSchema,
});

export type PhotoGridProps = z.infer<typeof PhotoGridSchema>;


// =========================================
//  Photo Card
// =========================================
export const PhotoCardWidgetSchema = z.object({
    pictureId: z.string().nullable().default(null),
    postId: z.string().nullable().optional().default(null),
    showHeader: z.boolean().default(true),
    showFooter: z.boolean().default(true),
    showAuthor: z.boolean().default(true),
    showActions: z.boolean().default(true),
    showTitle: z.boolean().default(true),
    showDescription: z.boolean().default(true),
    contentDisplay: ContentDisplaySchema.default('below'),
    imageFit: ImageFitSchema.default('cover'),
    variables: WidgetVariablesSchema,
});

export type PhotoCardWidgetProps = z.infer<typeof PhotoCardWidgetSchema>;


// =========================================
//  Photo Grid Widget (Configurable)
// =========================================
export const PhotoGridWidgetSchema = z.object({
    pictureIds: z.array(z.string()).default([]),
    columns: z.string().default('auto'),
    variables: WidgetVariablesSchema,
});

export type PhotoGridWidgetProps = z.infer<typeof PhotoGridWidgetSchema>;


// =========================================
//  Tabs Widget
// =========================================

export const TabItemSchema = z.object({
    id: z.string(),
    label: z.string(),
    layoutId: z.string(),
    layoutData: z.any().optional(), // PageLayout or equivalent
});

export const TabsWidgetSchema = z.object({
    tabs: z.array(TabItemSchema).default([]),
    orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
    tabBarPosition: z.enum(['top', 'bottom', 'left', 'right']).default('top'),
    tabBarClassName: z.string().optional().default(''),
    contentClassName: z.string().optional().default(''),
    variables: WidgetVariablesSchema,
});

export type TabsWidgetProps = z.infer<typeof TabsWidgetSchema>;


// =========================================
//  Gallery Widget
// =========================================
export const GalleryWidgetSchema = z.object({
    pictureIds: z.array(z.string()).default([]),
    thumbnailLayout: z.enum(['strip', 'grid']).default('strip'),
    imageFit: ImageFitSchema.default('cover'),
    thumbnailsPosition: z.enum(['bottom', 'top', 'left', 'right']).default('bottom'),
    thumbnailsOrientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
    zoomEnabled: z.boolean().default(false),
    showVersions: z.boolean().default(false),
    showTitle: z.boolean().default(false),
    showDescription: z.boolean().default(false),
    autoPlayVideos: z.boolean().default(false),
    thumbnailsClassName: z.string().optional().default(''),
    variables: WidgetVariablesSchema,
});

export type GalleryWidgetProps = z.infer<typeof GalleryWidgetSchema>;


// =========================================
//  Page Card Widget
// =========================================
export const PageCardWidgetSchema = z.object({
    pageId: z.string().nullable().default(null),
    showHeader: z.boolean().default(true),
    showFooter: z.boolean().default(true),
    showAuthor: z.boolean().default(true),
    showActions: z.boolean().default(true),
    showTitle: z.boolean().default(true),
    showDescription: z.boolean().default(false),
    contentDisplay: ContentDisplaySchema.default('below'),
    variables: WidgetVariablesSchema,
});

export type PageCardWidgetProps = z.infer<typeof PageCardWidgetSchema>;


// =========================================
//  Markdown Text Widget
// =========================================
export const MarkdownTextWidgetSchema = z.object({
    content: z.string().default(''),
    placeholder: z.string().default('Enter your text here...'),
    variables: WidgetVariablesSchema,
});

export type MarkdownTextWidgetProps = z.infer<typeof MarkdownTextWidgetSchema>;


// =========================================
//  Layout Container Widget
// =========================================
export const LayoutContainerWidgetSchema = z.object({
    nestedPageName: z.string().default('Nested Container'),
    showControls: z.boolean().default(true),
    // nestedPageId might be managed internally, but good to have in schema if it's persisted in props
    nestedPageId: z.string().optional(),
    variables: WidgetVariablesSchema,
});

export type LayoutContainerWidgetProps = z.infer<typeof LayoutContainerWidgetSchema>;

// =========================================
//  File Browser Widget
// =========================================
export const FileBrowserWidgetSchema = z.object({
    mount: z.string().default('test'),
    path: z.string().default('/'),
    glob: z.string().default('*.*'),
    mode: z.enum(['simple', 'advanced']).default('simple'),
    viewMode: z.enum(['list', 'thumbs', 'tree']).default('list'),
    sortBy: z.enum(['name', 'ext', 'date', 'type']).default('name'),
    splitSizeHorizontal: z.array(z.number()).optional(),
    splitSizeVertical: z.array(z.number()).optional(),
    showToolbar: z.boolean().default(true),
    canChangeMount: z.boolean().default(true),
    allowFileViewer: z.boolean().default(true),
    allowLightbox: z.boolean().default(true),
    allowDownload: z.boolean().default(true),
    allowPreview: z.boolean().default(false),
    jail: z.boolean().default(false),
    minHeight: z.string().optional().default('600px'),
    showStatusBar: z.boolean().optional().default(true),
    initialFile: z.string().optional(),
    searchQuery: z.string().optional(),
    variables: WidgetVariablesSchema,
});

export type FileBrowserWidgetProps = z.infer<typeof FileBrowserWidgetSchema>;


// =========================================
//  Video Banner Widget
// =========================================

export const VideoBannerButtonSchema = z.object({
    id: z.string(),
    label: z.string(),
    targetPageId: z.string().optional(),
    targetPageSlug: z.string().optional(),
    targetPageOwner: z.string().optional(),
    href: z.string().optional(),
});

export const VideoBannerWidgetSchema = z.object({
    videoId: z.string().nullable().default(null),
    posterImageId: z.string().nullable().default(null),
    backgroundImageId: z.string().nullable().default(null),
    heading: z.string().default(''),
    description: z.string().default(''),
    minHeight: z.number().default(500),
    overlayOpacity: z.enum(['light', 'medium', 'dark']).default('medium'),
    objectFit: ImageFitSchema.default('cover'),
    buttons: z.array(VideoBannerButtonSchema).default([]),
    variables: WidgetVariablesSchema,
});

export type VideoBannerWidgetProps = z.infer<typeof VideoBannerWidgetSchema>;


// =========================================
//  Menu Widget
// =========================================

export const MenuItemTypeSchema = z.enum(['custom', 'page', 'category', 'file']);

export const MenuItemSchema = z.object({
    id: z.string(),
    label: z.string(),
    type: MenuItemTypeSchema,
    href: z.string().optional(),
    targetPageId: z.string().optional(),
    targetPageSlug: z.string().optional(),
    targetPageOwner: z.string().optional(),
    categoryId: z.string().optional(),
    categorySlug: z.string().optional(),
    fileMount: z.string().optional(),
    filePath: z.string().optional(),
    openInNewTab: z.boolean().default(false),
});

export const MenuWidgetSizeSchema = z.enum(['sm', 'md', 'lg', 'xl']);

export const MenuWidgetAlignSchema = z.enum(['left', 'center', 'right']);

export const MenuWidgetVariantSchema = z.enum(['plain', 'bar', 'glass', 'pill', 'underline']);

export const MenuWidgetSpacingSchema = z.enum(['none', 'xs', 'sm', 'md', 'lg', 'xl']);

export const MenuWidgetBgSchema = z.enum([
    'none', 'custom',
    'muted', 'dark', 'primary', 'accent',
    'gradient-primary', 'gradient-dark', 'gradient-ocean',
    'gradient-sunset', 'gradient-forest', 'gradient-brand',
]);

export const MenuWidgetSchema = z.object({
    items: z.array(MenuItemSchema).default([]),
    orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
    size: MenuWidgetSizeSchema.default('md'),
    align: MenuWidgetAlignSchema.default('left'),
    variant: MenuWidgetVariantSchema.default('plain'),
    padding: MenuWidgetSpacingSchema.default('none'),
    margin: MenuWidgetSpacingSchema.default('none'),
    bg: MenuWidgetBgSchema.default('none'),
    bgFrom: z.string().default('#3b82f6'),
    bgTo: z.string().default('#8b5cf6'),
    variables: WidgetVariablesSchema,
});

export type MenuItem = z.infer<typeof MenuItemSchema>;
export type MenuWidgetProps = z.infer<typeof MenuWidgetSchema>;


// =========================================
//  Union of All Widget Props (Optional Helper)
// =========================================
// export const AnyWidgetPropsSchema = z.union([
//   HtmlWidgetSchema,
//   PhotoGridSchema,
//   PhotoCardWidgetSchema,
//   PhotoGridWidgetSchema,
//   TabsWidgetSchema,
//   GalleryWidgetSchema,
//   PageCardWidgetSchema,
//   MarkdownTextWidgetSchema,
//   LayoutContainerWidgetSchema
// ]);

// =========================================
//  Layout & Container Schemas
// =========================================

export const WidgetInstanceSchema = z.object({
    id: z.string(),
    widgetId: WidgetTypeSchema,
    props: z.record(z.string(), z.any()).optional(), // We could use z.union of all props, but z.record(z.any()) is safer for unknown widgets
    order: z.number().optional()
});

export type WidgetInstance = z.infer<typeof WidgetInstanceSchema>;

export const ContainerSettingsSchema = z.object({
    collapsible: z.boolean().optional(),
    collapsed: z.boolean().optional(),
    title: z.string().optional(),
    showTitle: z.boolean().optional()
});

export type ContainerSettings = z.infer<typeof ContainerSettingsSchema>;

// Recursive schema for Container (Container -> children -> Container)
export type LayoutContainer = {
    id: string;
    type: 'container';
    columns: number;
    gap: number;
    widgets: WidgetInstance[];
    children: LayoutContainer[];
    order?: number;
    settings?: ContainerSettings;
};

export const LayoutContainerSchema: z.ZodType<LayoutContainer> = z.lazy(() => z.object({
    id: z.string(),
    type: z.literal('container'),
    columns: z.number(),
    gap: z.number(),
    widgets: z.array(WidgetInstanceSchema),
    children: z.array(LayoutContainerSchema),
    order: z.number().optional(),
    settings: ContainerSettingsSchema.optional()
}));

export const PageLayoutSchema = z.object({
    id: z.string(),
    name: z.string(),
    containers: z.array(LayoutContainerSchema),
    createdAt: z.number(),
    updatedAt: z.number(),
    loadedBundles: z.array(z.string()).optional(),
    rootTemplate: z.string().optional()
});

export type PageLayout = z.infer<typeof PageLayoutSchema>;

export const RootLayoutDataSchema = z.object({
    pages: z.record(z.string(), PageLayoutSchema),
    version: z.string(),
    lastUpdated: z.number(),
});

export type RootLayoutData = z.infer<typeof RootLayoutDataSchema>;

/////////////////////////////////////////////////////////////////////////////////////

const PageBaseSchema = z.object({
    id: z.string().uuid().optional(),
    title: z.string().min(1).max(255),
    slug: z.string().min(1).max(255),
    owner: z.string().uuid(),
    content: RootLayoutDataSchema.loose().optional(), // Enforce RootLayout structure for new/updated pages
    is_public: z.boolean().optional(),
    visible: z.boolean().optional(),
    parent: z.string().uuid().nullable().optional(),
    meta: z.any().optional(), // JSONB
    created_at: z.string().optional(),
    updated_at: z.string().optional()
});

export const PageSchema = PageBaseSchema.extend({
    is_public: z.boolean().optional().default(false),
    visible: z.boolean().optional().default(true),
});

export const CreatePageSchema = PageSchema.omit({ id: true, created_at: true, updated_at: true });
export const UpdatePageSchema = PageBaseSchema.partial().omit({ id: true, owner: true, created_at: true, updated_at: true });

// --- User Page Details Schemas ---

export const UserProfileSchema = z.object({
    user_id: z.string().uuid(),
    username: z.string(),
    display_name: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
});

export const SimplePageSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    slug: z.string(),
    visible: z.boolean().optional(),
    is_public: z.boolean().optional(),
});

export const UserPageDetailsSchema = z.object({
    page: PageBaseSchema.extend({
        parent_page: z.object({
            title: z.string(),
            slug: z.string()
        }).nullable(),
        category_paths: z.array(z.array(z.any()))
    }),
    userProfile: UserProfileSchema.nullable(),
    childPages: z.array(SimplePageSchema)
});
