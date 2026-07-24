import { z } from 'zod';
export declare const textSection: z.ZodObject<{
    type: z.ZodLiteral<"text">;
    body: z.ZodString;
    name: z.ZodString;
    title: z.ZodString;
}, z.core.$strip>;
export type TextSection = z.output<typeof textSection>;
//# sourceMappingURL=text.d.ts.map