import { z } from 'zod'
import { appendix } from './appendix'
import { RichText } from './common'
import { DefinitionListItem, DefinitionListSection, definitionListSection } from './definition-list'
import { ListItem, ListSection, listSection } from './list'
import { textSection } from './text'
import { form } from './form'
import { headerFooter } from './header-footer'
import { numberings } from './numbering'
import { SignatureParty, SignatureSection, signatureSection } from './signature'

// @index
export * from './appendix'
export * from './common'
export * from './conditional'
export * from './definition-list'
export * from './form'
export * from './header-footer'
export * from './list'
export * from './numbering'
export * from './signature'
export * from './text'
export * from './variable'
// /index

// #region Section

export const contractSection = z.discriminatedUnion('type', [
  textSection,
  listSection,
  definitionListSection,
  signatureSection,
])

export type ContractSection = z.output<typeof contractSection>

export namespace ContractSection {

  export function empty(type: ContractSection['type'], name: string | null): ContractSection {
    switch (type) {
    case 'text':
      return textSection.parse({name})
    case 'list':
      return listSection.parse({name})
    case 'definition-list':
      return definitionListSection.parse({name})
    case 'signature':
      return signatureSection.parse({name})
    }
  }

  /**
   * All texts of a section.
   */
  export function texts(section: ContractSection): RichText[] {
    switch (section.type) {
    case 'text':
      return [section.body]
    case 'list':
      return [section.preamble?.text, section.postamble?.text, ...ListItem.flatten(section.items).map(it => it.item.text)]
    case 'definition-list':
      return [section.preamble?.text, section.postamble?.text, ...section.items.map(it => it.body)]
    case 'signature':
      return [section.preamble?.text, section.postamble?.text, ...section.parties.map(it => it.details)]
    }
  }

  /**
   * Finds a list item, definition or signing party by its ID, along with the section it's in.
   */
  export function findItem(sections: ContractSection[], id: string): SectionItemLocation | null {
    for (const section of sections) {
      switch (section.type) {
      case 'list': {
        const found = ListItem.flatten(section.items).find(it => it.item.id === id)
        if (found != null) { return {kind: 'list-item', section, item: found.item} }
        break
      }
      case 'definition-list': {
        const item = section.items.find(it => it.id === id)
        if (item != null) { return {kind: 'definition', section, item} }
        break
      }
      case 'signature': {
        const item = section.parties.find(it => it.id === id)
        if (item != null) { return {kind: 'party', section, item} }
        break
      }
      }
    }
    return null
  }

}

export type SectionItemLocation =
  | {kind: 'list-item', section: ListSection, item: ListItem}
  | {kind: 'definition', section: DefinitionListSection, item: DefinitionListItem}
  | {kind: 'party', section: SignatureSection, item: SignatureParty}

// #endregion

// #region Structure

export const contractStructure = z.object({
  sections:   z.array(contractSection).default([]),
  numberings: numberings.default({}),
  form:       form.default(() => form.parse({})),
  header:     headerFooter.optional(),
  footer:     headerFooter.optional(),

  appendices: z.array(appendix).default([]),

  /** The ID of the numbering that numbers the appendices, of which only the first level is used. */
  appendix_numbering: z.string().max(32).nullable().optional(),
})

export type ContractStructure = z.output<typeof contractStructure>


// #endregion