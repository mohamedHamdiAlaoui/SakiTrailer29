const allowedTags = new Set(["STRONG", "B", "EM", "I", "U", "P", "BR", "UL", "OL", "LI"])

function decodeCommonEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

export function stripRichText(input?: string) {
  if (!input) return ""

  return decodeCommonEntities(
    input
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*<p>/gi, "\n\n")
      .replace(/<\/li>\s*<li>/gi, "\n")
      .replace(/<li>/gi, "• ")
      .replace(/<\/?(ul|ol|p)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function sanitizeRichTextHtml(input?: string) {
  if (!input) return ""

  if (typeof document === "undefined") {
    return stripRichText(input)
  }

  const template = document.createElement("template")
  template.innerHTML = input
  const output = document.createElement("div")

  const appendSanitizedChildren = (source: ParentNode, target: HTMLElement | DocumentFragment) => {
    source.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        target.appendChild(document.createTextNode(child.textContent ?? ""))
        return
      }

      if (child.nodeType !== Node.ELEMENT_NODE) {
        return
      }

      const element = child as HTMLElement
      const tagName = element.tagName.toUpperCase()

      if (!allowedTags.has(tagName)) {
        appendSanitizedChildren(element, target)
        return
      }

      const safeElement = document.createElement(tagName.toLowerCase())
      appendSanitizedChildren(element, safeElement)
      target.appendChild(safeElement)
    })
  }

  appendSanitizedChildren(template.content, output)
  return output.innerHTML
}
