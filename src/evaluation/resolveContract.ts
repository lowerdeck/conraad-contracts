import { applyEdits, ContractEdit } from '../edits'
import {
  Conditional,
  ConditionalBody,
  ContractSection,
  ContractStructure,
  Each,
  form,
  Form,
  HeaderFooter,
  ListItem,
  RichText,
  partiesBody,
} from '../structure'
import { ContractEvaluator, InterpolationResult } from './ContractEvaluator'
import { isRequiredValue } from './unfilled'
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
    /** For `unfilled`, the label of what's missing. */
    text:   string
    status: 'value' | 'missing' | 'unfilled' | 'error'
  }
}

export const interpolatedNodeType = 'interpolated'

export const defaultInterpolationPlaceholder = '________'

/**
 * What an interpolation reads like, or `null` if it's left out. A required value that is missing is `unfilled`, unless
 * the template asks for a placeholder to fill in by hand.
 */
export function interpolatedNode(result: InterpolationResult, attrs: InterpolationAttrs, options: FormatOptions, unfilledLabel: string | null = null): InterpolatedNode | null {
  const node = (text: string, status: InterpolatedNode['attrs']['status']): InterpolatedNode => ({
    type:  interpolatedNodeType,
    attrs: {text, status},
  })

  switch (result.type) {
  case 'value':
    return node(formatValue(result.value, options), 'value')
  case 'missing':
    if (attrs.empty === 'placeholder') { return node(attrs.placeholder ?? defaultInterpolationPlaceholder, 'missing') }
    return unfilledLabel == null ? null : node(unfilledLabel, 'unfilled')
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
    private readonly suffix: string = '',
  ) {}

  private form = form.parse({})

  public resolve(structure: ContractStructure): ContractStructure {
    this.form = structure.form
    const attachments = structure.attachments.filter(it => this.visible(it.$if))

    return {
      sections: structure.sections.flatMap(it => this.repeated(it, (resolver, id) => resolver.section(it, id))),

      numberings:           structure.numberings,
      form:                 form.parse({}),
      header:               this.headerFooter(structure.header),
      footer:               this.headerFooter(structure.footer),
      attachments:          attachments.map(({$if, ...attachment}) => attachment),
      attachment_numbering: structure.attachment_numbering,
    }
  }

  /**
   * Whatever is visible of something that may repeat: once for every item it repeats for, each with its own ID and
   * resolved with its own item in scope.
   */
  private repeated<T extends Repeatable, R>(item: T, resolve: (resolver: Resolver, id: string) => R): R[] {
    const instances = this.evaluator.instances(item.$each)

    return instances.flatMap((evaluator, index) => {
      const resolver = item.$each == null ? this : this.instance(evaluator, index)
      if (!resolver.visible(item.$if)) { return [] }
      return [resolve(resolver, item.id + resolver.suffix)]
    })
  }

  // What's inside a repetition gets the same suffix to its ID, as it's in the contract more than once as well.
  private instance(evaluator: ContractEvaluator, index: number): Resolver {
    const resolver = new Resolver(evaluator, this.options, Each.instanceId(this.suffix, index))
    resolver.form = this.form
    return resolver
  }

  private section(section: ContractSection, id: string): ContractSection {
    const common = {
      id,
      name:      section.name,
      numbering: section.numbering,
      ...this.required(section.required),
    }

    switch (section.type) {
    case 'text':
      return {...common, type: 'text', body: this.richText(section.body)}

    case 'parties':
      return {...common, type: 'text', body: this.richText(partiesBody(section, this.evaluator.employmentType()))}

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
        items:     section.items.flatMap(it => this.repeated(it, (resolver, id) => ({
          id,
          term: it.term,
          body: resolver.richText(it.body),
          ...this.required(it.required),
        }))),
      }

    case 'signature':
      return {
        ...common,
        type:      'signature',
        preamble:  this.body(section.preamble),
        postamble: this.body(section.postamble),
        parties:   section.parties.filter(it => this.visible(it.$if)).map(it => ({
          id:      it.id + this.suffix,
          label:   it.label,
          details: this.richText(it.details),
          ...this.required(it.required),
        })),
      }
    }
  }

  private listItems(items: ListItem[]): ListItem[] {
    return items.flatMap(it => this.repeated(it, (resolver, id) => ({
      id,
      text:  resolver.richText(it.text),
      items: resolver.listItems(it.items ?? []),
      ...this.required(it.required),
    })))
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
    const expression = attrs.expression ?? ''
    const result = this.evaluator.interpolate(expression)
    return interpolatedNode(result, attrs, this.options, this.unfilledLabel(expression))
  }

  // Fields are known by their title. What's known from the assignment is labeled by whoever shows it.
  private unfilledLabel(expression: string): string | null {
    if (!isRequiredValue(expression, this.form)) { return null }
    return Form.variables(this.form).find(it => it.name === expression.trim())?.title ?? expression.trim()
  }

  // #endregion

}

interface Repeatable {
  id:     string
  $if?:   Conditional
  $each?: Each
}

interface RichTextNode {
  type?:    string
  attrs?:   Record<string, any>
  content?: RichTextNode[]
}
