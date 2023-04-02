import { appRouter } from "~/server/api/root";

import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { prisma } from "~/server/db";
import superjson from "superjson";

// Treated like static asset and rerun validation when and how you choose
export const generateSSGHelper = () =>
  createProxySSGHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson,
  });
