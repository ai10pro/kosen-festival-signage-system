import { Role } from "@prisma/client";

const Users = [
  {
    username: "admin",
    password: "drowssapnimda",
    role: Role.ADMIN,
  },
  {
    username: "ras-01",
    password: "aaaaaaaaaa",
    role: Role.VIEWER
  },
  {
    username: "ras-02",
    password: "bbbbbbbbbb",
    role: Role.VIEWER
  },
  {
    username: "ras-03",
    password: "cccccccccc",
    role: Role.VIEWER
  },
  {
    username: "ras-04",
    password: "dddddddddd",
    role: Role.VIEWER
  },
  {
    username: "ras-05",
    password: "eeeeeeeeee",
    role: Role.VIEWER
  },
  {
    username: "ras-06",
    password: "ffffffffff",
    role: Role.VIEWER
  },
  {
    username: "class-1-1",
    password: "m3h1f7x2p3",
    role: Role.VIEWER,
    group: "1年1組"
  },
  {
    "username": "class-1-2",
    "password": "a7c4v2f8g5",
    "role": Role.VIEWER,
    group: "1年2組"
  },
  {
    "username": "class-1-3",
    "password": "w3y6l0i9q2",
    "role": Role.VIEWER,
    group: "1年3組"
  },
  {
    "username": "class1-4",
    "password": "s1d5h8j2k6",
    "role": Role.VIEWER,
    group: "1年4組"
  },
  {
    "username": "club-forkguitar",
    "password": "m9b0n7p4l3",
    "role": Role.VIEWER,
    group: "フォークギター部"
  },
  {
    "username": "kakukenn",
    "password": "e2r6t3y1u5",
    "role": Role.VIEWER,
    group: "革新的製品研究会"
  },
  {
    "username": "battledome",
    "password": "i4o8p0a7d9",
    "role": Role.VIEWER,
    group: "高専バトルドーム"
  },
  {
    "username": "class-2-m",
    "password": "f6g1h5j3k7",
    "role": Role.VIEWER,
    group: "2年Mコース"
  },
  {
    "username": "class-2-d",
    "password": "l0z9x2c4v8",
    "role": Role.VIEWER,
    group: "2年Dコース"
  },
  {
    "username": "class-2-e",
    "password": "b5n7m1q3w6",
    "role": Role.VIEWER,
    group: "2年Eコース"
  },
  {
    "username": "class-2-i",
    "password": "r8t2y4u0i5",
    "role": Role.VIEWER,
    group: "2年Iコース"
  },
  {
    "username": "class-3-d",
    "password": "f4g7h0j5k8",
    "role": Role.VIEWER,
    group: "3年Dコース"
  },
  {
    "username": "class-3-e",
    "password": "l9z3x6c1v4",
    "role": Role.VIEWER,
    group: "3年Eコース"
  },
  {
    "username": "class-3-i",
    "password": "b2n5m8q0w3",
    "role": Role.VIEWER,
    group: "3年Iコース"
  },
  {
    "username": "space",
    "password": "e7r1t5y3u6",
    "role": Role.VIEWER,
    group: "宇宙への扉を開く"
  },
  {
    "username": "class-4-m",
    "password": "i0o4p7a2s5",
    "role": Role.VIEWER,
    group: "4年Mコース"
  },
  {
    "username": "pla",
    "password": "d6f9g2h4j8",
    "role": Role.VIEWER,
    group: "pla-bang-bang-born"
  },
  {
    "username": "plarail",
    "password": "k3l7z0x5c9",
    "role": Role.VIEWER,
    group: "プラレール同好会"
  },
  {
    "username": "club-train",
    "password": "o2p6a0s4d8",
    "role": Role.VIEWER,
    group: "汽車倶楽部"
  },
  {
    "username": "class-4-i",
    "password": "v1b4n8m2q6",
    "role": Role.VIEWER,
    group: "4年Iコース"
  },
  {
    "username": "class-5-e",
    "password": "w5e9r2t4y7",
    "role": Role.VIEWER,
    group: "5年Eコース"
  },
  {
    "username": "hukushi",
    "password": "u8i0o3p6a1",
    "role": Role.VIEWER,
    group: "福祉科学研究会"
  },
  {
    "username": "nakatani",
    "password": "s4d7f1g5h9",
    "role": Role.VIEWER,
    group: "中谷研究室"
  },
  {
    "username": "class-5-h",
    "password": "j2k6l9z3x7",
    "role": Role.VIEWER,
    group: "5年Hコース"
  },
  {
    "username": "class-4-e",
    "password": "c0v3b7n1m4",
    "role": Role.VIEWER,
    group: "4年Eコース"
  },
  {
    "username": "farad",
    "password": "q6w1e5r9t2",
    "role": Role.VIEWER,
    group: "FARAD"
  },
  {
    "username": "club-space",
    "password": "y4u8i1o5p9",
    "role": Role.VIEWER,
    group: "SpaceDesignClub"
  },
  {
    "username": "obog",
    "password": "a3s6d0f4g8",
    "role": Role.VIEWER,
    group: "同窓会OBOG展示"
  },
  {
    "username": "gadget",
    "password": "h7j1k4l8z2",
    "role": Role.VIEWER,
    group: "総合課題実習1 ガジェット製作入門"
  },
  {
    "username": "rose",
    "password": "x5c9v2b6n0",
    "role": Role.VIEWER,
    group: "ROSE"
  },
  {
    "username": "club-robot",
    "password": "m3q7w1e5r9",
    "role": Role.VIEWER,
    group: "ろぼっと倶楽部"
  },
  {
    "username": "club-brassband",
    "password": "t2y6u0i4o8",
    "role": Role.VIEWER,
    group: "吹奏楽部"
  },
  {
    "username": "mikuit",
    "password": "p1a5s9d3f7",
    "role": Role.VIEWER,
    group: "MikuIT"
  },
  {
    "username": "waterboys",
    "password": "g6h0j4k8l1",
    "role": Role.VIEWER,
    group: "WATER BOYS"
  },
  {
    "username": "kouenkai",
    "password": "z5x9c3v7b0",
    "role": Role.VIEWER,
    group: "後援会"
  },
  {
    "username": "class-3-m",
    "password": "n4m8q2w6e1",
    "role": Role.VIEWER,
    group: "3年Mコース"
  },
  {
    "username": "club-tea",
    "password": "r7t1y5u9i3",
    "role": Role.VIEWER,
    group: "茶道部"
  },
  {
    "username": "class-4-d",
    "password": "o1p3a6s9d2",
    "role": Role.VIEWER,
    group: "4年Dコース"
  },
  {
    "username": "thinnedbooth",
    "password": "o1p3a6s9d2",
    "role": Role.VIEWER,
    group: "間伐材ブース"
  },
  {
    "username": "shagikenn",
    "password": "o1p3a6s9d2",
    "role": Role.VIEWER,
    group: "車航空技術研究部"
  },
];

export default Users;