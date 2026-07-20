"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset():void}){useEffect(()=>{console.error(JSON.stringify({level:"error",message:"ui.boundary",digest:error.digest??"none"}))},[error]);return <main className="min-h-[60vh] grid place-items-center"><section className="card p-8 max-w-md text-center"><AlertTriangle className="mx-auto text-amber-600" size={44}/><h2 className="text-2xl font-black mt-4">No pudimos completar la operación</h2><p className="muted text-sm mt-2">Podés volver a intentar. Si continúa, informá el identificador de la solicitud.</p><button className="btn btn-primary mt-6" onClick={reset}>Reintentar</button></section></main>}
