"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textSection = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.textSection = zod_1.z.object({
    ...common_1.contractSectionCommon,
    type: zod_1.z.literal('text'),
    body: zod_1.z.string(),
});
//# sourceMappingURL=text.js.map