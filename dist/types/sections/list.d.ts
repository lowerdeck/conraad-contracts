import { z } from 'zod';
export declare const listItem: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodObject<{
    text: z.ZodString;
}, z.core.$strip>>;
export declare const listSection: z.ZodObject<{
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
}, z.core.$strip>;
export type ListSectionTemplate = z.output<typeof listSection>;
export type ListItem = z.output<typeof listItem>;
//# sourceMappingURL=list.d.ts.map