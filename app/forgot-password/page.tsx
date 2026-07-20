"use client";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const[email,setEmail]=useState("");const[message,setMessage]=useState("");const[failed,setFailed]=useState(false);async function submit(e:React.FormEvent){e.preventDefault();const response=await fetch("/api/auth/forgot-password",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email})});const result=await response.json() as{message?:string;error?:string};setFailed(!response.ok);setMessage(result.message??result.error??"No se pudo procesar.");}
  return <main className="min-h-screen grid place-items-center p-5"><section className="card max-w-md w-full p-7 sm:p-10 text-center"><MailCheck className="mx-auto text-[var(--brand)]" size={42}/><h1 className="text-2xl font-black mt-5">Recuperá tu acceso</h1><p className="muted mt-2 text-sm">En producción, Supabase Auth enviará un enlace seguro. En demo elegí una cuenta desde el inicio.</p><form onSubmit={submit}><label className="label text-left mt-7">Correo<input className="field" type="email" placeholder="tu@academia.com" value={email} onChange={e=>setEmail(e.target.value)} required/></label><button className="btn btn-primary w-full mt-4">Enviar enlace</button></form>{message&&<p role="status" className={`rounded-xl p-3 text-sm mt-4 ${failed?"bg-red-50 text-red-800":"bg-[var(--brand-soft)] text-[var(--brand-strong)]"}`}>{message}</p>}<Link href="/login" className="inline-flex items-center gap-2 mt-6 text-sm font-bold text-[var(--brand)]"><ArrowLeft size={16}/> Volver al ingreso</Link></section></main>;
}
