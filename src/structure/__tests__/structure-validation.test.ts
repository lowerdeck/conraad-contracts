import { describe, expect, it } from 'vitest'
import { contractStructure } from '../index'
import { validateStructure } from '../structure-validation'

describe('validateStructure', () => {

  it('requires the document of an attachment of the template', () => {
    const structure = contractStructure.parse({attachments: [
      {id: 'terms', name: 'Voorwaarden', type: 'template'},
      {id: 'protocol', name: 'Protocol', type: 'template', document: '01a1a14c-8d43-7128-bfc5-fe2a231c37c0'},
    ]})

    expect(validateStructure(structure)).toEqual([
      {code: 'attachment_document_missing', severity: 'error', target: 'terms'},
    ])
  })

  it('needs no document for an attachment of the contract', () => {
    const structure = contractStructure.parse({attachments: [
      {id: 'schedule', name: 'Draaischema', type: 'contract', provider: 'contractor'},
    ]})
    expect(validateStructure(structure)).toEqual([])
  })

  it('warns about attachments without a name', () => {
    const structure = contractStructure.parse({attachments: [{id: 'schedule'}]})
    expect(validateStructure(structure)).toEqual([
      {code: 'attachment_unnamed', severity: 'warning', target: 'schedule'},
    ])
  })

})
