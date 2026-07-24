"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blacklist = exports.global = exports.jsep = void 0;
const object_1 = __importDefault(require("@jsep-plugin/object"));
const spread_1 = __importDefault(require("@jsep-plugin/spread"));
const jsep_1 = __importDefault(require("jsep"));
exports.jsep = jsep_1.default;
const ytil_1 = require("ytil");
jsep_1.default.plugins.register(object_1.default);
jsep_1.default.plugins.register(spread_1.default);
jsep_1.default.addBinaryOp('??', 1);
jsep_1.default.right_associative.add('??');
exports.global = {};
exports.blacklist = new Set(['__proto__', 'prototype', 'constructor']);
function makeGlobalEnv() {
    for (const [key, value] of (0, ytil_1.objectEntries)(Math)) {
        if (typeof key !== 'string') {
            continue;
        }
        if (key === 'random') {
            continue;
        }
        if ((0, ytil_1.isFunction)(value)) {
            exports.global[key] = value.bind(Math);
        }
        else if (typeof value === 'number') {
            exports.global[key] = value;
        }
    }
}
makeGlobalEnv();
//# sourceMappingURL=jsep.js.map