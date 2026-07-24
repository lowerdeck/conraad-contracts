import { z } from 'zod'

export enum ContractNoticeSeverity {
  Error = 'error',
  Notice = 'notice',
  Info = 'info',
}

export const contractNotice = z.object({
  seqno:    z.number(),
  severity: z.enum(ContractNoticeSeverity),
  message:  z.string(),
})
