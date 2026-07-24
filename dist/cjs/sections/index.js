"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractSection = void 0;
const zod_1 = require("zod");
const list_1 = require("./list");
const text_1 = require("./text");
const definition_list_1 = require("./definition-list");
// @index
__exportStar(require("./common"), exports);
__exportStar(require("./definition-list"), exports);
__exportStar(require("./dynamic"), exports);
__exportStar(require("./list"), exports);
__exportStar(require("./text"), exports);
// /index
exports.contractSection = zod_1.z.discriminatedUnion('type', [
    text_1.textSection,
    list_1.listSection,
    definition_list_1.definitionListSection,
]);
//# sourceMappingURL=index.js.map