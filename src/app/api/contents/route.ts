import { prisma } from "@/libs/prisma";
import { NextRequest, NextResponse } from "next/server";

export const config = {
  dynamic: "force-dynamic",
  fetchCache: "no-store",
  revalidate: 0,
};

