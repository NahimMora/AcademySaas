import { NextRequest, NextResponse } from "next/server";
export function proxy(request:NextRequest){const id=request.headers.get("x-request-id")??crypto.randomUUID();const headers=new Headers(request.headers);headers.set("x-request-id",id);headers.set("x-correlation-id",request.headers.get("x-correlation-id")??id);const response=NextResponse.next({request:{headers}});response.headers.set("x-request-id",id);return response;}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico).*)"]};
