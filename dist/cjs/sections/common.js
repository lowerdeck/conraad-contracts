"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractSectionCommon = void 0;
const zod_1 = require("zod");
exports.contractSectionCommon = {
    name: zod_1.z.string().max(255),
    title: zod_1.z.string().max(255),
};
//# sourceMappingURL=common.js.map