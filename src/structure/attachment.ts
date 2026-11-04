import { cloneDeep } from 'lodash'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { id } from './common'
import { conditional } from './conditional'

/**
 * A document that goes with contracts drawn up from the template. The template's attachments are one ordered list,
 * which determines their numbers. An attachment is either:
 *
 * - a document attached to the template, the same for every contract (`template`);
 * - or a document that is uploaded for each contract, by whom the template says (`contract`).
 */
export const attachment = z.object({
  id:   id(),
  name: z.string().min(1).max(255).nullable().default(null),
  $if:  conditional().optional(),
  type: attachmentType().default('contract'),

  /** The ID of the document attached to the template. */
  document: z.string().max(36).nullable().default(null),

  /** Who may upload the document of each contract. */
  provider: attachmentProvider().default('producer'),

  /** Whether a contract can be signed without it. */
  optional: z.boolean().default(false),
})

export function attachmentType() {
  return z.enum(['template', 'contract'])
}

export function attachmentProvider() {
  return z.enum(['producer', 'contractor', 'both'])
}

export type Attachment = z.output<typeof attachment>
export type AttachmentType = z.output<ReturnType<typeof attachmentType>>
export type AttachmentProvider = z.output<ReturnType<typeof attachmentProvider>>
export type AttachmentSide = 'producer' | 'contractor'

export namespace Attachment {

  export function empty(): Attachment {
    return attachment.parse({})
  }

  export function clone(item: Attachment, overrides: Partial<Attachment> = {}): Attachment {
    return {
      ...cloneDeep(item),
      id: nanoid(12),
      ...overrides,
    }
  }

  /** Whether the given side may upload the document of a contract. */
  export function canProvide(item: Attachment, side: AttachmentSide): boolean {
    if (item.type !== 'contract') { return false }
    return item.provider === 'both' || item.provider === side
  }

}
