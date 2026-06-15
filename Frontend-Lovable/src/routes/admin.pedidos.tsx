import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Check, X, Clock, ChefHat, CheckCircle2, CheckCheck, RefreshCw } from "lucide-react";
import { AdminTitle } from "@/components/admin/AdminLayout";
import { Card, Btn } from "@/components/admin/ui";
import { api, type ApiPedido } from "@/lib/api";

export const Route = createFileRoute("/admin/pedidos")({ component: Page });

type FilterType = "Pendientes" | "En Proceso" | "Completados" | "Cancelados";

function Page() {
  const [items, setItems] = useState<ApiPedido[]>([]);
  const [filter, setFilter] = useState<FilterType>("Pendientes");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchPedidos = async () => {
    try {
      const res = await api.pedidos.getAll();
      setItems(res.pedidos);
    } catch (error) {
      console.error("Error fetching pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
    const interval = setInterval(fetchPedidos, 15000); // Auto-refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const setStatus = async (id: string, status: ApiPedido["estado"], time?: number) => {
    setUpdatingId(id);
    try {
      await api.pedidos.updateStatus(id, { estado: status, tiempoAproximado: time });
      await fetchPedidos();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("No se pudo actualizar el estado.");
    } finally {
      setUpdatingId(null);
    }
  };

  const list = useMemo(() => {
    return items.filter((o) => {
      if (filter === "Pendientes") return o.estado === "Pendiente";
      if (filter === "En Proceso") return o.estado === "Preparando" || o.estado === "Listo";
      if (filter === "Completados") return o.estado === "Entregado";
      if (filter === "Cancelados") return o.estado === "Cancelado";
      return false;
    });
  }, [items, filter]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
  const paginatedList = list.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <AdminTitle title="Gestionar pedidos" subtitle="Pedidos recibidos desde el menú." />
        <button 
          onClick={() => { setLoading(true); fetchPedidos(); }}
          className="p-2 rounded-full hover:bg-[var(--tan)] text-[var(--forest)] transition-colors flex items-center gap-2 font-serif text-sm font-bold"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(["Pendientes", "En Proceso", "Completados", "Cancelados"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className="px-4 py-2 rounded font-serif whitespace-nowrap transition-colors"
            style={{ 
              background: filter === s ? "var(--forest)" : "transparent", 
              color: filter === s ? "var(--cream)" : "var(--forest)", 
              border: "1.5px solid var(--forest)" 
            }}>
            {s}
          </button>
        ))}
      </div>
      
      {loading && items.length === 0 ? (
        <p className="font-serif italic" style={{ color: "var(--coffee)" }}>Cargando pedidos...</p>
      ) : list.length === 0 ? (
        <p className="font-serif italic" style={{ color: "var(--coffee)" }}>No hay pedidos en esta categoría.</p>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            {paginatedList.map((o) => (
              <Card key={o._id} className={updatingId === o._id ? "opacity-50 pointer-events-none" : ""}>
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-serif font-bold" style={{ color: "var(--coffee)" }}>{o.nombreCliente}</h3>
                        <p className="text-sm font-serif flex gap-2" style={{ color: "var(--coffee)", opacity: .8 }}>
                          <span>📞 {o.telefonoCliente}</span>
                          {o.correoCliente && <span>✉️ {o.correoCliente}</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-1" style={{ background: "var(--tan)", color: "var(--forest)" }}>
                          {o.tipoPedido === "Mesa" ? `MESA: ${o.numeroMesa}` : "RECOGER"}
                        </span>
                        <p className="text-xs font-serif font-bold" style={{ color: "var(--forest)" }}>
                          {new Date(o.createdAt || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/50 rounded p-3 mb-4">
                      <ul className="space-y-1">
                        {o.items.map((item, idx) => (
                          <li key={idx} className="font-serif text-[15px] flex justify-between" style={{ color: "var(--coffee)" }}>
                            <span><span className="font-bold text-[var(--forest)]">{item.cantidad}x</span> {item.nombreProducto}</span>
                            <span className="font-bold">₡{(item.precioUnitario * item.cantidad).toLocaleString("es-CR")}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 pt-2 border-t border-[var(--tan-dark)] flex justify-between font-serif font-bold text-lg" style={{ color: "var(--forest)" }}>
                        <span>Total:</span>
                        <span>₡{o.total.toLocaleString("es-CR")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-[var(--tan-dark)]">
                    {o.estado === "Pendiente" && (
                      <>
                        <Btn onClick={() => setStatus(o._id, "Preparando", 15)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
                          <ChefHat size={16} /> Preparar (15m)
                        </Btn>
                        <Btn onClick={() => setStatus(o._id, "Preparando", 30)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
                          <ChefHat size={16} /> Preparar (30m)
                        </Btn>
                        <Btn variant="danger" onClick={() => { if(confirm('¿Seguro que deseas cancelar?')) setStatus(o._id, "Cancelado") }}>
                          <X size={16} /> Cancelar
                        </Btn>
                      </>
                    )}
                    {o.estado === "Preparando" && (
                      <Btn onClick={() => setStatus(o._id, "Listo")} className="w-full">
                        <CheckCircle2 size={16} /> Marcar como Listo
                      </Btn>
                    )}
                    {o.estado === "Listo" && (
                      <Btn onClick={() => setStatus(o._id, "Entregado")} className="w-full bg-green-600 hover:bg-green-700 text-white border-green-600">
                        <CheckCheck size={16} /> Entregar al cliente
                      </Btn>
                    )}
                    {o.estado === "Entregado" && (
                      <p className="w-full text-center font-serif text-sm text-green-600 font-bold py-2">
                        <CheckCheck size={16} className="inline mr-1" /> Pedido Completado
                      </p>
                    )}
                    {o.estado === "Cancelado" && (
                      <p className="w-full text-center font-serif text-sm text-red-600 font-bold py-2">
                        <X size={16} className="inline mr-1" /> Pedido Cancelado
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 pb-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg text-sm font-serif font-bold transition-colors disabled:opacity-50"
                style={{ background: "var(--tan)", color: "var(--coffee)" }}
              >
                Anterior
              </button>
              <span className="text-sm font-serif" style={{ color: "var(--coffee)" }}>
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg text-sm font-serif font-bold transition-colors disabled:opacity-50"
                style={{ background: "var(--tan)", color: "var(--coffee)" }}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
