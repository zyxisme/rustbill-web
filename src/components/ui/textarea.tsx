import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-mute",
        "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
