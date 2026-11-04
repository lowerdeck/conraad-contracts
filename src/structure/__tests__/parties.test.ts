import { describe, expect, it } from 'vitest'
import { richTextToMarkup } from '../../markup'
import { partiesBody, partiesSection } from '../parties'

describe('partiesBody', () => {

  const section = partiesSection.parse({id: 'parties', name: null})
  const markup = (employmentType: unknown) => richTextToMarkup(partiesBody(section, employmentType))

  it('uses the text for the employment type of the contractor', () => {
    expect(markup('legal_entity')).toContain('gevestigd te {{contractor.profile.city}}')
    expect(markup('legal_entity')).toContain('rechtsgeldig vertegenwoordigd door {{contractor.user.full_name}}')
    expect(markup('natural_person')).toContain('wonende te {{contractor.profile.city}}')
    expect(markup('natural_person')).not.toContain('verloond')
    expect(markup('payrolled')).toContain('verloond via {{contractor.profile.business_name}}')
  })

  it('reads as for a natural person without a known employment type', () => {
    expect(markup(null)).toEqual(markup('natural_person'))
    expect(markup('unknown')).toEqual(markup('natural_person'))
  })

})
