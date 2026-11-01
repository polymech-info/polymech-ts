import { CartItem as CartItemType } from './types';
export interface CartItemProps {
    item: CartItemType;
    /** Optional extra class names for the root element. */
    className?: string;
}
/** A single cart row — thumbnail, title, quantity stepper, line total, remove. */
export declare function CartItemRow({ item, className }: CartItemProps): import("react/jsx-runtime").JSX.Element;
