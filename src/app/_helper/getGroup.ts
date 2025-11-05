import { prisma } from "@/libs/prisma";

export const getGroupIdFromUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userGroups: true },
  });
  return user?.userGroups || null;
};
