import { NextResponse } from "next/server";
import { route, ok, readJson } from "@/lib/api/route";
import { createItem, deleteItem, getItem, listItems, updateItem, type Kind } from "./service";

type IdCtx = { params: Promise<{ id: string }> };

export const collectionHandlers = (kind: Kind) => ({
  GET: route(async () => ok(await listItems(kind))),
  POST: route(async (req) => ok(await createItem(kind, await readJson(req)), 201)),
});

export const itemHandlers = (kind: Kind) => ({
  GET: route<IdCtx>(async (_req, { params }) => ok(await getItem(kind, (await params).id))),
  PUT: route<IdCtx>(async (req, { params }) => {
    const { sha, ...input } = (await readJson(req)) as { sha?: string } & Record<string, unknown>;
    return ok(await updateItem(kind, (await params).id, input, typeof sha === "string" ? sha : undefined));
  }),
  DELETE: route<IdCtx>(async (_req, { params }) => {
    await deleteItem(kind, (await params).id);
    return ok({ deleted: true });
  }),
});

export const noContent = () => new NextResponse(null, { status: 204 });
