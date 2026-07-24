"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractNotice = exports.ContractNoticeSeverity = void 0;
const zod_1 = require("zod");
var ContractNoticeSeverity;
(function (ContractNoticeSeverity) {
    ContractNoticeSeverity["Error"] = "error";
    ContractNoticeSeverity["Notice"] = "notice";
    ContractNoticeSeverity["Info"] = "info";
})(ContractNoticeSeverity || (exports.ContractNoticeSeverity = ContractNoticeSeverity = {}));
exports.contractNotice = zod_1.z.object({
    seqno: zod_1.z.number(),
    severity: zod_1.z.enum(ContractNoticeSeverity),
    message: zod_1.z.string(),
});
//# sourceMappingURL=notice.js.map