import type { ContractStructure } from './index'

/**
 * Checks a template's structure for what keeps contracts from being drawn up from it (errors), or what is likely
 * unintended (warnings). Unlike the issues found when importing, these follow the structure as it is edited.
 */
export function validateStructure(structure: Pick<ContractStructure, 'attachments'>): StructureIssue[] {
  const issues: StructureIssue[] = []

  for (const attachment of structure.attachments) {
    if (attachment.name == null) {
      issues.push({code: 'attachment_unnamed', severity: 'warning', target: attachment.id})
    }
    if (attachment.type === 'template' && attachment.document == null) {
      issues.push({code: 'attachment_document_missing', severity: 'error', target: attachment.id})
    }
  }

  return issues
}

export interface StructureIssue {
  code:     StructureIssueCode
  severity: 'error' | 'warning'

  /** The ID of what the issue is about. */
  target: string
}

export type StructureIssueCode = 'attachment_unnamed' | 'attachment_document_missing'
