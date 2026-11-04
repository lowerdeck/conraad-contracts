import { ContractInput } from '../inputs'
import { ContractSection, ContractStructure, Form, RichText } from '../structure'

/**
 * Whether a value that is missing leaves a gap in the contract, rather than being left out on purpose: those known
 * from the assignment, and those of required fields. Fields that are optional, or of a fieldset that can be switched
 * off or doesn't always apply, may well be empty.
 */
export function isRequiredValue(expression: string, form: Form): boolean {
  const root = /^\s*([A-Za-z_][A-Za-z0-9_]*)/.exec(expression)?.[1] ?? expression.trim()
  if (ContractInput.isRoot(root)) { return true }

  for (const fieldset of form.fieldsets) {
    const field = fieldset.fields.find(it => it.variable.name === root)
    if (field == null) { continue }

    return !field.optional && fieldset.toggle == null && fieldset.$if == null
  }
  return false
}

/**
 * The values that are still missing in a resolved contract, by the label they're shown with.
 */
export function unfilledValues(structure: ContractStructure): string[] {
  const labels = new Set<string>()
  const collect = (node: RichText) => {
    if (node == null) { return }
    if (node.type === unfilledNodeType && node.attrs?.status === 'unfilled') {
      labels.add(node.attrs.text)
    }
    for (const child of node.content ?? []) {
      collect(child)
    }
  }

  for (const section of structure.sections) {
    ContractSection.texts(section).forEach(collect)
  }
  return [...labels]
}

const unfilledNodeType = 'interpolated'
