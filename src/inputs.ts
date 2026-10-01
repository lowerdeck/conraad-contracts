/**
 * The values that are known for every contract from its assignment, its production and role, and the contractor.
 * They're available in expressions by their full path, like `contractor.user.full_name`, so templates don't need
 * form fields for them.
 */
export const contractInputs: ContractInput[] = [
  {
    root:       'assignment',
    properties: [
      {path: 'title', type: 'text'},
      {path: 'description', type: 'text'},
      {path: 'start_date', type: 'date'},
      {path: 'end_date', type: 'date'},
      {path: 'contractor_consented_at', type: 'date'},
      {path: 'producer_accepted_at', type: 'date'},
    ],
  },
  {
    root:       'production',
    properties: [
      {path: 'title', type: 'text'},
      {path: 'description', type: 'text'},
      {path: 'season', type: 'text'},
      {path: 'episode_count', type: 'number'},
    ],
  },
  {
    root:       'role',
    properties: [
      {path: 'title', type: 'text'},
      {path: 'has_rubric', type: 'boolean'},
    ],
  },
  {
    root:       'contractor',
    properties: [
      {path: 'invite_email', type: 'text'},
      {path: 'user.first_name', type: 'text'},
      {path: 'user.last_name', type: 'text'},
      {path: 'user.full_name', type: 'text'},
      {path: 'profile.business_name', type: 'text'},
      {path: 'profile.address', type: 'text'},
      {path: 'profile.address_line_1', type: 'text'},
      {path: 'profile.address_line_2', type: 'text'},
      {path: 'profile.postal_code', type: 'text'},
      {path: 'profile.city', type: 'text'},
      {path: 'profile.country', type: 'text'},
      {path: 'profile.phone_number', type: 'text'},
      {path: 'profile.website_url', type: 'text'},
      {path: 'profile.kvk_nummer', type: 'text'},
      {path: 'profile.btw_nummer', type: 'text'},
      {path: 'profile.date_of_birth', type: 'date'},
    ],
  },
]

export type ContractInputRoot = 'assignment' | 'production' | 'role' | 'contractor'

export interface ContractInput {
  root:       ContractInputRoot
  properties: ContractInputProperty[]
}

export interface ContractInputProperty {
  /** Relative to the root, e.g. `profile.city` for `contractor.profile.city`. */
  path: string
  type: 'text' | 'number' | 'date' | 'boolean'
}

export namespace ContractInput {

  /** All inputs by their full path, like `contractor.profile.city`. */
  export function paths(): string[] {
    return contractInputs.flatMap(({root, properties}) => properties.map(it => `${root}.${it.path}`))
  }

  export function isRoot(name: string): name is ContractInputRoot {
    return contractInputs.some(it => it.root === name)
  }

}
