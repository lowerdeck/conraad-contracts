import { ContractSection } from '../structure'
import { AdditionAnchor, ContractAdditionType } from './addition'
import { Container, findContainer, locate } from './containers'

/**
 * Where to add something relative to a section or item: as its sibling before or after it, or as its first or last
 * child. The sections must be those with the additions merged in, but not left out when hidden, so that the anchor
 * records all siblings.
 */
export function anchorAt(sections: ContractSection[], target: string | null, position: AnchorPosition): AnchorResult | null {
  if (position === 'before' || position === 'after') {
    if (target == null) { return null }

    const location = locate(sections, target)
    if (location == null) { return null }

    const {container, index} = location
    return anchorInContainer(container, position === 'before' ? index : index + 1)
  } else {
    const container = findContainer(sections, target)
    if (container == null) { return null }

    return anchorInContainer(container, position === 'start' ? 0 : container.children.length)
  }
}

export type AnchorPosition = 'before' | 'after' | 'start' | 'end'

export interface AnchorResult {
  type:   ContractAdditionType
  anchor: AdditionAnchor
}

function anchorInContainer(container: Container, index: number): AnchorResult {
  const ids = container.children.map(it => it.id)

  return {
    type:   container.type,
    anchor: {
      parent: container.parent,
      after:  ids.slice(0, index).reverse(),
      before: ids.slice(index),
    },
  }
}

/**
 * The index in the given siblings to insert at: next to the nearest sibling that is still around, trying either
 * side in turn. Without any, an addition that was last stays last, and goes first otherwise.
 */
export function resolveAnchor(anchor: AdditionAnchor, siblings: Array<{id: string}>): number {
  const indexOf = (id: string) => siblings.findIndex(it => it.id === id)

  for (let i = 0; i < Math.max(anchor.after.length, anchor.before.length); i++) {
    const after = i < anchor.after.length ? indexOf(anchor.after[i]) : -1
    if (after >= 0) { return after + 1 }

    const before = i < anchor.before.length ? indexOf(anchor.before[i]) : -1
    if (before >= 0) { return before }
  }

  return anchor.before.length === 0 ? siblings.length : 0
}
