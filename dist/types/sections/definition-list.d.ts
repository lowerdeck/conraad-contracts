import { z } from 'zod';
export declare const definitionListItem: z.ZodObject<{
    term: z.ZodString;
    body: z.ZodString;
}, z.core.$strip>;
export declare const definitionListSection: z.ZodObject<{
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
}, z.core.$strip>;
export type DefinitionsSectionTemplate = z.output<typeof definitionListSection>;
export type DefinitionListItem = z.output<typeof definitionListItem>;
//# sourceMappingURL=definition-list.d.ts.map