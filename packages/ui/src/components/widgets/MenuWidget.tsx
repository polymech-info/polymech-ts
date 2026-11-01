import React, { lazy, Suspense } from 'react';
import MenuWidgetView from './MenuWidgetView';

// Re-export types so existing consumers keep working
export type { MenuItemData, MenuWidgetViewProps } from './MenuWidgetView';
export type { MenuWidgetEditProps } from './MenuWidgetEdit';

// Lazy-load the heavy edit component (dnd-kit, PagePicker, CategoryManager, FileBrowser, etc.)
const MenuWidgetEdit = lazy(() => import('./MenuWidgetEdit'));

export interface MenuWidgetProps {
    items?: any[];
    orientation?: 'horizontal' | 'vertical';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    align?: 'left' | 'center' | 'right';
    variant?: 'plain' | 'bar' | 'glass' | 'pill' | 'underline';
    padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    bg?: 'none' | 'custom' | 'muted' | 'dark' | 'primary' | 'accent'
        | 'gradient-primary' | 'gradient-dark' | 'gradient-ocean'
        | 'gradient-sunset' | 'gradient-forest' | 'gradient-brand';
    bgFrom?: string;
    bgTo?: string;
    isEditMode?: boolean;
    onPropsChange?: (props: Record<string, any>) => void;
    [key: string]: any;
}

const MenuWidget: React.FC<MenuWidgetProps> = (props) => {
    if (!props.isEditMode) {
        return (
            <MenuWidgetView
                items={props.items}
                orientation={props.orientation}
                size={props.size}
                align={props.align}
                variant={props.variant}
                padding={props.padding}
                margin={props.margin}
                bg={props.bg}
                bgFrom={props.bgFrom}
                bgTo={props.bgTo}
            />
        );
    }

    return (
        <Suspense
            fallback={
                <MenuWidgetView
                    items={props.items}
                    orientation={props.orientation}
                    size={props.size}
                    align={props.align}
                    variant={props.variant}
                    padding={props.padding}
                    margin={props.margin}
                    bg={props.bg}
                    bgFrom={props.bgFrom}
                    bgTo={props.bgTo}
                />
            }
        >
            <MenuWidgetEdit {...props} />
        </Suspense>
    );
};

export default MenuWidget;
