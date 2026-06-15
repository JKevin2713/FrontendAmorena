import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LogOut, User } from "lucide-react";
import { logout, useAuth } from "@/lib/admin-auth";
import { Logo } from "@/components/Logo";

const items = [
  { to: "/admin/inicio", label: "Imágenes — Inicio" },
  { to: "/admin/menu", label: "Menú y productos" },
  { to: "/admin/eventos", label: "Eventos" },
  { to: "/admin/horario", label: "Horario y Reservas" },
  { to: "/admin/promociones", label: "Promociones" },
  { to: "/admin/conozcanos", label: "Imágenes — Conózcanos" },
  { to: "/admin/preguntas", label: "Preguntas frecuentes" },
  { to: "/admin/resenas", label: "Reseñas" },
  { to: "/admin/filtros", label: "Filtros" },
  { to: "/admin/categorias", label: "Categorías" },
  { to: "/admin/lenguajes", label: "Lenguajes" },
  { to: "/admin/informacion", label: "Información del negocio" },
  { to: "/admin/redes", label: "Redes Sociales" },
  { to: "/admin/usuarios", label: "Usuarios Administradores" },
  { to: "/admin/pedidos", label: "Pedidos" },
] as const;

export function AdminLayout() {
  const user = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (user === null) navigate({ to: "/login", search: { redirect: path } as never });
  }, [user, navigate, path]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex" style={{ background: "var(--cream)" }}>
      <aside className="w-72 shrink-0 border-r flex flex-col" style={{ background: "var(--tan)", borderColor: "var(--tan-dark)" }}>
        <div className="px-5 py-5 border-b" style={{ borderColor: "var(--tan-dark)" }}>
          <Link to="/"><Logo /></Link>
        </div>
        <div className="px-5 py-4 flex items-center gap-3 border-b" style={{ borderColor: "var(--tan-dark)" }}>
          <div className="size-11 rounded-full flex items-center justify-center" style={{ background: "var(--forest)", color: "var(--cream)" }}>
            <User size={20} />
          </div>
          <div>
            <div className="font-serif font-semibold" style={{ color: "var(--coffee)" }}>{user.name}</div>
            <div className="text-xs" style={{ color: "var(--coffee)", opacity: .7 }}>{user.role}</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 font-serif text-[15px]">
          {items.map((it) => {
            const active = path.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className="block px-3 py-2 rounded transition-colors"
                style={{
                  color: active ? "var(--cream)" : "var(--coffee)",
                  background: active ? "var(--forest)" : "transparent",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => { logout(); navigate({ to: "/login", search: { redirect: "/admin/informacion" } }); }}
          className="m-3 flex items-center gap-2 px-3 py-2 rounded font-serif"
          style={{ color: "var(--coffee)", border: "1px solid var(--tan-dark)" }}
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export function AdminTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-8 pb-4 border-b" style={{ borderColor: "var(--tan-dark)" }}>
      <h1 className="text-5xl" style={{ color: "var(--forest)" }}>{title}</h1>
      {subtitle && <p className="font-serif italic mt-2" style={{ color: "var(--coffee)" }}>{subtitle}</p>}
    </header>
  );
}
