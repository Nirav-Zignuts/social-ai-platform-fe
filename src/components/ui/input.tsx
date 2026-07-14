import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-border-subtle bg-bg-base px-3 py-1 text-sm text-text-primary transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-text-secondary focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
