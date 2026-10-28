import { describe, expect, it } from 'vitest'
import { ConditionsPlacement, contractStructure } from '../structure'

describe('ConditionsPlacement', () => {

  const {sections} = contractStructure.parse({
    sections: [
      {id: 'a', type: 'text', body: null},
      {id: 'b', type: 'list'},
      {id: 's', type: 'signature'},
    ],
  })

  it('goes before the signatures by default', () => {
    expect(ConditionsPlacement.resolve(null, sections)).toEqual({position: 'before', section: 's'})
  })

  it('goes next to the section of the placement', () => {
    expect(ConditionsPlacement.resolve({position: 'after', section: 'a'}, sections)).toEqual({position: 'after', section: 'a'})
  })

  it('falls back to the default when the section is gone', () => {
    expect(ConditionsPlacement.resolve({position: 'after', section: 'x'}, sections)).toEqual({position: 'before', section: 's'})
  })

  it('goes after the last section without signatures', () => {
    expect(ConditionsPlacement.resolve(null, sections.slice(0, 2))).toEqual({position: 'after', section: 'b'})
  })

})
