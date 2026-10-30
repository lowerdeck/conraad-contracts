import { z } from 'zod'
import { contractSectionCommon, RichText } from './common'

export const producerPartyFields = ['address', 'kvk_nummer', 'representative'] as const
export const contractorPartyFields = ['business_name', 'address', 'date_of_birth', 'kvk_nummer', 'btw_nummer'] as const

/**
 * Who enter into the contract: always the producer first, and the contractor second. The text is fixed, and comes from
 * the organisation and the contractor's profile. The only choice is what is shown of them.
 */
export const partiesSection = z.object({
  ...contractSectionCommon,
  type:              z.literal('parties').default('parties'),
  producer_fields:   z.array(z.enum(producerPartyFields)).default(['address', 'kvk_nummer', 'representative']),
  contractor_fields: z.array(z.enum(contractorPartyFields)).default(['address', 'date_of_birth', 'kvk_nummer']),
})

export type PartiesSection = z.output<typeof partiesSection>
export type ProducerPartyField = typeof producerPartyFields[number]
export type ContractorPartyField = typeof contractorPartyFields[number]

/**
 * The text of the section, which reads like any other text from there on.
 */
export function partiesBody(section: PartiesSection): RichText {
  const producer = section.producer_fields
  const contractor = section.contractor_fields

  return {
    type:    'doc',
    content: [
      paragraph([{type: 'text', text: 'DE ONDERGETEKENDEN:', marks: [{type: 'bold'}]}]),
      party([
        expression('organisation.name', true),
        ...producer.includes('address') ? [
          text(', gevestigd te '),
          expression('organisation.city'),
          text(' ('),
          expression('organisation.postal_code'),
          text(') aan de '),
          expression('organisation.address_line_1'),
        ] : [],
        ...producer.includes('kvk_nummer') ? [
          text(`, ${tradeRegister} `),
          expression('organisation.kvk_nummer'),
        ] : [],
        ...producer.includes('representative') ? [
          text(', hierbij rechtsgeldig vertegenwoordigd door '),
          expression('organisation.representative'),
        ] : [],
        text(', hierna te noemen “Producent”;'),
      ]),
      paragraph([text('en')]),
      party([
        expression('contractor.user.full_name', true),
        ...contractor.includes('business_name') ? [
          text(', handelend onder de naam '),
          expression('contractor.profile.business_name'),
        ] : [],
        ...contractor.includes('address') ? [
          text(', wonende te '),
          expression('contractor.profile.city'),
          text(', '),
          expression('contractor.profile.address_line_1'),
          text(', '),
          expression('contractor.profile.postal_code'),
        ] : [],
        ...contractor.includes('date_of_birth') ? [
          text(', geboren op '),
          expression('contractor.profile.date_of_birth'),
        ] : [],
        ...contractor.includes('kvk_nummer') ? [
          text(`, ${tradeRegister} `),
          expression('contractor.profile.kvk_nummer'),
        ] : [],
        ...contractor.includes('btw_nummer') ? [
          text(', met btw-nummer '),
          expression('contractor.profile.btw_nummer'),
        ] : [],
        text(', hierna te noemen “Opdrachtnemer”,'),
      ]),
      paragraph([text('hierna gezamenlijk te noemen “Partijen”.')]),
      paragraph([text('Daar waar in deze overeenkomst en de Algemene Bepalingen wordt gerefereerd aan hij/hem wordt tevens bedoeld zij/haar of hen.')]),
    ],
  }
}

function party(content: unknown[]) {
  return {type: 'orderedList', content: [{type: 'listItem', content: [paragraph(content)]}]}
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
