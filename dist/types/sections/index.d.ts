import { z } from 'zod';
export * from './common';
export * from './definition-list';
export * from './dynamic';
export * from './list';
export * from './text';
export declare const contractSection: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"text">;
    body: z.ZodString;
    name: z.ZodString;
    title: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"list">;
    preamble: z.ZodString;
    items: z.ZodArray<z.ZodUnion<readonly [z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodObject<{
        text: z.ZodString;
    }, z.core.$strip>>, z.ZodObject<{
        $switch: z.ZodString;
    }, z.core.$catchall<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodObject<{
        text: z.ZodString;
    }, z.core.$strip>>>>, z.ZodObject<{
        $if: z.ZodString;
        then: z.ZodUnion<readonly [z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodObject<{
            text: z.ZodString;
        }, z.core.$strip>>, z.ZodObject<{
            $switch: z.ZodString;
        }, z.core.$catchall<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodObject<{
            text: z.ZodString;
        }, z.core.$strip>>>>]>;
        else: z.ZodOptional<z.ZodUnion<readonly [z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodObject<{
            text: z.ZodString;
        }, z.core.$strip>>, z.ZodObject<{
            $switch: z.ZodString;
        }, z.core.$catchall<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodObject<{
            text: z.ZodString;
        }, z.core.$strip>>>>]>>;
    }, z.core.$strip>]>>;
    name: z.ZodString;
    title: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"definitions">;
    preamble: z.ZodString;
    items: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
        term: z.ZodString;
        body: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        $switch: z.ZodString;
    }, z.core.$catchall<z.ZodObject<{
        term: z.ZodString;
        body: z.ZodString;
    }, z.core.$strip>>>, z.ZodObject<{
        $if: z.ZodString;
        then: z.ZodUnion<readonly [z.ZodObject<{
            term: z.ZodString;
            body: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            $switch: z.ZodString;
        }, z.core.$catchall<z.ZodObject<{
            term: z.ZodString;
            body: z.ZodString;
        }, z.core.$strip>>>]>;
        else: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
            term: z.ZodString;
            body: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            $switch: z.ZodString;
        }, z.core.$catchall<z.ZodObject<{
            term: z.ZodString;
            body: z.ZodString;
        }, z.core.$strip>>>]>>;
    }, z.core.$strip>]>>;
    name: z.ZodString;
    title: z.ZodString;
}, z.core.$strip>], "type">;
export type ContractSection = z.output<typeof contractSection>;
//# sourceMappingURL=index.d.ts.map