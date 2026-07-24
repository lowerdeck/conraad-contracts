import { z } from 'zod';
export function $switch(base) {
    return z.object({
        $switch: z.string().max(255),
    }).catchall(base);
}
export function $if(base) {
    return z.object({
        $if: z.string().max(255),
        then: z.union([base, $switch(base)]),
        else: z.union([base, $switch(base)]).optional(),
    });
}
export function $(base) {
    return z.union([
        base,
        $switch(base),
        $if(base),
    ]);
}
//# sourceMappingURL=dynamic.js.map