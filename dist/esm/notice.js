import { z } from 'zod';
export var ContractNoticeSeverity;
(function (ContractNoticeSeverity) {
    ContractNoticeSeverity["Error"] = "error";
    ContractNoticeSeverity["Notice"] = "notice";
    ContractNoticeSeverity["Info"] = "info";
})(ContractNoticeSeverity || (ContractNoticeSeverity = {}));
export const contractNotice = z.object({
    seqno: z.number(),
    severity: z.enum(ContractNoticeSeverity),
    message: z.string(),
});
//# sourceMappingURL=notice.js.map