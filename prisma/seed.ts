import {
  PrismaClient,
  Role,
  ContentStatus,
  SignageDisplayMode,
  User as PrismaUser,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

import Users from "./Users"

const signages = [
  {
    uniqueKey: "ras-01",
    locationName: "本部前",
    displayMode: SignageDisplayMode.IMAGE_SLIDESHOW,
    lastActiveAt: new Date(),
    statusInfo: null,
  },
  {
    uniqueKey: "ras-02",
    locationName: "教養棟1階",
    displayMode: SignageDisplayMode.IMAGE_SLIDESHOW,
    lastActiveAt: new Date(),
    statusInfo: null,
  },
  {
    uniqueKey: "ras-03",
    locationName: "教養棟2階",
    displayMode: SignageDisplayMode.IMAGE_SLIDESHOW,
    lastActiveAt: new Date(),
    statusInfo: null,
  },
  {
    uniqueKey: "ras-04",
    locationName: "管理棟",
    displayMode: SignageDisplayMode.IMAGE_SLIDESHOW,
    lastActiveAt: new Date(),
    statusInfo: null,
  }
]

const prisma = new PrismaClient();

interface IHashOptions {
  saltRounds: number;
}

interface PasswordHasher {
  hashPassword(password: string, options?: IHashOptions): Promise<string>;
}

interface PasswordHasher {
  hashPassword(password: string, options?: IHashOptions): Promise<string>;
}

const defaultHashOptions: IHashOptions = { saltRounds: 10 };

const hashPassword: PasswordHasher["hashPassword"] = async (
  password: string,
  options: IHashOptions = defaultHashOptions
): Promise<string> => {
  return bcrypt.hash(password, options.saltRounds);
};

async function main() {
  console.log("--- Start seeding initialization ---");

  for (const user of Users) {
    // userにあるgroupプロパティを使って団体を作成または取得
    let groupId: string | null = null;
    if ("group" in user && user.group) {
      const group = await prisma.group.upsert({
        where: { name: user.group },
        update: {},
        create: { name: user.group },
      });
      groupId = group.id;
    }
    const hashedPassword = await hashPassword(user.password);

    const userData = {
      username: user.username,
      passwordHash: hashedPassword,
      initialPasswordHash: hashedPassword,
      role: user.role,
      isPasswordSet: false, // 初回ログインで変更が必要
    };

    const createdUser = await prisma.user.upsert({
      where: { username: user.username },
      update: userData,
      create: userData,
    });

    // 団体がある場合、UserGroupを作成してユーザーと団体を紐づける
    if (groupId) {
      await prisma.userGroup.upsert({
        where: {
          userId_groupId: {
            userId: createdUser.id,
            groupId: groupId,
          },
        },
        update: {},
        create: {
          userId: createdUser.id,
          groupId: groupId,
        },
      });
    }
  }

  for (const signage of signages) {
    await prisma.signage.upsert({
      where: { uniqueKey: signage.uniqueKey },
      update: signage,
      create: signage,
    });
  }

  console.log("--- Seeding initialization finished ---");
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
