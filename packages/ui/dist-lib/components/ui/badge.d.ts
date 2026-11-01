import { VariantProps } from 'class-variance-authority';
import * as React from "react";
declare const badgeVariants: (props?: {
    variant?: "default" | "destructive" | "outline" | "secondary";
} & import('class-variance-authority/types').ClassProp) => string;
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
}
declare function Badge({ className, variant, ...props }: BadgeProps): import("react/jsx-runtime").JSX.Element;
export { Badge, badgeVariants };
