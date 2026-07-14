import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-text-secondary focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
