import { ContractSection, ListItem } from '../structure'

/**
 * Whether a section or item can be removed from a contract, which is only if neither it nor anything in it is
 * required by the template.
 */
export function isRemovable(sections: ContractSection[], id: string): boolean {
  const section = sections.find(it => it.id === id)
  if (section != null) {
    return !section.required && !hasRequiredItems(section)
  }

  const location = ContractSection.findItem(sections, id)
  if (location == null) { return false }

  switch (location.kind) {
  case 'list-item':
    return !ListItem.flatten([location.item]).some(it => it.item.required)
  default:
    return !location.item.required
  }
}

function hasRequiredItems(section: ContractSection): boolean {
  switch (section.type) {
  case 'text':
    return false
  case 'list':
    return ListItem.flatten(section.items).some(it => it.item.required)
  case 'definition-list':
    return section.items.some(it => it.required)
  case 'signature':
    return section.parties.some(it => it.required)
  }
}
