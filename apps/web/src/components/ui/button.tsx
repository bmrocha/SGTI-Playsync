import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    
    // Variant styles aligned with globals.css brand colors
    const variants = {
      default: "bg-brand-main text-white hover:opacity-90 shadow-md",
      destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
      outline: "border border-border bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-text-dark",
      secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-white",
      ghost: "hover:bg-slate-100 dark:hover:bg-white/5 text-text-dark",
      link: "text-brand-main underline-offset-4 hover:underline",
    }
    
    // Size styles
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    }
    
    // Base styles
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-main focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

    const variantClasses = variants[variant] || variants.default
    const sizeClasses = sizes[size] || sizes.default

    return (
      <button
        className={cn(baseStyles, variantClasses, sizeClasses, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
