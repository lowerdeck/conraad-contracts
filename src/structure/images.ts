import { ContractSection, ContractStructure } from './index'
import { RichText } from './common'

/**
 * The IDs of the images in the texts of a contract.
 */
export function structureImages(structure: ContractStructure): Set<string> {
  const texts = [
    ...structure.sections.flatMap(ContractSection.texts),
    structure.header?.body,
    structure.footer?.body,
  ]

  const ids = new Set<string>()
  const collect = (node: RichText) => {
    if (node == null || typeof node !== 'object') { return }
    if (node.type === 'image' && typeof node.attrs?.image === 'string') {
      ids.add(node.attrs.image)
    }
    for (const child of node.content ?? []) {
      collect(child)
    }
  }

  texts.forEach(collect)
  return ids
}
