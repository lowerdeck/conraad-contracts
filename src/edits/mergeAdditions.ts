import { cloneDeep } from 'lodash'
import { ContractSection } from '../structure'
import { ContractAddition } from './addition'
import { resolveAnchor } from './anchor'
import { Container, findContainer, locate } from './containers'
import { isRemovable } from './removable'

/**
 * Merges the additions of a contract into the sections of its template, in the order they were added, so that an
 * addition can be anchored to an earlier one.
 *
 * Conditions are not taken into account, which is what keeps additions around when the item they were added next to
 * is hidden: hiding it leaves them in place. When the section or item they were added to is hidden, they're hidden
 * along with it. Additions of which the parent is gone altogether (or no longer takes this type of addition) can't be
 * placed, and are returned as orphans.
 *
 * A replacement takes the place of what it replaces, as long as that may be removed. Otherwise it's an orphan, and
 * returned as invalid as well. When what it replaces is gone, it's placed like any other addition.
 */
export function mergeAdditions(sections: ContractSection[], additions: ContractAddition[]): MergeResult {
  const merged = cloneDeep(sections)
  const orphans: ContractAddition[] = []
  const invalid: ContractAddition[] = []

  for (const addition of additions) {
    const replaced = addition.replaces ? locate(merged, addition.item.id) : null
    if (replaced != null && replaced.container.type === addition.type) {
      if (isRemovable(merged, addition.item.id)) {
        replaceChild(replaced.container, replaced.index, addition)
      } else {
        orphans.push(addition)
        invalid.push(addition)
      }
      continue
    }

    const container = findContainer(merged, addition.anchor.parent)
    if (container == null || container.type !== addition.type) {
      orphans.push(addition)
      continue
    }

    const index = resolveAnchor(addition.anchor, container.children)
    container.children.splice(index, 0, cloneDeep(addition.item))
  }

  return {sections: merged, orphans, invalid}
}

export interface MergeResult {
  sections: ContractSection[]
  orphans:  ContractAddition[]

  /** Replacements of what may not be removed. */
  invalid: ContractAddition[]
}

// The conditions and what's in it are those of the original, so that they follow the template.
function replaceChild(container: Container, index: number, addition: ContractAddition) {
  const original = container.children[index] as Record<string, unknown>
  const item = cloneDeep(addition.item) as Record<string, unknown>

  delete item.$if
  if (original.$if != null) { item.$if = original.$if }

  for (const key of childKeys) {
    if (key in original) { item[key] = original[key] }
  }

  container.children[index] = item as {id: string}
}

const childKeys = ['items', 'parties']
