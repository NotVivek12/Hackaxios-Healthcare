"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg",
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                gradient: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg",
                glassmorphism: "glass text-primary shadow-lg border border-white/20 backdrop-blur-md",
                neon: "bg-black border border-primary text-primary hover:text-white hover:bg-primary hover:glow",
                pill: "rounded-full bg-white text-primary shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-12 rounded-md px-8 text-base",
                xl: "h-14 rounded-md px-10 text-lg",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    glow?: boolean;
    animated?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, glow = false, animated = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";

        if (animated) {
            return (
                <div className={cn("transition-transform duration-200 ease-in-out hover:scale-105 active:scale-95", glow ? 'glow' : '')}>
                    <Comp
                        className={cn(
                            buttonVariants({ variant, size, className }),
                            glow ? 'shadow-glow' : ''
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
            );
        }

        return (
            <Comp
                className={cn(
                    buttonVariants({ variant, size, className }),
                    glow ? 'shadow-glow' : ''
                )}
                ref={ref}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";

export { Button, buttonVariants };