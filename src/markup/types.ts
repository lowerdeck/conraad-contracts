/**
 * A node of rich text, as TipTap stores it.
 */
export interface RichTextNode {
  type:     string
  attrs?:   Record<string, any>
  content?: RichTextNode[]
  marks?:   Array<{type: string, attrs?: Record<string, any>}>
  text?:    string
}
