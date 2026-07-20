"use client";

import { useState } from "react";
import { ArrowRight, BookOpenCheck, CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";

const accounts = [
  ["Propietario", "owner@demo.local"],
  ["Recepción", "recepcion@demo.local"],
  ["Profesor", "profesor@demo.local"],
  ["Superadmin", "superadmin@demo.local"]
] as const;

export function LoginForm() {
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
  const [email, setEmail] = useState(demo ? "owner@demo.local" : "");
  const [password, setPassword] = useState(demo ? "Demo-3300!" : "");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    const endpoint = process.env.NEXT_PUBLIC_DEMO_MODE === "false" ? "/api/auth/login" : "/api/auth/demo";
    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
    const result = await response.json() as { error?: string; redirect?: string };
    if (!response.ok) { setError(result.error ?? "No se pudo iniciar sesión."); setLoading(false); return; }
    window.location.assign(result.redirect ?? "/app/dashboard");
  }

  return <main className="min-h-screen grid lg:grid-cols-[1.05fr_.95fr] bg-white">
    <section className="hidden lg:flex relative overflow-hidden bg-[var(--sidebar)] text-white p-14 flex-col justify-between">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 15% 20%, #3b82f6 0, transparent 28%), radial-gradient(circle at 85% 70%, #e7a437 0, transparent 26%)" }} />
      <div className="relative flex items-center gap-3 font-extrabold text-xl"><span className="grid place-items-center size-11 rounded-2xl bg-white/12"><BookOpenCheck /></span>Academia SaaS</div>
      <div className="relative max-w-xl">
        <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm mb-7">Operación clara. Ingresos oficiales.</span>
        <h1 className="text-5xl leading-[1.08] font-black tracking-[-.04em]">Tu academia, bajo control y en un solo lugar.</h1>
        <p className="mt-6 text-lg leading-8 text-white/75">Alumnos, cuotas, asistencia, caja y liquidaciones conectadas por reglas verificables.</p>
        <div className="mt-10 grid gap-4 text-sm text-white/80">
          <p className="flex items-center gap-3"><CheckCircle2 className="text-[#e7b358]" /> Aislamiento estricto entre clientes</p>
          <p className="flex items-center gap-3"><CheckCircle2 className="text-[#e7b358]" /> Comisión docente sobre cobros confirmados</p>
          <p className="flex items-center gap-3"><CheckCircle2 className="text-[#e7b358]" /> QR, alertas y auditoría completa</p>
        </div>
      </div>
      <p className="relative text-xs text-white/45">© 2026 Academia SaaS · Entorno de demostración</p>
    </section>
    <section className="min-h-screen flex items-center justify-center p-5 sm:p-10 bg-[#f8fafc]">
      <div className="w-full max-w-[460px]">
        <div className="lg:hidden flex items-center gap-3 font-extrabold text-xl mb-12"><span className="grid place-items-center size-10 rounded-xl bg-[var(--brand)] text-white"><BookOpenCheck size={21}/></span>Academia SaaS</div>
        <p className="eyebrow">Acceso seguro</p>
        <h2 className="text-3xl sm:text-4xl font-black tracking-[-.035em] mt-2">Bienvenido de nuevo</h2>
        <p className="muted mt-3">Ingresá con tu cuenta para continuar.</p>
        <form onSubmit={submit} className="mt-8 grid gap-5">
          <label className="label">Correo electrónico<input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
          <div className="grid gap-2"><label className="label" htmlFor="password">Contraseña</label><span className="relative"><input id="password" className="field pr-12" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /><button type="button" onClick={() => setShow(!show)} aria-label="Alternar visibilidad" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 muted">{show ? <EyeOff size={19}/> : <Eye size={19}/>}</button></span></div>
          <div className="flex justify-between text-sm"><label className="flex items-center gap-2"><input type="checkbox" /> Recordarme</label><a href="/forgot-password" className="text-[var(--brand)] font-bold">Olvidé mi contraseña</a></div>
          {error && <p role="alert" className="rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
          <button className="btn btn-primary w-full" disabled={loading}>{loading ? "Ingresando…" : <>Ingresar <ArrowRight size={18}/></>}</button>
        </form>
        {demo && <div className="mt-8 border-t border-[var(--line)] pt-6">
          <p className="text-xs font-extrabold uppercase tracking-widest muted mb-3">Cuentas demo · clave Demo-3300!</p>
          <div className="grid grid-cols-2 gap-2">{accounts.map(([label, value]) => <button key={value} onClick={() => setEmail(value)} className={`text-left rounded-xl border p-3 text-xs ${email === value ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-[var(--line)] bg-white"}`}><strong className="block text-sm">{label}</strong><span className="muted">Seleccionar</span></button>)}</div>
        </div>}
        <p className="flex items-center justify-center gap-2 text-xs muted mt-7"><ShieldCheck size={15}/> Sesión protegida y acciones auditadas <LockKeyhole size={14}/></p>
      </div>
    </section>
  </main>;
}
