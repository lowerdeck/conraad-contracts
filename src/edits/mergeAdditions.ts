import { cloneDeep } from 'lodash'
import { ContractSection } from '../structure'
import { ContractAddition } from './addition'
import { resolveAnchor } from './anchor'
import { findContainer } from './containers'

/**
 * Merges the additions of a contract into the sections of its template, in the order they were added, so that an
 * addition can be anchored to an earlier one.
 *
 * Conditions are not taken into account, which is what keeps additions around when the item they were added next to
 * is hidden: hiding it leaves them in place. When the section or item they were added to is hidden, they're hidden
 * along with it. Additions of which the parent is gone altogether (or no longer takes this type of addition) can't be
 * placed, and are returned as orphans.
 */
export function mergeAdditions(sections: ContractSection[], additions: ContractAddition[]): MergeResult {
  const merged = cloneDeep(sections)
  const orphans: ContractAddition[] = []

  for (const addition of additions) {
    const container = findContainer(merged, addition.anchor.parent)
    if (container == null || container.type !== addition.type) {
      orphans.push(addition)
      continue
    }

    const index = resolveAnchor(addition.anchor, container.children)
    container.children.splice(index, 0, cloneDeep(addition.item))
  }

  return {sections: merged, orphans}
}

export interface MergeResult {
  sections: ContractSection[]
  orphans:  ContractAddition[]
}
