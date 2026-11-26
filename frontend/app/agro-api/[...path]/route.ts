import { NextRequest, NextResponse } from "next/server";

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");

type Context = {
  params: Promise<{ path: string[] }>;
};

async function proxy(request: NextRequest, context: Context) {
  const { path } = await context.params;
  const suffix = request.nextUrl.pathname.endsWith("/") ? "/" : "";
  const target = `${apiUrl}/${path.join("/")}${suffix}${request.nextUrl.search}`;
  const response = await fetch(target, {
    headers: { Accept: request.headers.get("accept") ?? "application/json" },
    cache: "no-store",
  });
  const body = await response.arrayBuffer();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = proxy;
