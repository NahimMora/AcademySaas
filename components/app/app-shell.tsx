"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Bell, BookOpen, BookOpenCheck, Building2, CalendarDays, ChartNoAxesCombined, ChevronDown, CircleDollarSign, FileClock, GraduationCap, House, Info, Landmark, LayoutGrid, LogOut, Menu, QrCode, Settings, ShieldCheck, Users, WalletCards, X } from "lucide-react";
import type { Role, SessionUser } from "@/lib/domain/types";
import { DemoProvider, useDemo } from "@/components/providers/demo-provider";

type NavItem = { label: string; href: string; icon: LucideIcon; badge?: number };
type NavGroup = { id: string; label: string; icon: LucideIcon; items: NavItem[] };

const topNav: NavItem[] = [{ label: "Resumen", href: "/app/dashboard", icon: House }];
const bottomNav: NavItem[] = [{ label: "Configuración", href: "/app/settings", icon: Settings }];
function buildNavGroups(bandejaBadge: number): NavGroup[] { return [
  { id: "academia", label: "Academia", icon: GraduationCap, items: [
    { label: "Alumnos", href: "/app/students", icon: GraduationCap },
    { label: "Cursos", href: "/app/courses", icon: BookOpen },
    { label: "Profesores", href: "/app/teachers", icon: Users },
    { label: "Clases", href: "/app/classes", icon: CalendarDays },
    { label: "Check-in QR", href: "/app/check-in", icon: QrCode }
  ] },
  { id: "finanzas", label: "Finanzas", icon: WalletCards, items: [
    { label: "Cobros", href: "/app/billing", icon: CircleDollarSign },
    { label: "Caja", href: "/app/cash", icon: WalletCards },
    { label: "Liquidaciones", href: "/app/settlements", icon: Landmark }
  ] },
  { id: "gestion", label: "Gestión", icon: ShieldCheck, items: [
    { label: "Bandeja", href: "/app/inbox", icon: FileClock, badge: bandejaBadge },
    { label: "Herramientas", href: "/app/tools", icon: ChartNoAxesCombined }
  ] }
]; }
const platformNav: NavItem[] = [
  { label: "Plataforma", href: "/platform", icon: LayoutGrid },
  { label: "Clientes", href: "/platform/workspaces", icon: Building2 },
  { label: "Usuarios", href: "/platform/users", icon: Users },
  { label: "Auditoría global", href: "/platform/audit", icon: ShieldCheck },
  { label: "Configuración", href: "/platform/settings", icon: Settings }
];
const instructorNav: NavItem[] = [
  { label: "Resumen", href: "/instructor/dashboard", icon: House },
  { label: "Mis comisiones", href: "/instructor/cohorts", icon: Users },
  { label: "Clases", href: "/instructor/classes", icon: CalendarDays },
  { label: "Liquidaciones", href: "/instructor/settlements", icon: Landmark },
  { label: "Notificaciones", href: "/instructor/notifications", icon: Bell }
];
const receptionAllowed = new Set(["/app/dashboard", "/app/students", "/app/teachers", "/app/classes", "/app/check-in", "/app/billing", "/app/cash", "/app/inbox", "/app/incidents", "/app/notifications", "/app/tools"]);
const mobileQuickAccess = { app: ["/app/dashboard", "/app/payments", "/app/cash", "/app/check-in"], platform: platformNav.slice(0, 4).map((item) => item.href), instructor: instructorNav.slice(0, 4).map((item) => item.href) };

const SessionContext = createContext<SessionUser | null>(null);
export function useSessionUser() { const user = useContext(SessionContext); if (!user) throw new Error("Sesión no disponible"); return user; }

const roleLabels: Record<Role, string> = { owner: "Propietaria", receptionist: "Recepción", instructor: "Profesor", platform_superadmin: "Superadmin" };
const roleCapabilities: Record<Role, string[]> = {
  owner: [
    "Alta y gestión de alumnos, profesores, comisiones y cursos",
    "Registrar pagos y confirmar o revertir cobros",
    "Abrir y cerrar caja",
    "Aprobar solicitudes y resolver alertas",
    "Generar informes, liquidaciones e importaciones",
    "Revisar el registro de asistencia (la carga la hacen recepción y profesores)"
  ],
  receptionist: [
    "Registrar alumnos y validar accesos por QR",
    "Registrar pagos y controlar la caja de tu sede",
    "Tomar y cerrar asistencia de las clases",
    "Ver alertas y solicitudes, pero no aprobarlas ni configurar el workspace"
  ],
  instructor: [
    "Ver tus comisiones, alumnos y horario",
    "Tomar y cerrar asistencia de tus clases",
    "Consultar tus liquidaciones",
    "No accedés a pagos ni datos administrativos de otros profesores"
  ],
  platform_superadmin: [
    "Ver y administrar clientes (workspaces), planes y estado de servicio",
    "Gestionar usuarios de plataforma y soporte",
    "Auditoría global de todas las cuentas"
  ]
};

function RoleInfoButton({ role, name, initials }: { role: Role; name: string; initials: string }) {
  const [open, setOpen] = useState(false);
  return <div className="relative">
    <button onClick={() => setOpen(!open)} className="hidden sm:flex items-center gap-2 pl-2 rounded-lg hover:bg-slate-50">
      <span className="grid place-items-center size-8 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] text-xs font-bold">{initials}</span>
      <span className="text-xs text-left"><strong className="block">{name}</strong><span className="muted flex items-center gap-1">{roleLabels[role]}<Info size={12}/></span></span>
    </button>
    {open && <>
      <button aria-label="Cerrar" className="fixed inset-0 z-40" onClick={() => setOpen(false)}/>
      <div className="absolute right-0 top-full mt-2 w-80 z-50 card p-5">
        <p className="eyebrow mb-1">Tu rol</p>
        <h3 className="font-black">{roleLabels[role]}</h3>
        <p className="muted text-xs mt-1 mb-3">Qué podés hacer con este usuario:</p>
        <ul className="grid gap-2 text-sm">{roleCapabilities[role].map((item) => <li key={item} className="flex gap-2"><span className="text-[var(--brand)] font-black">·</span><span>{item}</span></li>)}</ul>
      </div>
    </>}
  </div>;
}

function isActive(path: string, href: string) { return path === href || (href !== "/platform" && path.startsWith(`${href}/`)); }

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate(): void }) {
  const Icon = item.icon;
  return <Link href={item.href} onClick={onNavigate} className={`min-h-10 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-white text-[#0b1220] shadow-sm" : "text-white/72 hover:text-white hover:bg-white/8"}`}>
    <Icon size={17}/><span className="truncate">{item.label}</span>
    {item.badge && <span className={`ml-auto rounded-full min-w-5 h-5 grid place-items-center text-[10px] font-bold ${active ? "bg-[var(--brand)] text-white" : "bg-[var(--accent)] text-[#3c2b08]"}`}>{item.badge}</span>}
  </Link>;
}

function NavGroupBlock({ group, path, onNavigate, forceOpen }: { group: NavGroup; path: string; onNavigate(): void; forceOpen: boolean }) {
  const [manual, setManual] = useState<boolean | null>(null);
  const open = manual ?? forceOpen;
  const badgeTotal = group.items.reduce((sum, item) => sum + (item.badge ?? 0), 0);
  return <div>
    <button onClick={() => setManual(!open)} aria-expanded={open} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/55 hover:text-white/85 transition-colors">
      <group.icon size={16}/><span className="flex-1 text-left">{group.label}</span>
      {badgeTotal > 0 && !open && <span className="rounded-full min-w-5 h-5 grid place-items-center text-[10px] font-bold bg-[var(--accent)] text-[#3c2b08]">{badgeTotal}</span>}
      <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`}/>
    </button>
    {open && <div className="mt-0.5 ml-2 pl-3 border-l border-white/10 grid gap-0.5">{group.items.map((item) => <NavLink key={item.href} item={item} active={isActive(path, item.href)} onNavigate={onNavigate}/>)}</div>}
  </div>;
}

function InnerShell({ user, area, children }: { user: SessionUser; area: "app" | "platform" | "instructor"; children: React.ReactNode }) {
  const path = usePathname(); const [open, setOpen] = useState(false); const { state, readNotifications } = useDemo();
  const isReceptionist = area === "app" && user.role === "receptionist";

  const bandejaBadge = state.requests.filter((r) => r.workspaceId === "ws-fusion" && r.status === "pending").length + state.alerts.filter((a) => a.workspaceId === "ws-fusion" && a.status !== "resolved").length;
  const { top, groups, bottom } = useMemo(() => {
    if (area === "platform") return { top: platformNav, groups: [] as NavGroup[], bottom: [] as NavItem[] };
    if (area === "instructor") return { top: instructorNav, groups: [] as NavGroup[], bottom: [] as NavItem[] };
    const filterItem = (item: NavItem) => !isReceptionist || receptionAllowed.has(item.href);
    return {
      top: topNav.filter(filterItem),
      groups: buildNavGroups(bandejaBadge).map((group) => ({ ...group, items: group.items.filter(filterItem) })).filter((group) => group.items.length > 0),
      bottom: bottomNav.filter(filterItem)
    };
  }, [area, isReceptionist, bandejaBadge]);

  const activeTitle = [...top, ...groups.flatMap((g) => g.items), ...bottom].find((item) => isActive(path, item.href))?.label ?? "Academia SaaS";
  const initials = user.name.split(" ").map((name) => name[0]).slice(0, 2).join("");
  const quickHrefs = mobileQuickAccess[area];
  const primaryMobile = [...top, ...groups.flatMap((g) => g.items), ...bottom].filter((item) => quickHrefs.includes(item.href)).sort((a, b) => quickHrefs.indexOf(a.href) - quickHrefs.indexOf(b.href));
  const close = () => setOpen(false);

  return <div className="min-h-screen lg:pl-[264px]">
    <aside className={`fixed z-50 inset-y-0 left-0 w-[280px] lg:w-[264px] bg-[var(--sidebar)] text-white flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      <div className="h-[70px] shrink-0 flex items-center gap-3 px-5 border-b border-[var(--sidebar-line)]"><span className="grid place-items-center size-9 rounded-lg bg-[var(--brand)]"><BookOpenCheck size={18}/></span><div><strong className="block text-sm">Academia SaaS</strong><span className="text-[11px] text-white/50">Gestión integral</span></div><button onClick={close} className="lg:hidden ml-auto p-2"><X size={18}/></button></div>
      {area !== "platform" && <button className="m-3 mb-1 shrink-0 rounded-lg bg-white/8 border border-white/8 p-2.5 text-left flex items-center gap-3 hover:bg-white/12 transition-colors"><span className="grid place-items-center size-8 rounded-md bg-[var(--accent)] text-[#3c2b08] font-bold text-xs">AF</span><span className="min-w-0"><strong className="block text-[13px] truncate">Academia Fusión</strong><small className="text-white/50 text-[11px]">Sede Centro</small></span><ChevronDown className="ml-auto" size={14}/></button>}
      <nav className="nav-scroll flex-1 overflow-y-auto p-3 grid gap-0.5 content-start" aria-label="Navegación principal">
        {top.map((item) => <NavLink key={item.href} item={item} active={isActive(path, item.href)} onNavigate={close}/>)}
        {groups.length > 0 && <div className="grid gap-1 mt-1">{groups.map((group) => <NavGroupBlock key={group.id} group={group} path={path} onNavigate={close} forceOpen={group.items.some((item) => isActive(path, item.href))}/>)}</div>}
        {bottom.length > 0 && <div className="mt-2 pt-2 border-t border-[var(--sidebar-line)] grid gap-0.5">{bottom.map((item) => <NavLink key={item.href} item={item} active={isActive(path, item.href)} onNavigate={close}/>)}</div>}
      </nav>
      <div className="border-t border-[var(--sidebar-line)] p-3 shrink-0"><form action="/api/auth/logout" method="post"><button className="w-full flex items-center gap-3 rounded-lg p-2.5 text-sm text-white/65 hover:bg-white/8 hover:text-white transition-colors"><LogOut size={17}/> Cerrar sesión</button></form></div>
    </aside>
    {open && <button aria-label="Cerrar menú" className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={close}/>}
    <section className="min-w-0 pb-24 lg:pb-0">
      <header className="sticky top-0 z-30 h-[64px] bg-white/95 backdrop-blur border-b border-[var(--line)] flex items-center px-4 sm:px-7 gap-3"><button onClick={() => setOpen(true)} className="lg:hidden p-2 -ml-2" aria-label="Abrir menú"><Menu/></button><div><p className="text-[11px] muted hidden sm:block">{area === "platform" ? "Administración SaaS" : "Academia Fusión · Sede Centro"}</p><h1 className="font-bold text-[15px] tracking-tight">{activeTitle}</h1></div><div className="ml-auto flex items-center gap-2"><button onClick={readNotifications} className="relative grid place-items-center size-9 rounded-lg border border-[var(--line)] bg-white hover:bg-slate-50" aria-label="Notificaciones"><Bell size={18}/>{!state.notificationsRead && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white"/>}</button><RoleInfoButton role={user.role} name={user.name} initials={initials}/></div></header>
      <main className="p-4 sm:p-7 max-w-[1500px] mx-auto">{children}</main>
    </section>
    <nav className="lg:hidden fixed z-30 bottom-0 inset-x-0 h-[68px] bg-white border-t border-[var(--line)] grid grid-cols-5 px-1" aria-label="Navegación móvil">{primaryMobile.map((item) => { const Icon = item.icon; const active = path === item.href; return <Link key={item.href} href={item.href} className={`grid place-items-center content-center gap-1 text-[10px] font-semibold ${active ? "text-[var(--brand)]" : "muted"}`}><Icon size={19}/>{item.label.split(" ")[0]}</Link>; })}<button onClick={() => setOpen(true)} className="grid place-items-center content-center gap-1 text-[10px] font-semibold muted"><Menu size={19}/>Más</button></nav>
  </div>;
}

export function AppShell(props: { user: SessionUser; area: "app" | "platform" | "instructor"; children: React.ReactNode }) {
  return <SessionContext.Provider value={props.user}><DemoProvider><InnerShell {...props}/></DemoProvider></SessionContext.Provider>;
}
