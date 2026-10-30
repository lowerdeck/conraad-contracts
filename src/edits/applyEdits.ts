import { ContractSection, ListItem } from '../structure'
import { containers } from './containers'
import { ContractEdit } from './edit'
import { isRemovable } from './removable'
import { ContractRemoval } from './removal'
import { mergeAdditions } from './mergeAdditions'

/**
 * Applies the edits of a contract to the sections of its template. Additions are merged in before anything is
 * removed, so that an addition next to something that is removed stays in place, and one in something that is
 * removed goes along with it.
 *
 * Edits that can't be applied are returned as orphans: additions that can't be placed (see `mergeAdditions`), and
 * removals of which the target is gone altogether.
 */
export function applyEdits(sections: ContractSection[], edits: ContractEdit[]): EditsResult {
  const merged = mergeAdditions(sections, edits.filter(ContractEdit.isAddition))
  const removals = edits.filter(ContractEdit.isRemoval)

  const existing = new Set(containers(merged.sections).flatMap(it => it.children.map(child => child.id)))
  const removed = removals.filter(it => existing.has(it.target))
  const orphans = new Set<ContractEdit>([...merged.orphans, ...removals.filter(it => !existing.has(it.target))])

  return {
    sections: removeItems(merged.sections, new Set(removed.map(it => it.target))),
    merged:   merged.sections,
    removed:  removed,
    orphans:  edits.filter(it => orphans.has(it)),
  }
}

/**
 * The removals of sections or items that may not be removed.
 */
export function invalidRemovals(sections: ContractSection[], edits: ContractEdit[]): ContractRemoval[] {
  const {merged, removed} = applyEdits(sections, edits)
  return removed.filter(it => !isRemovable(merged, it.target))
}

export interface EditsResult {
  /** The sections with all edits applied. */
  sections: ContractSection[]

  /** The sections with the additions merged in, but nothing removed yet. */
  merged: ContractSection[]

  removed: ContractRemoval[]
  orphans: ContractEdit[]
}

function removeItems(sections: ContractSection[], ids: Set<string>): ContractSection[] {
  const keep = <T extends {id: string}>(items: T[]) => items.filter(it => !ids.has(it.id))
  const keepListItems = (items: ListItem[]): ListItem[] => keep(items).map(it => ({...it, items: keepListItems(it.items ?? [])}))

  return keep(sections).map(section => {
    switch (section.type) {
    case 'text':
    case 'parties':
      return section
    case 'list':
      return {...section, items: keepListItems(section.items)}
    case 'definition-list':
      return {...section, items: keep(section.items)}
    case 'signature':
      return {...section, parties: keep(section.parties)}
    }
  })
}
