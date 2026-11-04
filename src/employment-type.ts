/**
 * How a contractor works: through a legal entity of their own (a BV), as a natural person who is self-employed, or
 * payrolled by a payroll company. It decides which text the parties section uses for the contractor.
 */
export const employmentTypes = ['legal_entity', 'natural_person', 'payrolled'] as const
export type EmploymentType = typeof employmentTypes[number]

export function isEmploymentType(value: unknown): value is EmploymentType {
  return employmentTypes.includes(value as EmploymentType)
}
