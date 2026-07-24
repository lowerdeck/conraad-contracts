import { z } from 'zod';
export declare function $switch<T extends z.ZodType<any>>(base: T): z.ZodObject<{
    $switch: z.ZodString;
}, z.core.$catchall<T>>;
export declare function $if<T extends z.ZodType<any>>(base: T): z.ZodObject<{
    $if: z.ZodString;
    then: z.ZodUnion<readonly [T, z.ZodObject<{
        $switch: z.ZodString;
    }, z.core.$catchall<T>>]>;
    else: z.ZodOptional<z.ZodUnion<readonly [T, z.ZodObject<{
        $switch: z.ZodString;
    }, z.core.$catchall<T>>]>>;
}, z.core.$strip>;
export declare function $<T extends z.ZodType<any>>(base: T): z.ZodUnion<readonly [T, z.ZodObject<{
    $switch: z.ZodString;
}, z.core.$catchall<T>>, z.ZodObject<{
    $if: z.ZodString;
    then: z.ZodUnion<readonly [T, z.ZodObject<{
        $switch: z.ZodString;
    }, z.core.$catchall<T>>]>;
    else: z.ZodOptional<z.ZodUnion<readonly [T, z.ZodObject<{
        $switch: z.ZodString;
    }, z.core.$catchall<T>>]>>;
}, z.core.$strip>]>;
export type Switch<T extends z.ZodType<any>> = z.output<ReturnType<typeof $switch<T>>>;
export type If<T extends z.ZodType<any>> = z.output<ReturnType<typeof $if<T>>>;
export type Dynamic<T extends z.ZodType<any>> = z.output<ReturnType<typeof $<T>>>;
//# sourceMappingURL=dynamic.d.ts.map