import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { Eye, EyeOff, Pencil, Trash2, X } from "lucide-react";
import { AdminTitle } from "@/components/admin/AdminLayout";
import { Btn, Card, Modal } from "@/components/admin/ui";
import { useFilters } from "@/lib/filters";
import { useMenuCategories } from "@/lib/menu-categories";
import { useProducts, type ProductItem } from "@/lib/products";
import { ImageUpload } from "@/components/admin/ImageUpload";

export const Route = createFileRoute("/admin/menu")({ component: Page });

type ProductForm = Omit<ProductItem, "filters">;

function fmt(n: number) { return `₡${n.toLocaleString("es-CR")}`; }

function blankProduct(category = ""): ProductForm {
  return { id: "", name: "", price: 0, category, desc: "", img: "", filterIds: [], visible: true, discount: false };
}

function inputCls() { return "w-full px-3 py-2 rounded-lg font-serif text-sm outline-none"; }
function inputStyle() { return { background: "var(--cream)", border: "1px solid var(--tan-dark)", color: "var(--coffee)" }; }

function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(47,36,29,.42)", backdropFilter: "blur(3px)" }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6"
        style={{ background: "var(--card)", border: "1px solid var(--tan-dark)", boxShadow: "0 24px 70px rgba(47,36,29,.22)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-3xl pr-8" style={{ color: "var(--forest)" }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full size-8 inline-flex items-center justify-center"
            style={{ color: "var(--coffee)", background: "var(--cream)", border: "1px solid var(--tan-dark)" }}
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmDialog({ open, message, busy, onCancel, onConfirm }: {
  open: boolean; message: string; busy?: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title="Eliminar producto">
      <p className="font-serif mb-6" style={{ color: "var(--coffee)" }}>{message}</p>
      <div className="mt-4 flex gap-2 justify-end">
        <Btn variant="outline" onClick={onCancel}>Cancelar</Btn>
        <Btn variant="danger" disabled={busy} onClick={onConfirm}>Eliminar</Btn>
      </div>
    </Modal>
  );
}


function Page() {
  const { items, loading, error, addProduct, editProduct, removeProduct } = useProducts();
  const { items: filters, loading: filtersLoading } = useFilters();
  const { items: menuCategories, loading: categoriesLoading, error: categoriesError } = useMenuCategories();

  const [productModal, setProductModal] = useState<{ open: boolean; mode: "add" | "edit"; data: ProductForm }>({
    open: false, mode: "add", data: blankProduct(),
  });
  const [deleteProduct, setDeleteProduct] = useState<ProductItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingDelete, setSavingDelete] = useState(false);

  const managedCategoryNames = useMemo(() => menuCategories.map(c => c.name), [menuCategories]);

  const categories = useMemo(() => {
    const unmanaged = [...new Set(items.map(i => i.category).filter(Boolean))]
      .filter(cat => !managedCategoryNames.includes(cat))
      .sort((a, b) => a.localeCompare(b, "es"));
    return [...managedCategoryNames, ...unmanaged];
  }, [items, managedCategoryNames]);

  const grouped = categories.map(category => ({
    category,
    products: items.filter(item => item.category === category),
  }));

  const visibleFilters = filters.filter(f => f.visible);
  const defaultCategory = managedCategoryNames[0] ?? "";

  const openAdd  = () => setProductModal({ open: true, mode: "add",  data: blankProduct(defaultCategory) });
  const openEdit = (p: ProductItem) => setProductModal({ open: true, mode: "edit", data: { ...p } });

  const toggleFilter = (id: string) => setProductModal(s => ({
    ...s,
    data: {
      ...s.data,
      filterIds: s.data.filterIds.includes(id)
        ? s.data.filterIds.filter(fid => fid !== id)
        : [...s.data.filterIds, id],
    },
  }));

  const saveProduct = async () => {
    const data = {
      ...productModal.data,
      name:     productModal.data.name.trim(),
      category: productModal.data.category.trim(),
      desc:     productModal.data.desc.trim(),
      img:      productModal.data.img.trim(),
      price:    Number(productModal.data.price),
    };
    if (!data.name || !data.category || !Number.isFinite(data.price) || data.price < 0 || saving) return;
    setSaving(true);
    try {
      if (productModal.mode === "edit") await editProduct(data);
      else await addProduct(data);
      setProductModal(s => ({ ...s, open: false }));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteProduct || savingDelete) return;
    setSavingDelete(true);
    try {
      await removeProduct(deleteProduct.id);
      setDeleteProduct(null);
    } finally {
      setSavingDelete(false);
    }
  };

  return (
    <div>
      <AdminTitle title="Gestor de Menú" subtitle="Administra productos, categorías y filtros del menú." />

      {(error || categoriesError) && (
        <p className="mb-4 text-sm font-serif" style={{ color: "var(--destructive)" }}>{error ?? categoriesError}</p>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif" style={{ color: "var(--coffee)" }}>Productos actuales</h2>
          <p className="text-sm font-serif" style={{ color: "var(--muted-foreground)" }}>
            Organiza los productos por categoría y controla si aparecen en el menú público.
          </p>
        </div>
        <Btn onClick={openAdd}>
          + Añadir producto
        </Btn>
      </div>

      <Card className="p-4">
        {loading ? (
        <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>Cargando productos...</p>
      ) : items.length === 0 ? (
        <div className="py-4">
          <p className="font-serif mb-4" style={{ color: "var(--coffee)" }}>No hay productos registrados.</p>
          <Btn onClick={openAdd}>
            Crear primer producto
          </Btn>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ category, products }) => (
          <section key={category}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xl font-serif" style={{ color: "var(--coffee)" }}>{category}</h3>
              <span className="text-xs font-serif" style={{ color: "var(--muted-foreground)" }}>
                {products.length} {products.length === 1 ? "producto" : "productos"}
              </span>
            </div>
            <div className="space-y-2">
              {products.map(product => (
                <article key={product.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: "var(--cream)" }}>
                  <div className="size-14 shrink-0 overflow-hidden rounded" style={{ background: "var(--tan)" }}>
                    {product.img
                      ? <img src={product.img} alt={product.name} className="h-full w-full object-cover" />
                      : <div className="h-full w-full flex items-center justify-center font-serif text-[11px]" style={{ color: "var(--coffee)", opacity: 0.45 }}>Sin imagen</div>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-serif font-semibold wrap-break-word" style={{ color: "var(--coffee)" }}>{product.name}</span>
                      <span className="font-serif text-sm shrink-0" style={{ color: "var(--forest)" }}>{fmt(product.price)}</span>
                    </div>
                    {product.desc && <p className="font-serif text-xs mt-1 line-clamp-2" style={{ color: "var(--muted-foreground)" }}>{product.desc}</p>}
                    {product.filters.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.filters.map(f => (
                          <span key={f.id} className="text-[11px] font-serif px-2 py-0.5 rounded-full" style={{ background: "var(--tan)", color: "var(--coffee)" }}>{f.name}</span>
                        ))}
                      </div>
                    )}
                    <span
                      className="mt-2 inline-flex sm:hidden items-center gap-1 px-2 py-1 rounded-full text-[11px] font-serif"
                      style={{
                        background: product.visible ? "var(--forest)" : "var(--tan)",
                        color: product.visible ? "var(--cream)" : "var(--coffee)",
                      }}
                    >
                      {product.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                      {product.visible ? "Visible" : "Oculto"}
                    </span>
                  </div>
                  <span
                    className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-serif shrink-0"
                    style={{
                      background: product.visible ? "var(--forest)" : "var(--tan)",
                      color: product.visible ? "var(--cream)" : "var(--coffee)",
                    }}
                  >
                    {product.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    {product.visible ? "Visible" : "Oculto"}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={() => openEdit(product)} className="p-1" style={{ color: "var(--forest)" }} aria-label={`Editar ${product.name}`} title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button type="button" onClick={() => setDeleteProduct(product)} className="p-1" style={{ color: "var(--destructive)" }} aria-label={`Eliminar ${product.name}`} title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
          ))}
        </div>
      )}

      {/* ── Modal añadir / editar ── */}
      </Card>

      <Dialog
        open={productModal.open}
        onClose={() => setProductModal(s => ({ ...s, open: false }))}
        title={productModal.mode === "edit" ? "Editar producto" : "Añadir producto"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)" }}>Nombre</label>
              <input className={inputCls()} style={inputStyle()} value={productModal.data.name}
                onChange={e => setProductModal(s => ({ ...s, data: { ...s.data, name: e.target.value } }))} />
            </div>
            <div>
              <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)" }}>Precio</label>
              <input type="number" min={0} className={inputCls()} style={inputStyle()} value={productModal.data.price}
                onChange={e => setProductModal(s => ({ ...s, data: { ...s.data, price: +e.target.value } }))} />
            </div>
          </div>

          <div>
            <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)" }}>Categoría</label>
            {categoriesLoading ? (
              <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>Cargando categorías...</p>
            ) : managedCategoryNames.length === 0 ? (
              <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>Crea una categoría antes de guardar productos.</p>
            ) : (
              <select className={inputCls()} style={inputStyle()} value={productModal.data.category}
                onChange={e => setProductModal(s => ({ ...s, data: { ...s.data, category: e.target.value } }))}>
                <option value="" disabled>Selecciona una categoría</option>
                {productModal.data.category && !managedCategoryNames.includes(productModal.data.category) && (
                  <option value={productModal.data.category} disabled>{productModal.data.category} (sin registrar)</option>
                )}
                {managedCategoryNames.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)" }}>Descripción / ingredientes</label>
            <textarea rows={3} className={`${inputCls()} resize-none`} style={inputStyle()} value={productModal.data.desc}
              onChange={e => setProductModal(s => ({ ...s, data: { ...s.data, desc: e.target.value } }))} />
          </div>

          <div>
            <p className="font-serif text-xs font-semibold mb-2" style={{ color: "var(--coffee)" }}>Filtros</p>
            {filtersLoading ? (
              <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>Cargando filtros...</p>
            ) : filters.length === 0 ? (
              <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>No hay filtros disponibles.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filters.map(f => {
                  const active = productModal.data.filterIds.includes(f.id);
                  return (
                    <button key={f.id} type="button" onClick={() => toggleFilter(f.id)}
                      className="px-3 py-1.5 rounded-full font-serif text-xs transition-colors"
                      style={active ? { background: "var(--forest)", color: "var(--cream)" } : { background: "var(--tan)", color: "var(--coffee)" }}>
                      {f.name}
                    </button>
                  );
                })}
              </div>
            )}
            {visibleFilters.length !== filters.length && (
              <p className="font-serif text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>Los filtros ocultos solo se muestran en administración.</p>
            )}
          </div>

          <label className="flex items-center gap-2 font-serif text-sm" style={{ color: "var(--coffee)" }}>
            <input type="checkbox" checked={productModal.data.visible}
              onChange={e => setProductModal(s => ({ ...s, data: { ...s.data, visible: e.target.checked } }))} />
            Visible al público
          </label>

          <ImageUpload value={productModal.data.img}
            onChange={img => setProductModal(s => ({ ...s, data: { ...s.data, img } }))} />

          <div className="flex justify-end gap-3 pt-2">
            <button className="px-5 py-2 rounded-lg font-serif text-sm border" style={{ borderColor: "var(--tan-dark)", color: "var(--coffee)" }}
              onClick={() => setProductModal(s => ({ ...s, open: false }))}>Cancelar</button>
            <button className="px-5 py-2 rounded-lg font-serif text-sm text-white disabled:opacity-50" style={{ background: "var(--forest)" }}
              disabled={saving} onClick={saveProduct}>
              {saving ? "Guardando..." : productModal.mode === "edit" ? "Guardar cambios" : "Guardar"}
            </button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteProduct}
        busy={savingDelete}
        message={`¿Segur@ que deseas eliminar ${deleteProduct?.name} del menú?`}
        onCancel={() => setDeleteProduct(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
