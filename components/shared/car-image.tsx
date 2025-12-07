"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { Car } from "lucide-react";

interface CarImageProps extends Omit<ImageProps, "onError"> {
    fallbackClassName?: string;
}

export function CarImage({
    src,
    alt,
    className,
    fallbackClassName,
    ...props
}: CarImageProps) {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    if (hasError || !src) {
        return (
            <div
                className={cn(
                    "flex items-center justify-center bg-muted",
                    props.fill ? "absolute inset-0" : "",
                    fallbackClassName || className
                )}
            >
                <Car className="size-12 text-muted-foreground/50" />
            </div>
        );
    }

    return (
        <>
            {isLoading && (
                <div
                    className={cn(
                        "flex items-center justify-center bg-muted animate-pulse",
                        props.fill ? "absolute inset-0" : ""
                    )}
                >
                    <Car className="size-12 text-muted-foreground/30" />
                </div>
            )}
            <Image
                src={src}
                alt={alt}
                className={cn(
                    className,
                    isLoading ? "opacity-0" : "opacity-100",
                    "transition-opacity duration-300"
                )}
                onError={() => setHasError(true)}
                onLoad={() => setIsLoading(false)}
                unoptimized
                {...props}
            />
        </>
    );
}
