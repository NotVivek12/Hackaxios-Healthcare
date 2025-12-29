"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Extended card props with animation and styling options
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    glass?: boolean;
    glassDark?: boolean;
    hover?: "lift" | "glow" | "border" | "none";
    animated?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, glass = false, glassDark = false, hover = "none", animated = false, ...props }, ref) => {
        const baseClasses = cn(
            "rounded-lg border bg-card text-card-foreground shadow-sm",
            glass ? "glass" : "",
            glassDark ? "glass-dark" : "",
            animated ? "animate-fade-in" : "",
            hover === "lift" ? "hover-lift transition-all duration-300" : "",
            hover === "glow" ? "hover:glow transition-all duration-300" : "",
            hover === "border" ? "hover:neon-border transition-all duration-300" : "",
            className
        );

        return (
            <div
                ref={ref}
                className={baseClasses}
                {...props}
            />
        );
    }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-2xl font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
