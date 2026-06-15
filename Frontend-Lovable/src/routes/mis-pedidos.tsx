import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCheck, CheckCircle2, ChefHat, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { api, type ApiPedido } from "@/lib/api";
import { useLanguage } from "@/lib/language/language-context";

export const Route = createFileRoute("/mis-pedidos")({
  component: MisPedidosPage,
});

function MisPedidosPage() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [pedidos, setPedidos] = useState<ApiPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [pedidosPage, setPedidosPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchPedidos = async () => {
    try {
      const localOrders: string[] = JSON.parse(localStorage.getItem("amorena_mis_pedidos") || "[]");
      if (localOrders.length === 0) {
        setPedidos([]);
        setLoading(false);
        return;
      }

      const orderPromises = localOrders.map((id) => api.pedidos.getOne(id).catch(() => null));
      const results = await Promise.all(orderPromises);
      const validOrders = results.filter((res): res is { pedido: ApiPedido } => res !== null).map((res) => res.pedido);
      validOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setPedidos(validOrders);
    } catch (err) {
      console.error("Error fetching mis pedidos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
    const interval = setInterval(fetchPedidos, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case "Pendiente": return <Clock size={20} className="text-yellow-600" />;
      case "Preparando": return <ChefHat size={20} className="text-orange-600" />;
      case "Listo": return <CheckCircle2 size={20} className="text-green-600" />;
      case "Entregado": return <CheckCheck size={20} className="text-blue-600" />;
      case "Cancelado": return <XCircle size={20} className="text-red-600" />;
      default: return <Clock size={20} />;
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "Pendiente": return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "Preparando": return "bg-orange-100 border-orange-300 text-orange-800";
      case "Listo": return "bg-green-100 border-green-300 text-green-800";
      case "Entregado": return "bg-blue-100 border-blue-300 text-blue-800";
      case "Cancelado": return "bg-red-100 border-red-300 text-red-800";
      default: return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

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

  const totalPages = Math.ceil(pedidos.length / ITEMS_PER_PAGE);
  const paginatedPedidos = pedidos.slice((pedidosPage - 1) * ITEMS_PER_PAGE, pedidosPage * ITEMS_PER_PAGE);

  return (
    <SiteLayout>
      <div className="min-h-screen py-16 px-6" style={{ background: "var(--cream)" }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="font-script text-5xl mb-8 text-center" style={{ color: "var(--coffee)" }}>
            {t("myOrders.title", "Mis Pedidos")}
          </h1>

          {loading && pedidos.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-serif text-xl animate-pulse" style={{ color: "var(--coffee)" }}>
                {t("myOrders.loading", "Cargando pedidos...")}
              </p>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="text-center py-12 bg-white/50 rounded-3xl p-8 border border-[var(--tan-dark)] shadow-sm">
              <p className="font-serif text-xl mb-6" style={{ color: "var(--coffee)" }}>
                {t("myOrders.empty", "No tienes pedidos recientes.")}
              </p>
              <button
                onClick={() => navigate({ to: "/menu", search: { buscar: "" } })}
                className="inline-block py-3 px-8 rounded-full font-serif font-bold text-white transition-transform hover:scale-105"
                style={{ background: "var(--forest)" }}
              >
                {t("myOrders.cta", "Hacer un pedido")}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {paginatedPedidos.map((pedido) => (
                <div key={pedido._id} className="bg-white rounded-2xl p-6 shadow-md border border-[var(--tan)] hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                    <div>
                      <h3 className="font-serif font-bold text-lg" style={{ color: "var(--coffee)" }}>
                        {t("myOrders.card.titlePrefix", "Pedido para")} {pedido.nombreCliente}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(pedido.createdAt || Date.now()).toLocaleDateString(language === "en" ? "en-US" : "es-ES", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(pedido.estado)}`}>
                      {getStatusIcon(pedido.estado)}
                      <span className="font-bold text-sm capitalize">{getStatusLabel(pedido.estado)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-t pt-4 border-gray-100">
                    <div className="font-serif text-sm text-gray-600">
                      <p>{pedido.items.length} {pedido.items.length === 1 ? t("myOrders.item.singular", "articulo") : t("myOrders.item.plural", "articulos")}</p>
                      <p className="font-bold text-lg" style={{ color: "var(--forest)" }}>₡{pedido.total.toLocaleString("es-CR")}</p>
                    </div>

                    <Link
                      to="/pedido/$id"
                      params={{ id: pedido._id }}
                      className="flex items-center gap-2 text-sm font-bold transition-colors hover:text-[var(--forest)]"
                      style={{ color: "var(--coffee)" }}
                    >
                      {t("myOrders.tracking", "Ver seguimiento")} <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={() => setPedidosPage((p) => Math.max(1, p - 1))}
                    disabled={pedidosPage === 1}
                    className="px-4 py-2 rounded-lg text-sm font-serif font-bold transition-colors disabled:opacity-50"
                    style={{ background: "var(--tan)", color: "var(--coffee)" }}
                  >
                    {t("myOrders.pagination.prev", "Anterior")}
                  </button>
                  <span className="text-sm font-serif" style={{ color: "var(--coffee)" }}>
                    {t("myOrders.pagination.page", "Pagina")} {pedidosPage} {t("myOrders.pagination.of", "de")} {totalPages}
                  </span>
                  <button
                    onClick={() => setPedidosPage((p) => Math.min(totalPages, p + 1))}
                    disabled={pedidosPage === totalPages}
                    className="px-4 py-2 rounded-lg text-sm font-serif font-bold transition-colors disabled:opacity-50"
                    style={{ background: "var(--tan)", color: "var(--coffee)" }}
                  >
                    {t("myOrders.pagination.next", "Siguiente")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
