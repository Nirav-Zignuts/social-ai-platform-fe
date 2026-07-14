import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color] duration-150 outline-none select-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-white hover:bg-accent-hover focus-visible:ring-accent",
        outline:
          "border-border-subtle bg-transparent text-text-primary hover:bg-bg-surface-hover",
        secondary:
          "bg-bg-surface-hover text-text-primary hover:bg-bg-surface-hover/80",
        ghost:
          "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary",
        destructive:
          "border border-status-rejected/30 bg-status-rejected/10 text-status-rejected hover:bg-status-rejected/20",
        link: "text-accent underline-offset-4 hover:text-accent-hover hover:underline",
      },
      size: {
        default: "h-9 gap-1.5 px-3",
        sm: "h-8 gap-1 px-2.5 text-[0.8125rem]",
        lg: "h-10 gap-2 px-4",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
