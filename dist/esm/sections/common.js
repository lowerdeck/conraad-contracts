import { z } from 'zod';
export const contractSectionCommon = {
    name: z.string().max(255),
    title: z.string().max(255),
};
//# sourceMappingURL=common.js.map