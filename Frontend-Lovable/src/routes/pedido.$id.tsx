import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCheck, CheckCircle2, ChefHat, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { api, type ApiPedido } from "@/lib/api";
import { useLanguage } from "@/lib/language/language-context";

export const Route = createFileRoute("/pedido/$id")({
  component: PedidoStatusPage,
});

const STATES = [
  { id: "Pendiente", labelKey: "order.status.pending", fallback: "Pendiente", icon: Clock },
  { id: "Preparando", labelKey: "order.status.preparing", fallback: "Preparando", icon: ChefHat },
  { id: "Listo", labelKey: "order.status.ready", fallback: "Listo para entregar", icon: CheckCircle2 },
  { id: "Entregado", labelKey: "order.status.delivered", fallback: "Entregado", icon: CheckCheck },
];

function PedidoStatusPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [pedido, setPedido] = useState<ApiPedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getStatusLabel = (estado: string) => {
    switch (estado) {
      case "Pendiente": return t("order.status.pending", "Pendiente");
      case "Preparando": return t("order.status.preparing", "Preparando");
      case "Listo": return t("order.status.ready", "Listo para entregar");
      case "Entregado": return t("order.status.delivered", "Entregado");
      case "Cancelado": return t("order.status.cancelled", "Cancelado");
      default: return estado;
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await api.pedidos.getOne(id);
      setPedido(res.pedido);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("orderDetail.loadError", "Error al cargar el pedido"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading && !pedido) {
    return (
      <SiteLayout>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)", color: "var(--coffee)" }}>
          <p className="font-serif text-xl animate-pulse">{t("orderDetail.loading", "Cargando informacion del pedido...")}</p>
        </div>
      </SiteLayout>
    );
  }

  if (error || !pedido) {
    return (
      <SiteLayout>
        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "var(--cream)" }}>
          <p className="font-serif text-xl text-red-600 mb-6">{error || t("orderDetail.notFound", "Pedido no encontrado")}</p>
          <button onClick={() => navigate({ to: "/menu", search: { buscar: "" } })} className="btn-primary">
            {t("orderDetail.backToMenu", "Volver al menu")}
          </button>
        </div>
      </SiteLayout>
    );
  }

  const isCancelled = pedido.estado === "Cancelado";
  const currentStateIndex = STATES.findIndex((state) => state.id === pedido.estado);

  return (
    <SiteLayout>
      <div className="min-h-screen py-16 px-6" style={{ background: "var(--cream)" }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="font-script text-5xl mb-12 text-center" style={{ color: "var(--coffee)" }}>
            {t("orderDetail.title", "Información de pedido")}
          </h1>

          <div className="rounded-3xl p-8 md:p-12 shadow-lg relative overflow-hidden" style={{ background: "var(--tan)" }}>
            <div className="mb-12">
              {isCancelled ? (
                <div className="flex flex-col items-center justify-center text-red-600 space-y-3">
                  <XCircle size={64} strokeWidth={1.5} />
                  <h2 className="font-serif font-bold text-2xl">{t("orderDetail.cancelled", "Pedido Cancelado")}</h2>
                </div>
              ) : (
                <div className="relative flex justify-between items-center w-full px-4">
                  <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-1.5 bg-white/40 rounded-full -z-10" />
                  <div
                    className="absolute left-[10%] top-1/2 -translate-y-1/2 h-1.5 rounded-full -z-10 transition-all duration-700 ease-in-out"
                    style={{
                      width: `${(Math.max(0, currentStateIndex) / (STATES.length - 1)) * 80}%`,
                      background: "var(--forest)",
                    }}
                  />

                  {STATES.map((state, i) => {
                    const isActive = i === currentStateIndex;
                    const isDone = i <= currentStateIndex;
                    const Icon = state.icon;

                    return (
                      <div key={state.id} className="flex flex-col items-center gap-3 relative z-10 w-16">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${
                            isDone ? "bg-[var(--forest)] text-white scale-110" : "bg-white text-[var(--coffee)]/40"
                          } ${isActive ? "ring-4 ring-[var(--forest)]/20" : ""}`}
                        >
                          <Icon size={24} strokeWidth={isDone ? 2 : 1.5} />
                        </div>
                        <span
                          className={`font-serif text-xs md:text-sm font-bold text-center absolute -bottom-8 whitespace-nowrap transition-colors duration-300 ${
                            isDone ? "text-[var(--forest)]" : "text-[var(--coffee)]/40"
                          }`}
                        >
                          {t(state.labelKey, state.fallback)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-6 mt-16 font-serif text-[17px]" style={{ color: "var(--coffee)" }}>
              <div className="bg-white/40 p-5 rounded-xl border border-[var(--forest)]/10">
                <p className="font-bold mb-1" style={{ color: "var(--forest)" }}>{t("orderDetail.statusLabel", "Estado del pedido:")}</p>
                <p className="text-xl capitalize">{getStatusLabel(pedido.estado)}...</p>
              </div>

              {!isCancelled && pedido.estado !== "Entregado" && (
                <div className="bg-white/40 p-5 rounded-xl border border-[var(--forest)]/10">
                  <p className="font-bold mb-1" style={{ color: "var(--forest)" }}>{t("orderDetail.approxTime", "Tiempo aproximado:")}</p>
                  <p className="text-xl">{pedido.tiempoAproximado} {t("orderDetail.minutes", "minutos")}</p>
                </div>
              )}

              <div className="bg-white/40 p-5 rounded-xl border border-[var(--forest)]/10">
                <p className="font-bold mb-3" style={{ color: "var(--forest)" }}>{t("orderDetail.yourOrder", "Tu pedido:")}</p>
                <ul className="space-y-2">
                  {pedido.items.map((item, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="font-bold text-[var(--forest)]">{item.cantidad}x</span>
                      <span>{item.nombreProducto}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/40 p-5 rounded-xl border border-[var(--forest)]/10 flex justify-between items-center">
                <div>
                  <p className="font-bold mb-1" style={{ color: "var(--forest)" }}>
                    {pedido.tipoPedido === "Mesa" ? t("orderDetail.tableLabel", "Mesa:") : t("orderDetail.typeLabel", "Tipo:")}
                  </p>
                  <p className="text-xl">{pedido.tipoPedido === "Mesa" ? pedido.numeroMesa : t("orderDetail.pickup", "Para recoger")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold mb-1" style={{ color: "var(--forest)" }}>{t("orderDetail.total", "Total:")}</p>
                  <p className="text-xl font-bold">₡{pedido.total.toLocaleString("es-CR")}</p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex justify-center">
              <button
                onClick={() => navigate({ to: "/" })}
                className="flex items-center gap-2 px-10 py-4 rounded-full font-serif font-bold text-lg text-white transition-transform hover:scale-105"
                style={{ background: "var(--forest)" }}
              >
                <ArrowLeft size={20} />
                {t("orderDetail.exit", "Salir")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
