import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "green" | "blue" | "amber" | "red" | "gray";
}

export function Badge({ className, variant = "gray", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-brand-100 text-brand-800": variant === "green",
          "bg-blue-100 text-blue-800": variant === "blue",
          "bg-amber-100 text-amber-800": variant === "amber",
          "bg-red-100 text-red-800": variant === "red",
          "bg-gray-100 text-gray-700": variant === "gray",
        },
        className
      )}
      {...props}
    />
  );
}
