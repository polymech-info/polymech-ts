import type { GalleryWidgetProps as GalleryWidgetSchemaProps } from '@polymech/shared';

/**
 * Full component props = schema-inferred data props + runtime props.
 */
export interface GalleryWidgetProps extends GalleryWidgetSchemaProps {
    onPropsChange?: (props: Record<string, any>) => void;
    isEditMode?: boolean;
    id?: string;
}
