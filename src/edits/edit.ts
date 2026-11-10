import { z } from 'zod'
import { ContractAddition, contractAddition } from './addition'
import { ContractRemoval, contractRemoval } from './removal'

/**
 * A change to a contract after it was drawn up from its template: a section or item that is added to it, one of the
 * template's that is replaced by an editable copy, or one of the template's that is removed from it.
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

  export function isReplacement(edit: ContractEdit): edit is ContractAddition {
    return isAddition(edit) && edit.replaces === true
  }

  /** The ID of the section or item that is added, replaced or removed. */
  export function target(edit: ContractEdit): string {
    return isAddition(edit) ? edit.item.id : edit.target
  }

  export function isRemoval(edit: ContractEdit): edit is ContractRemoval {
    return edit.type === 'removal'
  }

}
