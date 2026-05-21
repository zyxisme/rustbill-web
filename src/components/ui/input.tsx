import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-sm border border-hairline bg-canvas px-3 text-sm text-ink placeholder:text-mute",
          "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
