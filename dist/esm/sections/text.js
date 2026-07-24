import { z } from 'zod';
import { contractSectionCommon } from './common';
export const textSection = z.object({
    ...contractSectionCommon,
    type: z.literal('text'),
    body: z.string(),
});
//# sourceMappingURL=text.js.map