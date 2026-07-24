import { z } from 'zod';
export declare enum ContractNoticeSeverity {
    Error = "error",
    Notice = "notice",
    Info = "info"
}
export declare const contractNotice: z.ZodObject<{
    seqno: z.ZodNumber;
    severity: z.ZodEnum<typeof ContractNoticeSeverity>;
    message: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=notice.d.ts.map