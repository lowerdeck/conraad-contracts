import { ContractSection, ListItem } from '../structure'
import { ContractAdditionType } from './addition'

/**
 * Everything in the sections that holds an ordered list of sections or items, in document order. List items without
 * sub-items get an empty list, so only use this on sections of your own.
 */
export function containers(sections: ContractSection[]): Container[] {
  const result: Container[] = [{parent: null, type: 'section', children: sections}]

  const addListItems = (parent: string, items: ListItem[]) => {
    result.push({parent, type: 'list-item', children: items})
    for (const item of items) {
      addListItems(item.id, item.items ??= [])
    }
  }

  for (const section of sections) {
    switch (section.type) {
    case 'list':
      addListItems(section.id, section.items)
      break
    case 'definition-list':
      result.push({parent: section.id, type: 'definition', children: section.items})
      break
    case 'signature':
      result.push({parent: section.id, type: 'party', children: section.parties})
      break
    }
  }

  return result
}

export function findContainer(sections: ContractSection[], parent: string | null): Container | null {
  return containers(sections).find(it => it.parent === parent) ?? null
}

/**
 * The container that holds the section or item with the given ID, and where.
 */
export function locate(sections: ContractSection[], id: string): {container: Container, index: number} | null {
  for (const container of containers(sections)) {
    const index = container.children.findIndex(it => it.id === id)
    if (index >= 0) { return {container, index} }
  }
  return null
}

export interface Container {
  /** The ID of the section or list item, or `null` for the sections themselves. */
  parent: string | null

  /** What kind of addition goes in it. */
  type: ContractAdditionType

  children: Array<{id: string}>
}
