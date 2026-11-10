import { z } from 'zod'
import { EmploymentType, isEmploymentType } from '../employment-type'
import { contractSectionCommon, richText, RichText } from './common'

/**
 * Who enter into the contract: always the producer first, and the contractor second. Their numbers are all that's
 * fixed, and all texts start out with the details of the organisation and the contractor's profile. The contractor
 * has a text for each employment type, of which `contractor` is the one for a natural person (and the fallback).
 */
export const partiesSection = z.object({
  ...contractSectionCommon,
  type:                    z.literal('parties').default('parties'),
  preamble:                richText().default(defaultPreamble),
  producer:                richText().default(defaultProducer),
  infix:                   richText().default(defaultInfix),
  contractor_legal_entity: richText().default(defaultContractorLegalEntity),
  contractor:              richText().default(defaultContractor),
  contractor_payrolled:    richText().default(defaultContractorPayrolled),
  postamble:               richText().default(defaultPostamble),
})

export type PartiesSection = z.output<typeof partiesSection>

export const partiesContractorFields = {
  legal_entity:   'contractor_legal_entity',
  natural_person: 'contractor',
  payrolled:      'contractor_payrolled',
} as const satisfies Record<EmploymentType, keyof PartiesSection>

export type PartiesContractorField = typeof partiesContractorFields[EmploymentType]

/**
 * The text of the section for a contractor of the given employment type, which reads like any other text from there
 * on. Without a known employment type, it reads as for a natural person.
 */
export function partiesBody(section: PartiesSection, employmentType: unknown): RichText {
  const field = partiesContractorFields[isEmploymentType(employmentType) ? employmentType : 'natural_person']

  return {
    type:    'doc',
    content: [
      ...section.preamble?.content ?? [],
      party(section.producer, 1),
      ...section.infix?.content ?? [],
      party(section[field], 2),
      ...section.postamble?.content ?? [],
    ],
  }
}

/**
 * All texts of the section, including those for each employment type.
 */
export function partiesTexts(section: PartiesSection): RichText[] {
  return [
    section.preamble,
    section.producer,
    section.infix,
    ...Object.values(partiesContractorFields).map(field => section[field]),
    section.postamble,
  ]
}

function party(text: RichText, number: number) {
  return {
    type:    'orderedList',
    attrs:   {start: number},
    content: [{type: 'listItem', content: text?.content ?? [paragraph([])]}],
  }
}

function defaultPreamble(): RichText {
  return doc([
    paragraph([{type: 'text', text: 'DE ONDERGETEKENDEN:', marks: [{type: 'bold'}]}]),
  ])
}

function defaultProducer(): RichText {
  return doc([
    paragraph([
      expression('organisation.name', true),
      text(', gevestigd te '),
      expression('organisation.city'),
      text(' ('),
      expression('organisation.postal_code'),
      text(') aan de '),
      expression('organisation.address_line_1'),
      text(`, ${tradeRegister} `),
      expression('organisation.kvk_nummer'),
      text(', hierbij rechtsgeldig vertegenwoordigd door '),
      expression('user.full_name'),
      text(', hierna te noemen “Opdrachtgever”;'),
    ]),
  ])
}

function defaultInfix(): RichText {
  return doc([
    paragraph([text('en')]),
  ])
}

function defaultContractorLegalEntity(): RichText {
  return doc([
    paragraph([
      expression('contractor.profile.business_name', true),
      text(', gevestigd te '),
      expression('contractor.profile.city'),
      text(' ('),
      expression('contractor.profile.postal_code'),
      text(') aan de '),
      expression('contractor.profile.address_line_1'),
      text(`, ${tradeRegister} `),
      expression('contractor.profile.kvk_nummer'),
      text(', hierbij rechtsgeldig vertegenwoordigd door '),
      expression('contractor.user.full_name'),
      text(', hierna te noemen “Opdrachtnemer”,'),
    ]),
  ])
}

function defaultContractor(): RichText {
  return doc([
    paragraph([
      expression('contractor.user.full_name', true),
      text(', wonende te '),
      expression('contractor.profile.city'),
      text(', '),
      expression('contractor.profile.address_line_1'),
      text(', '),
      expression('contractor.profile.postal_code'),
      text(', geboren op '),
      expression('contractor.profile.date_of_birth'),
      text(`, ${tradeRegister} `),
      expression('contractor.profile.kvk_nummer'),
      text(', hierna te noemen “Opdrachtnemer”,'),
    ]),
  ])
}

function defaultContractorPayrolled(): RichText {
  return doc([
    paragraph([
      expression('contractor.user.full_name', true),
      text(', wonende te '),
      expression('contractor.profile.city'),
      text(', '),
      expression('contractor.profile.address_line_1'),
      text(', '),
      expression('contractor.profile.postal_code'),
      text(', geboren op '),
      expression('contractor.profile.date_of_birth'),
      text(', verloond via '),
      expression('contractor.profile.business_name'),
      text(', hierna te noemen “Opdrachtnemer”,'),
    ]),
  ])
}

function defaultPostamble(): RichText {
  return doc([
    paragraph([text('hierna gezamenlijk te noemen “Partijen”.')]),
    paragraph([text('Daar waar in deze overeenkomst wordt gerefereerd aan hij/hem wordt tevens bedoeld zij/haar of hen.')]),
  ])
}

function doc(content: unknown[]) {
  return {type: 'doc', content}
}

function paragraph(content: unknown[]) {
  return {type: 'paragraph', content}
}

function text(value: string) {
  return {type: 'text', text: value}
}

function expression(path: string, bold: boolean = false) {
  return {
    type:  'expression',
    attrs: {expression: path},
    ...bold ? {marks: [{type: 'bold'}]} : {},
  }
}

const tradeRegister = 'ingeschreven in het Handelsregister van de Kamer van Koophandel onder nummer'
