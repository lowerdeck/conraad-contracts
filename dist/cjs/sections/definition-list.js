"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.definitionListSection = exports.definitionListItem = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
const dynamic_1 = require("./dynamic");
exports.definitionListItem = zod_1.z.object({
    term: zod_1.z.string().max(255),
    body: zod_1.z.string(),
});
exports.definitionListSection = zod_1.z.object({
    ...common_1.contractSectionCommon,
    type: zod_1.z.literal('definitions'),
    preamble: zod_1.z.string(),
    items: zod_1.z.array((0, dynamic_1.$)(exports.definitionListItem)),
});
//# sourceMappingURL=definition-list.js.map