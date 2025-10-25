import {
  PrismaClient,
  Role,
  ContentStatus,
  SignageDisplayMode,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("--- Start seeding initialization ---");

  // ----------------------------------------------------
  // 1. パスワードのハッシュ化
  // ----------------------------------------------------
  const initialPassword = "adminpassword";
  const saltRounds = 10;
  const initialHash = await bcrypt.hash(initialPassword, saltRounds);
  console.log(`Initial password hash generated.`);

  // ----------------------------------------------------
  // 2. ユーザー (User) の作成
  // ----------------------------------------------------
  const adminData = {
    username: "admin",
    passwordHash: initialHash,
    initialPasswordHash: initialHash,
    role: Role.ADMIN,
    isPasswordSet: false, // 初回ログインで変更が必要
  };

  const exhibitorData = {
    username: "exhibitor",
    passwordHash: initialHash,
    initialPasswordHash: initialHash,
    role: Role.EXHIBITOR,
    isPasswordSet: false,
  };

  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: adminData,
    create: adminData,
  });
  const exhibitorUser = await prisma.user.upsert({
    where: { username: "exhibitor" },
    update: exhibitorData,
    create: exhibitorData,
  });

  console.log(
    `Created users: ${adminUser.username} (${adminUser.role}), ${exhibitorUser.username} (${exhibitorUser.role})`
  );

  // ----------------------------------------------------
  // 3. 団体 (Group) の作成
  // ----------------------------------------------------
  const groupA = await prisma.group.upsert({
    where: { name: "クラスA" },
    update: {},
    create: { name: "クラスA" },
  });
  const groupB = await prisma.group.upsert({
    where: { name: "電子工作部" },
    update: {},
    create: { name: "電子工作部" },
  });
  console.log(`Created groups: ${groupA.name}, ${groupB.name}`);

  // ----------------------------------------------------
  // 4. ユーザーと団体の紐づけ (UserGroup)
  // exhibitorユーザーを両方の団体に所属させる
  // ----------------------------------------------------
  await prisma.userGroup.upsert({
    where: { userId_groupId: { userId: exhibitorUser.id, groupId: groupA.id } },
    update: {},
    create: { userId: exhibitorUser.id, groupId: groupA.id },
  });
  await prisma.userGroup.upsert({
    where: { userId_groupId: { userId: exhibitorUser.id, groupId: groupB.id } },
    update: {},
    create: { userId: exhibitorUser.id, groupId: groupB.id },
  });
  console.log(`Exhibitor linked to both Class A and Electronic Club.`);

  // ----------------------------------------------------
  // 5. タグ (Tag) の作成
  // ----------------------------------------------------
  const tagProg = await prisma.tag.upsert({
    where: { name: "プログラミング" },
    update: {},
    create: { name: "プログラミング" },
  });
  const tagChem = await prisma.tag.upsert({
    where: { name: "化学" },
    update: {},
    create: { name: "化学" },
  });
  console.log(`Created tags: ${tagProg.name}, ${tagChem.name}`);

  // ----------------------------------------------------
  // 6. サイネージ端末 (Signage) の作成
  // ----------------------------------------------------
  const signageEntrance = await prisma.signage.upsert({
    where: { uniqueKey: "ENTRANCE-001" },
    update: {},
    create: {
      uniqueKey: "ENTRANCE-001",
      locationName: "管理棟1F入口",
      displayMode: SignageDisplayMode.IMAGE_SLIDESHOW,
      lastActiveAt: new Date(),
    },
  });
  console.log(`Created signage terminal: ${signageEntrance.uniqueKey}`);

  // ----------------------------------------------------
  // 7. コンテンツ (Content) の作成
  // ----------------------------------------------------
  const contentData = {
    title: "テストコンテンツ - AIデモ",
    description: "このコンテンツは、承認済みのテスト用デモです。",
    status: ContentStatus.APPROVED,
    uploaderId: exhibitorUser.id,
    groupId: groupA.id,
  };

  const testContent = await prisma.content.create({
    data: contentData,
  });
  console.log(`Created approved test content: ${testContent.title}`);

  // ----------------------------------------------------
  // 8. 画像 (Image) の作成 (コンテンツに2枚紐づけ)
  // ----------------------------------------------------
  await prisma.image.create({
    data: {
      contentId: testContent.id,
      storageUrl: "https://placehold.co/600x400/0000FF/FFFFFF?text=Slide+1",
      fileHash: "hash-001",
      order: 1,
    },
  });

  await prisma.image.create({
    data: {
      contentId: testContent.id,
      storageUrl: "https://placehold.co/600x400/FF0000/FFFFFF?text=Slide+2",
      fileHash: "hash-002",
      order: 2,
    },
  });
  console.log(`Created 2 images for the test content.`);

  // ----------------------------------------------------
  // 9. コンテンツとタグの紐づけ (ContentTag)
  // ----------------------------------------------------
  await prisma.contentTag.upsert({
    where: {
      contentId_tagId: { contentId: testContent.id, tagId: tagProg.id },
    },
    update: {},
    create: { contentId: testContent.id, tagId: tagProg.id },
  });
  console.log(`Test content linked to 'プログラミング' tag.`);

  // ----------------------------------------------------
  // 10. サイネージへのコンテンツ表示順設定 (SignageContent)
  // ----------------------------------------------------
  await prisma.signageContent.upsert({
    where: {
      signageId_contentId: {
        signageId: signageEntrance.id,
        contentId: testContent.id,
      },
    },
    update: {},
    create: {
      signageId: signageEntrance.id,
      contentId: testContent.id,
      order: 1, // サイネージ上での表示順序
    },
  });
  console.log(
    `Content set to display first on ${signageEntrance.locationName}.`
  );

  console.log("\n--- Seeding completed successfully! ---");
  console.log("Test Admin Credentials:");
  console.log("  Username: admin");
  console.log("  Password: adminpassword");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
