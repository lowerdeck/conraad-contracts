"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$switch = $switch;
exports.$if = $if;
exports.$ = $;
const zod_1 = require("zod");
function $switch(base) {
    return zod_1.z.object({
        $switch: zod_1.z.string().max(255),
    }).catchall(base);
}
function $if(base) {
    return zod_1.z.object({
        $if: zod_1.z.string().max(255),
        then: zod_1.z.union([base, $switch(base)]),
        else: zod_1.z.union([base, $switch(base)]).optional(),
    });
}
function $(base) {
    return zod_1.z.union([
        base,
        $switch(base),
        $if(base),
    ]);
}
//# sourceMappingURL=dynamic.js.map