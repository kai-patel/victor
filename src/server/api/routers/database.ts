import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const databaseRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.example.findMany();
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  getSavedTable: protectedProcedure.query(async ({ ctx }) => {
    const data = await ctx.prisma.savedTable.findUnique({
      where: {
        userId: ctx.session.user.id,
      },
    });

    if (data) {
      return {
        items: data.items,
        odds: data.odds,
        stakes: data.stakes,
      };
    }

    return {
      items: [],
      odds: [],
      stakes: [],
    };
  }),
});
