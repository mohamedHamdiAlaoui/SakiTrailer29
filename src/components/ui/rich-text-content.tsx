import { cn } from "@/lib/utils"
import { sanitizeRichTextHtml } from "@/utils/rich-text"

interface RichTextContentProps {
  html?: string
  className?: string
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  const sanitizedHtml = sanitizeRichTextHtml(html)

  if (!sanitizedHtml) {
    return null
  }

  return (
    <div
      className={cn(
        "whitespace-pre-line text-sm leading-7 text-slate-700 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_u]:underline [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}
