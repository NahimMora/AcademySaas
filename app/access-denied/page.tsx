import Link from "next/link";
import { ShieldX } from "lucide-react";
export default function Denied() { return <main className="min-h-screen grid place-items-center p-5"><section className="card p-10 max-w-md text-center"><ShieldX className="mx-auto text-red-600" size={48}/><h1 className="text-2xl font-black mt-5">Acceso denegado</h1><p className="muted mt-2">Tu rol o alcance no permite ingresar a este módulo. El intento puede quedar auditado.</p><Link className="btn btn-primary mt-7" href="/login">Volver a un acceso seguro</Link></section></main>; }
