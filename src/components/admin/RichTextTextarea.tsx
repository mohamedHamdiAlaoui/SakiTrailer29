import type { FocusEventHandler } from "react"
import { useRef } from "react"
import { Bold, Italic, List, ListOrdered, Pilcrow, Underline } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface RichTextTextareaProps {
  id: string
  name: string
  label: string
  value: string
  rows?: number
  placeholder?: string
  disabled?: boolean
  error?: string
  onBlur?: FocusEventHandler<HTMLTextAreaElement>
  onChange: (value: string) => void
}

type InsertResult = {
  text: string
  selectionStart: number
  selectionEnd: number
}

function wrapSelection(
  tagName: "strong" | "em" | "u" | "p",
  selectedText: string,
  placeholder: string,
  start: number
): InsertResult {
  const openingTag = `<${tagName}>`
  const closingTag = `</${tagName}>`
  const content = selectedText || placeholder

  return {
    text: `${openingTag}${content}${closingTag}`,
    selectionStart: start + openingTag.length,
    selectionEnd: start + openingTag.length + content.length,
  }
}

function createList(tagName: "ul" | "ol", selectedText: string, start: number): InsertResult {
  const items = (selectedText || "Item 1\nItem 2")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const listText = `<${tagName}>\n${items.map((item) => `  <li>${item}</li>`).join("\n")}\n</${tagName}>`

  return {
    text: listText,
    selectionStart: start,
    selectionEnd: start + listText.length,
  }
}

export default function RichTextTextarea({
  id,
  name,
  label,
  value,
  rows = 5,
  placeholder,
  disabled,
  error,
  onBlur,
  onChange,
}: RichTextTextareaProps) {
  const { t } = useTranslation()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const toolbarActions = [
    {
      key: "bold",
      label: t("admin.form.richText.bold"),
      icon: Bold,
      apply: (selectedText: string, start: number) => wrapSelection("strong", selectedText, t("admin.form.richText.boldPlaceholder"), start),
    },
    {
      key: "italic",
      label: t("admin.form.richText.italic"),
      icon: Italic,
      apply: (selectedText: string, start: number) => wrapSelection("em", selectedText, t("admin.form.richText.italicPlaceholder"), start),
    },
    {
      key: "underline",
      label: t("admin.form.richText.underline"),
      icon: Underline,
      apply: (selectedText: string, start: number) => wrapSelection("u", selectedText, t("admin.form.richText.underlinePlaceholder"), start),
    },
    {
      key: "bulletList",
      label: t("admin.form.richText.bulletList"),
      icon: List,
      apply: (selectedText: string, start: number) => createList("ul", selectedText, start),
    },
    {
      key: "numberedList",
      label: t("admin.form.richText.numberedList"),
      icon: ListOrdered,
      apply: (selectedText: string, start: number) => createList("ol", selectedText, start),
    },
    {
      key: "paragraph",
      label: t("admin.form.richText.paragraph"),
      icon: Pilcrow,
      apply: (selectedText: string, start: number) => wrapSelection("p", selectedText, t("admin.form.richText.paragraphPlaceholder"), start),
    },
  ]

  const handleToolbarAction = (action: (selectedText: string, start: number) => InsertResult) => {
    const textarea = textareaRef.current

    if (!textarea || disabled) {
      return
    }

    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const selectedText = value.slice(selectionStart, selectionEnd)
    const before = value.slice(0, selectionStart)
    const after = value.slice(selectionEnd)
    const result = action(selectedText, selectionStart)
    const nextValue = `${before}${result.text}${after}`

    onChange(nextValue)

    requestAnimationFrame(() => {
      const updatedTextarea = textareaRef.current
      if (!updatedTextarea) return
      updatedTextarea.focus()
      updatedTextarea.setSelectionRange(result.selectionStart, result.selectionEnd)
    })
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium leading-none text-slate-900">
        {label}
      </label>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="mr-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {t("admin.form.richText.toolbar")}
          </p>
          {toolbarActions.map((tool) => (
            <Button
              key={tool.key}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleToolbarAction(tool.apply)}
              disabled={disabled}
              aria-label={tool.label}
              title={tool.label}
              className="h-9 px-3"
            >
              <tool.icon className="size-4" />
            </Button>
          ))}
        </div>
        <Textarea
          ref={textareaRef}
          id={id}
          name={name}
          rows={rows}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          className="bg-white"
        />
        <p className="mt-2 text-xs text-slate-500">{t("admin.form.richText.help")}</p>
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  )
}
