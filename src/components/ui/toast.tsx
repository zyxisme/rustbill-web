import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "error" | "warning";
  onClose?: () => void;
}

const variantStyles: Record<NonNullable<ToastProps["variant"]>, string> = {
  default: "border-l-2 border-l-primary",
  success: "border-l-2 border-l-success",
  error: "border-l-2 border-l-error",
  warning: "border-l-2 border-l-warning",
};

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", onClose, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative w-80 rounded-lg border border-hairline bg-canvas-soft p-4 shadow-[0_0_40px_rgba(6,182,212,0.06)] hover:shadow-[0_0_40px_rgba(6,182,212,0.12)] transition-shadow",
          "animate-[toastSlideIn_0.3s_ease-out] data-[closed]:animate-[toastSlideOut_0.25s_ease-in]",
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">{children}</div>
          {onClose && (
            <button
              onClick={onClose}
              className={cn(
                "shrink-0 rounded-xs p-0.5 text-mute opacity-60 transition-opacity hover:opacity-100",
                "focus:outline-none focus:ring-1 focus:ring-primary",
              )}
            >
              <X size={14} />
              <span className="sr-only">Close</span>
            </button>
          )}
        </div>
      </div>
    );
  },
);
Toast.displayName = "Toast";

const ToastTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h4
    ref={ref}
    className={cn("text-sm font-semibold text-ink", className)}
    {...props}
  />
));
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-body mt-1", className)}
    {...props}
  />
));
ToastDescription.displayName = "ToastDescription";

export { Toast, ToastTitle, ToastDescription };
