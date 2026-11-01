import { VariantProps } from 'class-variance-authority';
import * as React from "react";
declare const buttonVariants: (props?: {
    variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost";
    size?: "icon" | "default" | "sm" | "lg";
} & import('class-variance-authority/types').ClassProp) => string;
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
export { Button, buttonVariants };
