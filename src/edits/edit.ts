import { z } from 'zod'
import { ContractAddition, contractAddition } from './addition'
import { ContractRemoval, contractRemoval } from './removal'

/**
 * A change to a contract after it was drawn up from its template: a section or item that is added to it, or one of
 * the template's that is removed from it.
 */
export const contractEdit = z.discriminatedUnion('type', [
  ...contractAddition.options,
  contractRemoval,
])

export type ContractEdit = z.output<typeof contractEdit>

export namespace ContractEdit {

  export function isAddition(edit: ContractEdit): edit is ContractAddition {
    return edit.type !== 'removal'
  }

  export function isRemoval(edit: ContractEdit): edit is ContractRemoval {
    return edit.type === 'removal'
  }

}
