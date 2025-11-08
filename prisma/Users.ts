import { Role } from "@prisma/client";
const Users = [
  {
    username: "admin",
    password: "adminpassword",
    role: Role.ADMIN,
  },
  {
    username: "exhibitor",
    password: "exhibitorpassword",
    role: "EXHIBITOR",
    group: "A",
  }];