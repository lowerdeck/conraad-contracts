"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSection = exports.listItem = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
const dynamic_1 = require("./dynamic");
exports.listItem = zod_1.z.preprocess(val => {
    if (typeof val === 'string') {
        return { text: val };
    }
    else {
        return val;
    }
}, zod_1.z.object({
    text: zod_1.z.string(),
}));
exports.listSection = zod_1.z.object({
    ...common_1.contractSectionCommon,
    type: zod_1.z.literal('list'),
    preamble: zod_1.z.string(),
    items: zod_1.z.array((0, dynamic_1.$)(exports.listItem)),
});
//# sourceMappingURL=list.js.map