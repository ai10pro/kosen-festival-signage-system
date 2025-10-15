import { PrismaClient, Role, ContentStatus, SignageDisplayMode } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // ----------------------------------------------------
  // 1. パスワードのハッシュ化
  // ----------------------------------------------------
  const initialPassword = 'adminpassword';
  const saltRounds = 10;
  const initialHash = await bcrypt.hash(initialPassword, saltRounds);

  // ----------------------------------------------------
  // 2. ユーザー (管理者と展示担当者) の作成
  // ----------------------------------------------------
  // 管理者アカウント
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: initialHash,
      initialPasswordHash: initialHash,
      role: Role.ADMIN,
      isPasswordSet: false,
    },
  });

  // 展示担当者アカウント
  const exhibitorUser = await prisma.user.upsert({
    where: { username: 'groupA_member' },
    update: {},
    create: {
      username: 'groupA_member',
      passwordHash: initialHash,
      initialPasswordHash: initialHash,
      role: Role.EXHIBITOR,
      isPasswordSet: false,
    },
  });
  console.log(`Created users: ${adminUser.username}, ${exhibitorUser.username}`);

  // ----------------------------------------------------
  // 3. 団体 (Group) の作成
  // ----------------------------------------------------
  const groupA = await prisma.group.upsert({
    where: { name: 'クラスA展示' },
    update: {},
    create: { name: 'クラスA展示' },
  });

  const groupB = await prisma.group.upsert({
    where: { name: '電子工作部' },
    update: {},
    create: { name: '電子工作部' },
  });
  console.log(`Created groups: ${groupA.name}, ${groupB.name}`);

  // ----------------------------------------------------
  // 4. ユーザーと団体の紐付け (UserGroup)
  // ----------------------------------------------------
  await prisma.userGroup.upsert({
    where: { userId_groupId: { userId: exhibitorUser.id, groupId: groupA.id } },
    update: {},
    create: { userId: exhibitorUser.id, groupId: groupA.id },
  });
  console.log('Linked exhibitor to Group A');

  // ----------------------------------------------------
  // 5. タグ (Tag) の作成
  // ----------------------------------------------------
  const tagProg = await prisma.tag.upsert({
    where: { name: 'プログラミング' },
    update: {},
    create: { name: 'プログラミング' },
  });

  const tagChem = await prisma.tag.upsert({
    where: { name: '化学' },
    update: {},
    create: { name: '化学' },
  });
  console.log(`Created tags: ${tagProg.name}, ${tagChem.name}`);

  // ----------------------------------------------------
  // 6. サイネージ (Signage) の作成
  // ----------------------------------------------------
  const signageEntrance = await prisma.signage.upsert({
    where: { uniqueKey: 'SIGNAGE-001' },
    update: {},
    create: {
      locationName: '体育館入口',
      uniqueKey: 'SIGNAGE-001',
      displayMode: SignageDisplayMode.IMAGE_SLIDESHOW,
      lastActiveAt: new Date(),
    },
  });
  console.log(`Created signage: ${signageEntrance.locationName}`);

  // ----------------------------------------------------
  // 7. コンテンツ (Content) の作成
  // ----------------------------------------------------
  const approvedContent = await prisma.content.upsert({
    where: { id: 'test-content-001' },
    update: {},
    create: {
      id: 'test-content-001',
      title: 'サインイン画面のデモ展示',
      description: 'これは承認済みのテストコンテンツです。サイネージに表示されます。',
      status: ContentStatus.APPROVED,
      uploaderId: adminUser.id,
      groupId: groupA.id,
    },
  });

  const pendingContent = await prisma.content.upsert({
    where: { id: 'test-content-002' },
    update: {},
    create: {
      id: 'test-content-002',
      title: '承認待ちのコンテンツ',
      description: 'このコンテンツは承認待ちのため、サイネージには表示されません。',
      status: ContentStatus.PENDING,
      uploaderId: exhibitorUser.id,
      groupId: groupB.id,
    },
  });
  console.log(`Created contents: ${approvedContent.title}, ${pendingContent.title}`);

  // ----------------------------------------------------
  // 8. 画像 (Image) の作成 (承認済みコンテンツに紐付け)
  // ----------------------------------------------------
  await prisma.image.createMany({
    data: [
      {
        contentId: approvedContent.id,
        storageUrl: 'https://placehold.co/600x400/007bff/ffffff?text=Image+1',
        fileHash: 'hash-001-A',
        order: 1,
      },
      {
        contentId: approvedContent.id,
        storageUrl: 'https://placehold.co/600x400/dc3545/ffffff?text=Image+2',
        fileHash: 'hash-002-A',
        order: 2,
      },
    ],
  });
  console.log('Created images for approved content');

  // ----------------------------------------------------
  // 9. コンテンツとタグの紐付け (ContentTag)
  // ----------------------------------------------------
  await prisma.contentTag.create({
    data: { contentId: approvedContent.id, tagId: tagProg.id },
  });
  console.log('Linked programming tag to approved content');

  // ----------------------------------------------------
  // 10. サイネージとコンテンツの紐付け (SignageContent)
  // ----------------------------------------------------
  // 承認済みコンテンツをサイネージに表示する設定
  await prisma.signageContent.create({
    data: {
      signageId: signageEntrance.id,
      contentId: approvedContent.id,
      order: 1, // サイネージ上での表示順序を1番目に設定
    },
  });
  console.log('Linked approved content to signage');


  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
