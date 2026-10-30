import { applyEdits, ContractEdit } from '../edits'
import {
  Conditional,
  ConditionalBody,
  ContractSection,
  ContractStructure,
  form,
  HeaderFooter,
  ListItem,
  RichText,
  partiesBody,
} from '../structure'
import { ContractEvaluator, InterpolationResult } from './ContractEvaluator'
import { formatValue, FormatOptions } from './values'

/**
 * The contract as it reads: the structure of its template with its edits applied, without anything that is hidden,
 * and with every interpolation replaced by its text. Nothing is left to evaluate, so it holds no form, conditions or
 * expressions either.
 */
export function resolveContract(structure: ContractStructure, edits: ContractEdit[], evaluator: ContractEvaluator, options: ResolveOptions): ContractStructure {
  const resolver = new Resolver(evaluator, options)
  return resolver.resolve({...structure, sections: applyEdits(structure.sections, edits).sections})
}

export interface ResolveOptions extends FormatOptions {
  /** Whether sections and items keep their `required` flag, for whoever edits the contract. */
  keepRequired?: boolean
}

/**
 * Replaces an interpolation in rich text, and reads like its text.
 */
export interface InterpolatedNode {
  type:  typeof interpolatedNodeType
  attrs: {
    text:   string
    status: 'value' | 'missing' | 'error'
  }
}

export const interpolatedNodeType = 'interpolated'

export const defaultInterpolationPlaceholder = '________'

/**
 * What an interpolation reads like, or `null` if it's left out.
 */
export function interpolatedNode(result: InterpolationResult, attrs: InterpolationAttrs, options: FormatOptions): InterpolatedNode | null {
  const node = (text: string, status: InterpolatedNode['attrs']['status']): InterpolatedNode => ({
    type:  interpolatedNodeType,
    attrs: {text, status},
  })

  switch (result.type) {
  case 'value':
    return node(formatValue(result.value, options), 'value')
  case 'missing':
    if (attrs.empty !== 'placeholder') { return null }
    return node(attrs.placeholder ?? defaultInterpolationPlaceholder, 'missing')
  case 'error':
    return node(`{{${result.expression}}}`, 'error')
  }
}

export interface InterpolationAttrs {
  empty?:       'hide' | 'placeholder'
  placeholder?: string | null
}

class Resolver {

  constructor(
    private readonly evaluator: ContractEvaluator,
    private readonly options: ResolveOptions,
  ) {}

  public resolve(structure: ContractStructure): ContractStructure {
    const appendices = structure.appendices.filter(it => this.visible(it.$if))
    const appendixSections = new Set(appendices.map(it => it.section))
    const hiddenSections = new Set(
      structure.appendices.filter(it => it.type === 'section' && !appendixSections.has(it.section)).map(it => it.section),
    )

    return {
      sections: structure.sections
        .filter(it => this.visible(it.$if) && !hiddenSections.has(it.id))
        .map(it => this.section(it)),

      numberings:         structure.numberings,
      form:               form.parse({}),
      header:             this.headerFooter(structure.header),
      footer:             this.headerFooter(structure.footer),
      appendices:         appendices.map(({$if, ...appendix}) => appendix),
      appendix_numbering: structure.appendix_numbering,
    }
  }

  private section(section: ContractSection): ContractSection {
    const common = {
      id:        section.id,
      name:      section.name,
      numbering: section.numbering,
      ...this.required(section.required),
    }

    switch (section.type) {
    case 'text':
      return {...common, type: 'text', body: this.richText(section.body)}

    case 'parties':
      return {...common, type: 'text', body: this.richText(partiesBody(section))}

    case 'list':
      return {
        ...common,
        type:      'list',
        preamble:  this.body(section.preamble),
        postamble: this.body(section.postamble),
        items:     this.listItems(section.items),
      }

    case 'definition-list':
      return {
        ...common,
        type:      'definition-list',
        preamble:  this.body(section.preamble),
        postamble: this.body(section.postamble),
        items:     section.items.filter(it => this.visible(it.$if)).map(it => ({
          id:   it.id,
          term: it.term,
          body: this.richText(it.body),
          ...this.required(it.required),
        })),
      }

    case 'signature':
      return {
        ...common,
        type:      'signature',
        preamble:  this.body(section.preamble),
        postamble: this.body(section.postamble),
        parties:   section.parties.filter(it => this.visible(it.$if)).map(it => ({
          id:      it.id,
          label:   it.label,
          details: this.richText(it.details),
          ...this.required(it.required),
        })),
      }
    }
  }

  private listItems(items: ListItem[]): ListItem[] {
    return items.filter(it => this.visible(it.$if)).map(it => ({
      id:    it.id,
      text:  this.richText(it.text),
      items: this.listItems(it.items ?? []),
      ...this.required(it.required),
    }))
  }

  private body(body: ConditionalBody | undefined): ConditionalBody | undefined {
    if (body == null || !this.visible(body.$if)) { return undefined }
    return {text: this.richText(body.text)}
  }

  private headerFooter(headerFooter: HeaderFooter | undefined): HeaderFooter | undefined {
    if (headerFooter == null) { return undefined }
    return {...headerFooter, body: this.richText(headerFooter.body)}
  }

  private required(required: boolean | undefined) {
    return this.options.keepRequired && required ? {required} : {}
  }

  private visible(conditional: Conditional | undefined) {
    return this.evaluator.isVisible(conditional)
  }

  // #region Rich text

  private richText(content: RichText): RichText {
    if (content == null) { return content }
    return this.node(content) ?? null
  }

  private node(node: RichTextNode): RichTextNode | null {
    if (node.type === 'expression') {
      return this.interpolation(node.attrs ?? {})
    }
    if (node.content == null) { return node }

    return {
      ...node,
      content: node.content.map(it => this.node(it)).filter(it => it != null),
    }
  }

  private interpolation(attrs: Record<string, any>): InterpolatedNode | null {
    const result = this.evaluator.interpolate(attrs.expression ?? '')
    return interpolatedNode(result, attrs, this.options)
  }

  // #endregion

}

interface RichTextNode {
  type?:    string
  attrs?:   Record<string, any>
  content?: RichTextNode[]
}
