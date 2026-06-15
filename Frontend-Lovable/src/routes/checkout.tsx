import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { useLanguage } from "@/lib/language/language-context";
import { api, type ApiPedidoItem } from "@/lib/api";
import { MapPin, Car } from "lucide-react";
import type { MenuItem } from "@/lib/menu-types";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

type CartItem = MenuItem & { qty: number };

function CheckoutPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [table, setTable] = useState("");
  const [orderType, setOrderType] = useState<"Mesa" | "Recoger" | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string, phone?: string, email?: string, table?: string, type?: string }>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    let formatted = val.match(/.{1,4}/g)?.join(" ") || "";
    if (formatted.length > 19) formatted = formatted.substring(0, 19);
    setCardNumber(formatted);
  };

  const getCardType = (number: string) => {
    const clean = number.replace(/\s/g, "");
    if (!clean) return "";
    if (clean.startsWith("4")) return "Visa";
    if (clean.startsWith("5")) return "MasterCard";
    if (clean.startsWith("3")) return "Amex";
    if (clean.startsWith("6")) return "Discover";
    return t("checkout.payment.genericCard", "Tarjeta Generica");
  };

  const handleCardExpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length >= 2) {
      setCardExp(`${val.substring(0, 2)}/${val.substring(2, 4)}`);
    } else {
      setCardExp(val);
    }
  };

  useEffect(() => {
    const savedCart = sessionStorage.getItem("amorena_cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      navigate({ to: "/menu", search: { buscar: "" } });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    let newErrors: any = {};
    let isValid = true;

    if (!orderType) {
      newErrors.type = t("checkout.validation.type", "Debe seleccionar un tipo de pedido.");
      isValid = false;
    }
    if (orderType === "Mesa" && !table) {
      newErrors.table = t("checkout.validation.table", "Debe indicar el numero de mesa.");
      isValid = false;
    }

    if (!name || name.trim().length < 5 || /\d/.test(name)) {
      newErrors.name = t("checkout.validation.name", "El nombre debe tener al menos 5 letras y no contener numeros.");
      isValid = false;
    }

    if (!phone || !/^[678]\d{7}$/.test(phone)) {
      newErrors.phone = t("checkout.validation.phone", "El telefono debe tener 8 digitos y comenzar con 6, 7 u 8.");
      isValid = false;
    }

    if (email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|es|cr|go\.cr)$/i.test(email)) {
      newErrors.email = t("checkout.validation.email", "El correo electronico debe ser valido (ej. terminado en .com, .cr).");
      isValid = false;
    }

    if (!isValid) {
      setFieldErrors(newErrors);
      return;
    }

    if (orderType === "Recoger") {
      setShowPaymentModal(true);
      return;
    }

    submitOrder();
  };

  const submitOrder = async () => {
    setLoading(true);
    try {
      const items: ApiPedidoItem[] = cart.map(item => ({
        productoId: item.id,
        nombreProducto: item.name,
        cantidad: item.qty,
        precioUnitario: item.price,
        notas: "" // Podría venir del carrito en el futuro
      }));

      const res = await api.pedidos.create({
        nombreCliente: name,
        telefonoCliente: phone,
        correoCliente: email,
        tipoPedido: orderType!,
        numeroMesa: orderType === "Mesa" ? table : undefined,
        items,
        total: cart.reduce((sum, item) => sum + item.price * item.qty, 0),
        ...(orderType === "Recoger" && cardNumber ? {
          paymentDetails: {
            cardType: getCardType(cardNumber),
            last4: cardNumber.replace(/\s/g, "").slice(-4)
          }
        } : {})
      });

      // Save to localStorage for tracking without login
      const localOrders = JSON.parse(localStorage.getItem("amorena_mis_pedidos") || "[]");
      if (!localOrders.includes(res.pedido._id)) {
        localOrders.push(res.pedido._id);
        localStorage.setItem("amorena_mis_pedidos", JSON.stringify(localOrders));
      }

      sessionStorage.removeItem("amorena_cart");
      navigate({ to: "/pedido/$id", params: { id: res.pedido._id } });
    } catch (err: any) {
      setError(err.message || t("checkout.error.generic", "Error al crear el pedido"));
      setLoading(false);
    }
  };

  const handleSimulatedPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");
    setSimulatingPayment(true);
    setTimeout(() => {
      // 4242424242424242 is the only valid test card
      if (cardNumber.replace(/\s/g, "") === "4242424242424242") {
        setSimulatingPayment(false);
        setShowPaymentModal(false);
        submitOrder();
      } else {
        setSimulatingPayment(false);
        setPaymentError(t("checkout.payment.error", "Error de pago. La tarjeta fue rechazada o los fondos son insuficientes."));
      }
    }, 2000);
  };

  return (
    <SiteLayout>
      <div className="min-h-screen py-16 px-6" style={{ background: "var(--cream)" }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="font-script text-5xl mb-12 text-center" style={{ color: "var(--coffee)" }}>
            {t("checkout.title", "Tipo de pedido")}
          </h1>

          <div className="rounded-3xl p-8 md:p-12 shadow-md" style={{ background: "var(--tan)", border: "1px solid var(--tan-dark)" }}>
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="flex flex-col gap-1.5">
                <label className="block font-serif font-bold text-[17px] mb-1" style={{ color: "var(--forest)" }}>
                  {t("checkout.name", "Indique el nombre completo")}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t("checkout.namePlaceholder", "Ej. Juan Perez")}
                  value={name}
                  onChange={e => setName(e.target.value.replace(/\d/g, ""))}
                  className={`w-full h-12 rounded bg-white px-4 outline-none border focus:border-[var(--forest)] transition-colors font-serif ${fieldErrors.name ? 'border-red-500' : 'border-transparent'}`}
                />
                {fieldErrors.name && <span className="text-red-500 text-sm font-serif mt-1">{fieldErrors.name}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="block font-serif font-bold text-[17px] mb-1" style={{ color: "var(--forest)" }}>
                  {t("checkout.phone", "Numero de telefono")}
                </label>
                <input
                  type="tel"
                  required
                  maxLength={8}
                  placeholder={t("checkout.phonePlaceholder", "Ej. 88776655")}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                  className={`w-full h-12 rounded bg-white px-4 outline-none border focus:border-[var(--forest)] transition-colors font-serif ${fieldErrors.phone ? 'border-red-500' : 'border-transparent'}`}
                />
                {fieldErrors.phone && <span className="text-red-500 text-sm font-serif mt-1">{fieldErrors.phone}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="block font-serif font-bold text-[17px] mb-1" style={{ color: "var(--forest)" }}>
                  {t("checkout.email", "Correo electronico")}
                </label>
                <input
                  type="email"
                  placeholder={t("checkout.emailPlaceholder", "Ej. correo@ejemplo.com")}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`w-full h-12 rounded bg-white px-4 outline-none border focus:border-[var(--forest)] transition-colors font-serif ${fieldErrors.email ? 'border-red-500' : 'border-transparent'}`}
                />
                {fieldErrors.email && <span className="text-red-500 text-sm font-serif mt-1">{fieldErrors.email}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="block font-serif font-bold text-[17px] mb-1" style={{ color: "var(--forest)" }}>
                  {t("checkout.table", "Numero de mesa (no aplica para recoger)")}
                </label>
                <input
                  type="text"
                  placeholder={t("checkout.tablePlaceholder", "Ej. 12")}
                  value={table}
                  onChange={e => setTable(e.target.value)}
                  disabled={orderType === "Recoger"}
                  className={`w-full h-12 rounded bg-white px-4 outline-none border focus:border-[var(--forest)] transition-colors font-serif disabled:opacity-50 ${fieldErrors.table ? 'border-red-500' : 'border-transparent'}`}
                />
                {fieldErrors.table && <span className="text-red-500 text-sm font-serif mt-1">{fieldErrors.table}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="block font-serif font-bold text-[17px] mb-2" style={{ color: "var(--forest)" }}>
                  {t("checkout.orderType", "Seleccione su tipo de pedido")}
                </label>
                <div className="grid grid-cols-2 gap-6">
                  <button
                    type="button"
                    onClick={() => { setOrderType("Mesa"); setFieldErrors(prev => ({ ...prev, type: undefined })); }}
                    className={`flex flex-col items-center justify-center py-8 rounded-lg border-2 transition-all ${orderType === 'Mesa' ? 'bg-[var(--forest)] border-[var(--forest)] text-white shadow-lg scale-105' : 'bg-transparent border-[var(--forest)] text-[var(--forest)] hover:bg-[var(--forest)]/10'}`}
                  >
                    <MapPin size={64} strokeWidth={1.5} className="mb-4" />
                    <span className="font-serif font-bold text-[17px]">{t("checkout.type.table", "Pedido a mesa")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOrderType("Recoger"); setFieldErrors(prev => ({ ...prev, type: undefined })); }}
                    className={`flex flex-col items-center justify-center py-8 rounded-lg border-2 transition-all ${orderType === 'Recoger' ? 'bg-[var(--forest)] border-[var(--forest)] text-white shadow-lg scale-105' : 'bg-transparent border-[var(--forest)] text-[var(--forest)] hover:bg-[var(--forest)]/10'}`}
                  >
                    <Car size={64} strokeWidth={1.5} className="mb-4" />
                    <span className="font-serif font-bold text-[17px]">{t("checkout.type.pickup", "Pedido para recoger")}</span>
                  </button>
                </div>
                {fieldErrors.type && <span className="text-red-500 text-sm font-serif mt-1 text-center">{fieldErrors.type}</span>}
              </div>

              {error && <p className="text-red-600 font-serif text-center mt-4 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}

              <div className="pt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-full font-serif font-bold text-lg text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                  style={{ background: "var(--forest)" }}
                >
                  {loading ? t("checkout.processing", "Procesando...") : (orderType === "Recoger" ? t("checkout.proceedPayment", "Proceder al Pago") : t("checkout.confirmOrder", "Confirmar Pedido"))}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Modal Simulado de Pago */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all" style={{ border: "2px solid var(--tan-dark)" }}>
              <h2 className="font-serif font-bold text-2xl mb-2 text-center" style={{ color: "var(--coffee)" }}>{t("checkout.payment.title", "Pasarela de Pago (Simulacion)")}</h2>
              <p className="font-serif text-sm text-center mb-6 text-gray-500">{t("checkout.payment.helpBeforeCard", "Usa la tarjeta")} <strong style={{ color: "var(--forest)" }}>4242 4242 4242 4242</strong> {t("checkout.payment.helpAfterCard", "para simular un pago exitoso.")}</p>

              <form onSubmit={handleSimulatedPayment} className="space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block font-serif font-bold text-sm" style={{ color: "var(--forest)" }}>{t("checkout.payment.cardNumber", "Numero de Tarjeta")}</label>
                    <span className="text-xs font-bold uppercase" style={{ color: "var(--coffee)" }}>{getCardType(cardNumber)}</span>
                  </div>
                  <input type="text" required placeholder="0000 0000 0000 0000" value={cardNumber} onChange={handleCardNumberChange} className="w-full h-10 rounded px-3 outline-none border border-gray-300 focus:border-[var(--forest)] font-serif" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-serif font-bold text-sm mb-1" style={{ color: "var(--forest)" }}>{t("checkout.payment.expiration", "Fecha Exp.")}</label>
                    <input type="text" required placeholder="MM/YY" value={cardExp} onChange={handleCardExpChange} className="w-full h-10 rounded px-3 outline-none border border-gray-300 focus:border-[var(--forest)] font-serif text-center" />
                  </div>
                  <div>
                    <label className="block font-serif font-bold text-sm mb-1" style={{ color: "var(--forest)" }}>{t("checkout.payment.cvc", "CVC")}</label>
                    <input type="password" required maxLength={4} placeholder="123" value={cardCvc} onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))} className="w-full h-10 rounded px-3 outline-none border border-gray-300 focus:border-[var(--forest)] font-serif text-center" />
                  </div>
                </div>
                <div>
                  <label className="block font-serif font-bold text-sm mb-1" style={{ color: "var(--forest)" }}>{t("checkout.payment.cardName", "Nombre en Tarjeta")}</label>
                  <input type="text" required value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="EJ. JUAN PEREZ" className="w-full h-10 rounded px-3 outline-none border border-gray-300 focus:border-[var(--forest)] font-serif uppercase" />
                </div>

                {paymentError && <p className="text-red-600 font-serif text-sm text-center mt-2 bg-red-50 p-2 rounded border border-red-200">{paymentError}</p>}

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                  <span className="font-serif font-bold text-lg" style={{ color: "var(--coffee)" }}>{t("checkout.payment.total", "Total a Pagar:")}</span>
                  <span className="font-serif font-bold text-2xl" style={{ color: "var(--forest)" }}>
                    ₡{cart.reduce((sum, item) => sum + item.price * item.qty, 0).toLocaleString("es-CR")}
                  </span>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    disabled={simulatingPayment}
                    className="flex-1 py-3 rounded-full font-serif font-bold transition-colors disabled:opacity-50"
                    style={{ background: "var(--tan)", color: "var(--coffee)" }}
                  >
                    {t("checkout.payment.cancel", "Cancelar")}
                  </button>
                  <button
                    type="submit"
                    disabled={simulatingPayment}
                    className="flex-1 py-3 rounded-full font-serif font-bold text-white transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    style={{ background: "var(--forest)" }}
                  >
                    {simulatingPayment ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        {t("checkout.processing", "Procesando...")}
                      </>
                    ) : t("checkout.payment.pay", "Pagar")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
