import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Coffee, Minus, Plus, Search, ShoppingCart, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AnimatedItem } from "@/components/AnimatedItem";
import { MenuPdfControls } from "@/components/menu/MenuPdfControls";
import { SiteLayout } from "@/components/SiteLayout";
import { api, type ApiProduct } from "@/lib/api";
import { fetchFilters, type FilterItem } from "@/lib/filters";
import { useLanguage } from "@/lib/language/language-context";
import { fetchPublicMenuCategories, type MenuCategory } from "@/lib/menu-categories";
import type { MenuItem } from "@/lib/menu-types";

export const Route = createFileRoute("/menu")({
  validateSearch: (search: Record<string, unknown>) => ({
    buscar: typeof search.buscar === "string" ? search.buscar : "",
  }),
  head: () => ({
    meta: [
      { title: "Menú - Amorena Coffee & Garden" },
      { name: "description", content: "Descubre el menú artesanal de Amorena: cafés, desayunos, almuerzos y postres elaborados con productos locales." },
    ],
  }),
  component: MenuPage,
});

type CartItem = MenuItem & { qty: number };

function toItem(product: ApiProduct): MenuItem {
  const visibleFilters = product.filtros?.filter((filter) => filter.visible) ?? [];

  return {
    id: product._id,
    name: product.nombre,
    nameEn: product.nombre_en,
    price: product.precio,
    desc: product.descripcion ?? "",
    descEn: product.descripcion_en,
    img: (product.imagen ?? "").trim(),
    cat: product.categoria ?? "General",
    filterIds: visibleFilters.map((filter) => filter._id),
    tags: visibleFilters.map((filter) => ({ name: filter.nombre, nameEn: filter.nombre_en })),
    stock: product.cantidadStock,
  };
}

function fmt(value: number) {
  return `₡${value.toLocaleString("es-CR")}`;
}

function MenuPage() {
  const { buscar } = Route.useSearch();
  const { t, text } = useLanguage();
  const [rawItems, setRawItems] = useState<MenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [menuFilters, setMenuFilters] = useState<FilterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sideCat, setSideCat] = useState<string | null>(null);
  const [search, setSearch] = useState(buscar);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [customize, setCustomize] = useState<MenuItem | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.products.getPublic(),
      fetchPublicMenuCategories().catch(() => []),
      fetchFilters().catch(() => []),
    ])
      .then(([res, publicCategories, filters]) => {
        setRawItems(res.products.map(toItem));
        setMenuCategories(publicCategories);
        setMenuFilters(filters.filter((filter) => filter.visible));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSearch(buscar);
  }, [buscar]);

  const categories = useMemo(() => menuCategories.map((category) => category.name), [menuCategories]);
  const categoryByName = useMemo(() => new Map(menuCategories.map((category) => [category.name, category])), [menuCategories]);
  const visibleCategoryNames = useMemo(() => new Set(categories), [categories]);
  const catalogMaxPrice = Math.max(0, ...rawItems.map((item) => item.price));
  const activeMaxPrice = maxPrice ?? catalogMaxPrice;

  const categoryLabel = (categoryName: string) => {
    const category = categoryByName.get(categoryName);
    if (category) return text(category.name, category.name_en);
    if (categoryName === "General") return t("menu.category.general", "General");
    return categoryName;
  };

  const clearFilters = () => {
    setSideCat(null);
    setSearch("");
    setSelectedFilters([]);
    setMaxPrice(null);
  };

  const toggleFilter = (id: string) => {
    setSelectedFilters((current) =>
      current.includes(id) ? current.filter((filterId) => filterId !== id) : [...current, id],
    );
  };

  const addToCart = (item: MenuItem) => setCart((current) => {
    const existing = current.find((cartItem) => cartItem.id === item.id);
    return existing
      ? current.map((cartItem) => (cartItem.id === item.id ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem))
      : [...current, { ...item, qty: 1 }];
  });

  const updateQty = (id: string, delta: number) => setCart((current) =>
    current.map((cartItem) => (cartItem.id === id ? { ...cartItem, qty: Math.max(0, cartItem.qty + delta) } : cartItem)).filter((cartItem) => cartItem.qty > 0),
  );

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const filtered = useMemo(() => rawItems.filter((item) => {
    if (!visibleCategoryNames.has(item.cat)) return false;
    if (sideCat && item.cat !== sideCat) return false;

    const query = search.trim().toLowerCase();
    if (query) {
      const searchableValues = [
        text(item.name, item.nameEn),
        text(item.desc, item.descEn),
        categoryLabel(item.cat),
        ...(item.tags ?? []).map((tag) => text(tag.name, tag.nameEn)),
      ];
      if (!searchableValues.some((value) => value.toLowerCase().includes(query))) return false;
    }

    if (item.price > activeMaxPrice) return false;
    if (selectedFilters.length > 0 && !selectedFilters.every((filterId) => item.filterIds.includes(filterId))) return false;
    return true;
  }), [rawItems, visibleCategoryNames, sideCat, search, activeMaxPrice, selectedFilters, text, categoryLabel]);

  const groupedByCategory = useMemo(() => categories
    .map((cat) => ({
      cat,
      label: categoryLabel(cat),
      items: filtered.filter((item) => item.cat === cat),
    }))
    .filter((group) => group.items.length > 0), [categories, filtered, categoryLabel]);

  return (
    <SiteLayout>
      <div className="flex min-h-screen" style={{ background: "var(--cream)" }}>
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r py-8 px-4 gap-2 sticky top-0 h-screen overflow-y-auto" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <div className="relative mb-4">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("menu.search.placeholder", "Buscar producto...")}
              className="w-full pl-8 pr-3 py-1.5 rounded font-serif text-xs outline-none"
              style={{ background: "var(--cream)", border: "1px solid var(--border)", color: "var(--coffee)" }}
            />
          </div>

          <p className="font-serif text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--coffee)", opacity: .6 }}>{t("menu.sidebar.categories", "Categorías")}</p>
          {loading ? (
            <p className="font-serif text-xs" style={{ color: "var(--muted-foreground)" }}>{t("menu.sidebar.loading", "Cargando...")}</p>
          ) : categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSideCat((current) => (current === cat ? null : cat))}
              className="px-3 py-2.5 rounded-lg font-serif text-sm transition-all text-left"
              style={sideCat === cat ? { background: "var(--forest)", color: "var(--cream)" } : { color: "var(--coffee)" }}
            >
              {categoryLabel(cat)}
            </button>
          ))}

          <hr style={{ borderColor: "var(--border)" }} className="my-3" />

          <p className="font-serif text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--coffee)", opacity: .6 }}>{t("menu.sidebar.filters", "Filtros")}</p>
          {loading ? (
            <p className="font-serif text-xs" style={{ color: "var(--muted-foreground)" }}>{t("menu.sidebar.loading", "Cargando...")}</p>
          ) : menuFilters.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {menuFilters.map((filter) => {
                const active = selectedFilters.includes(filter.id);
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => toggleFilter(filter.id)}
                    className="rounded-full px-3 py-1 font-serif text-xs transition-all"
                    style={active
                      ? { background: "var(--forest)", color: "var(--cream)", border: "1px solid var(--forest)" }
                      : { background: "var(--cream)", color: "var(--coffee)", border: "1px solid var(--border)" }}
                    aria-pressed={active}
                  >
                    {text(filter.name, filter.name_en)}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="font-serif text-xs" style={{ color: "var(--muted-foreground)" }}>{t("menu.sidebar.noFilters", "No hay filtros visibles.")}</p>
          )}

          <hr style={{ borderColor: "var(--border)" }} className="my-3" />

          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-serif text-sm transition-all text-left"
            style={{ color: "var(--coffee)" }}
          >
            <ShoppingCart size={16} />
            {t("menu.cart.title", "Carrito")}
            {cartCount > 0 && (
              <span className="ml-auto text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center" style={{ background: "var(--forest)", color: "var(--cream)" }}>
                {cartCount}
              </span>
            )}
          </button>

          <hr style={{ borderColor: "var(--border)" }} className="my-3" />

          <p className="font-serif text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--coffee)", opacity: .6 }}>{t("menu.sidebar.price", "Precio")}</p>
          <div className="flex justify-between font-serif text-xs mb-1" style={{ color: "var(--coffee)" }}>
            <span>₡0</span><span>{fmt(activeMaxPrice)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={catalogMaxPrice || 10000}
            step={100}
            value={activeMaxPrice}
            onChange={(event) => setMaxPrice(Number(event.target.value))}
            className="w-full accent-[var(--forest)]"
          />

          <button
            onClick={clearFilters}
            className="mt-4 w-full rounded-lg py-2 font-serif text-xs"
            style={{ border: "1px solid var(--forest)", color: "var(--forest)" }}
          >
            {t("menu.sidebar.clear", "Limpiar filtros")}
          </button>
        </aside>

        <main className="flex-1 px-6 py-10">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-start justify-between gap-4 mb-8">
              <div>
                <p className="font-serif text-xs uppercase tracking-widest mb-1" style={{ color: "var(--tan-dark)" }}>{t("menu.eyebrow", "Menú interactivo")}</p>
                <h1 className="text-5xl md:text-6xl" style={{ color: "var(--forest)" }}>{t("menu.title", "Explora nuestro menú")}</h1>
                <p className="font-serif mt-2" style={{ color: "var(--coffee)" }}>{t("menu.subtitle", "Busca y filtra nuestros platos y bebidas para encontrar lo que más te guste.")}</p>
              </div>
              <div className="hidden lg:flex flex-col items-center gap-3 rounded-xl p-5 shrink-0 w-52 text-center" style={{ background: "var(--tan)", border: "1px solid var(--tan-dark)" }}>
                <p className="font-serif text-sm font-semibold" style={{ color: "var(--coffee)" }}>{t("menu.download.question", "¿Quieres descargar o compartir el menú?")}</p>
                <p className="font-serif text-xs" style={{ color: "var(--coffee)", opacity: .8 }}>{t("menu.download.hint", "¡Descarga el menú actualizado aquí!")}</p>
                <MenuPdfControls items={rawItems} categories={menuCategories} disabled={loading} />
              </div>
            </div>

            <div className="lg:hidden rounded-xl p-4 mb-8" style={{ background: "var(--tan)", border: "1px solid var(--tan-dark)" }}>
              <p className="font-serif text-sm font-semibold mb-3" style={{ color: "var(--coffee)" }}>{t("menu.download.question", "¿Quieres descargar o compartir el menú?")}</p>
              <MenuPdfControls items={rawItems} categories={menuCategories} disabled={loading} />
            </div>

            {loading && (
              <p className="font-serif text-center py-20" style={{ color: "var(--coffee)", opacity: .5 }}>{t("menu.loading", "Cargando menú...")}</p>
            )}

            {!loading && groupedByCategory.length > 0 && (
              <div className="space-y-12">
                {groupedByCategory.map((group) => (
                  <section key={group.cat}>
                    <div className="flex items-center gap-4 mb-5">
                      <h2 className="font-script text-4xl shrink-0" style={{ color: "var(--coffee)" }}>
                        {group.label}
                      </h2>
                      <div className="h-px flex-1" style={{ background: "var(--tan-dark)" }} />
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {group.items.map((item, index) => (
                        <AnimatedItem key={item.id} index={index}>
                          <MenuCard item={item} onAdd={addToCart} onCustomize={setCustomize} />
                        </AnimatedItem>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <p className="font-serif text-center py-20" style={{ color: "var(--coffee)", opacity: .5 }}>{t("menu.empty", "No se encontraron productos con estos filtros.")}</p>
            )}
          </div>
        </main>
      </div>

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <aside className="relative flex flex-col w-80 h-full shadow-2xl" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-script text-3xl" style={{ color: "var(--coffee)" }}>{t("menu.cart.title", "Carrito")}</h2>
              <button onClick={() => setCartOpen(false)} aria-label={t("menu.cart.close", "Cerrar carrito")}><X size={20} style={{ color: "var(--coffee)" }} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <p className="font-serif text-center mt-10" style={{ color: "var(--coffee)", opacity: .5 }}>{t("menu.cart.empty", "Tu carrito está vacío.")}</p>
              ) : cart.map((cartItem) => {
                const itemName = text(cartItem.name, cartItem.nameEn);
                return (
                  <div key={cartItem.id} className="flex gap-3 items-center">
                    {cartItem.img ? (
                      <img src={cartItem.img} alt={itemName} className="w-14 h-14 object-cover rounded-lg" />
                    ) : (
                      <ProductImageFallback name={itemName} compact />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-semibold text-sm truncate" style={{ color: "var(--coffee)" }}>{itemName}</p>
                      <p className="font-serif text-xs" style={{ color: "var(--forest)" }}>{fmt(cartItem.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(cartItem.id, -1)} className="p-1 rounded" aria-label={t("menu.cart.subtract", "Restar")} style={{ background: "var(--tan)" }}><Minus size={12} /></button>
                      <span className="font-serif text-sm w-5 text-center">{cartItem.qty}</span>
                      <button onClick={() => updateQty(cartItem.id, 1)} className="p-1 rounded" aria-label={t("menu.cart.addOne", "Sumar")} style={{ background: "var(--tan)" }}><Plus size={12} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
            {cart.length > 0 && (
              <div className="p-5 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="flex justify-between font-serif font-semibold mb-4" style={{ color: "var(--coffee)" }}>
                  <span>{t("menu.cart.total", "Total")}</span><span>{fmt(cartTotal)}</span>
                </div>
                <button 
                  className="btn-primary w-full justify-center"
                  onClick={() => {
                    sessionStorage.setItem("amorena_cart", JSON.stringify(cart));
                    navigate({ to: "/checkout" });
                  }}
                >
                  {t("menu.cart.checkout", "Realizar pedido")}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {customize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCustomize(null)} />
          <div className="relative rounded-2xl w-full max-w-md p-6 shadow-2xl" style={{ background: "var(--card)" }}>
            <button onClick={() => setCustomize(null)} className="absolute top-4 right-4" aria-label={t("menu.customize.close", "Cerrar")}><X size={20} style={{ color: "var(--coffee)" }} /></button>
            {customize.img ? (
              <img src={customize.img} alt={text(customize.name, customize.nameEn)} className="w-full h-48 object-cover rounded-xl mb-4" />
            ) : (
              <ProductImageFallback name={text(customize.name, customize.nameEn)} className="h-48 mb-4 rounded-xl" />
            )}
            <h3 className="font-script text-4xl mb-1" style={{ color: "var(--coffee)" }}>{text(customize.name, customize.nameEn)}</h3>
            <p className="font-serif text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>{text(customize.desc, customize.descEn)}</p>
            <p className="font-serif text-xs mb-2 font-semibold uppercase tracking-wider" style={{ color: "var(--coffee)", opacity: .6 }}>{t("menu.customize.notes", "Notas especiales")}</p>
            <textarea rows={3} placeholder={t("menu.customize.placeholder", "Ej: sin cebolla, extra aguacate...")} className="w-full rounded-lg px-3 py-2 font-serif text-sm outline-none resize-none" style={{ background: "var(--cream)", border: "1px solid var(--border)", color: "var(--coffee)" }} />
            <button className="btn-primary w-full justify-center mt-4" onClick={() => { addToCart(customize); setCustomize(null); }}>
              {t("menu.customize.addToCart", "Agregar al carrito")} - {fmt(customize.price)}
            </button>
          </div>
        </div>
      )}

      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg md:hidden"
          style={{ background: "var(--forest)", color: "var(--cream)" }}
        >
          <ShoppingCart size={18} />
          <span className="font-serif text-sm font-semibold">{fmt(cartTotal)}</span>
        </button>
      )}
    </SiteLayout>
  );
}

function MenuCard({ item, onAdd, onCustomize }: { item: MenuItem; onAdd: (item: MenuItem) => void; onCustomize: (item: MenuItem) => void }) {
  const { t, text } = useLanguage();
  const itemName = text(item.name, item.nameEn);
  const itemDescription = text(item.desc, item.descEn);

  return (
    <article className="bg-[var(--card)] rounded-xl overflow-hidden border shadow-sm hover:shadow-lg transition-all hover:-translate-y-1" style={{ borderColor: "var(--border)" }}>
      <div className="aspect-[4/3] overflow-hidden">
        {item.img ? (
          <img src={item.img} alt={itemName} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        ) : (
          <ProductImageFallback name={itemName} className="h-full" />
        )}
      </div>
      <div className="p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-script text-3xl" style={{ color: "var(--coffee)" }}>{itemName}</h3>
          <span className="font-serif font-semibold text-lg shrink-0" style={{ color: "var(--forest)" }}>{fmt(item.price)}</span>
        </div>
        <p className="font-serif mt-2 text-[15px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{itemDescription}</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {item.tags?.map((tag) => (
            <span key={tag.name} className="text-xs font-serif px-2 py-0.5 rounded-full" style={{ background: "var(--tan)", color: "var(--coffee)" }}>
              {text(tag.name, tag.nameEn)}
            </span>
          ))}
          {item.stock !== undefined && (
            <span className="text-xs font-serif px-2 py-0.5 rounded-full" style={{ background: "var(--cream)", color: "var(--coffee)", opacity: .7 }}>
              {t("menu.stock", "Stock")}: {item.stock}
            </span>
          )}
        </div>
        <div className="flex gap-2 mt-5">
          <button className="btn-primary flex-1 justify-center" onClick={() => onAdd(item)}>{t("menu.product.add", "Agregar")}</button>
          <button className="flex-1 justify-center font-serif text-sm py-2 px-4 rounded-lg border transition-colors" style={{ borderColor: "var(--forest)", color: "var(--forest)" }} onClick={() => onCustomize(item)}>
            {t("menu.product.customize", "Personalizar")}
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductImageFallback({ name, compact = false, className = "" }: { name: string; compact?: boolean; className?: string }) {
  const { t } = useLanguage();
  const ariaLabel = `${t("menu.product.noPhotoAria", "Sin foto de")} ${name}`;

  if (compact) {
    return (
      <div
        className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "var(--tan)", color: "var(--coffee)" }}
        aria-label={ariaLabel}
      >
        <Coffee size={18} strokeWidth={1.7} />
      </div>
    );
  }

  return (
    <div
      className={`w-full flex flex-col items-center justify-center text-center px-5 ${className}`}
      style={{ background: "var(--cream)", color: "var(--coffee)" }}
      aria-label={ariaLabel}
    >
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: "var(--card)", color: "var(--forest)" }}>
        <Coffee size={26} strokeWidth={1.6} />
      </div>
      <p className="font-serif text-xs uppercase tracking-wider font-semibold" style={{ opacity: .65 }}>{t("menu.product.noPhoto", "Sin foto")}</p>
    </div>
  );
}
