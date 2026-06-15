import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { AdminTitle } from "@/components/admin/AdminLayout";
import { Card, Btn, Modal, Field, Input, Select } from "@/components/admin/ui";
import { ScheduleCalendar } from "@/components/ui/schedule-calendar";
import { adminApiRequest } from "@/lib/admin-auth";
import type { ApiReserva } from "@/lib/api";
import {
  createRegularSchedule,
  createScheduleException,
  deleteScheduleException,
  fetchRegularSchedule,
  fetchScheduleExceptions,
  updateRegularSchedule,
  updateScheduleException,
  type ScheduleEntry,
  type ScheduleException,
} from "../lib/hours";

export const Route = createFileRoute("/admin/horario")({ component: Page });

type ExceptionForm = {
  id?: string;
  date: string;
  type: "cambio" | "cierre" | "cerrar_reservas";
  motivo: string;
  open: string;
  close: string;
};

type EditableSchedule = {
  id?: string;
  day: string;
  open: string;
  close: string;
};

const WEEK_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function normalizeDay(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function Page() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [editingDay, setEditingDay] = useState<EditableSchedule | null>(null);
  const [view, setView] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [exceptionForm, setExceptionForm] = useState<ExceptionForm | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingExceptions, setLoadingExceptions] = useState(true);
  const [reservaPage, setReservaPage] = useState(1);
  const [savingException, setSavingException] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reservas, setReservas] = useState<ApiReserva[]>([]);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<ApiReserva | null>(null);
  const [savingReserva, setSavingReserva] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  useEffect(() => {
    let active = true;
    const loadSchedule = async () => {
      setLoadingSchedule(true);
      try {
        const data = await fetchRegularSchedule();
        if (!active) return;
        setSchedule(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar el horario.");
      } finally {
        if (!active) return;
        setLoadingSchedule(false);
      }
    };
    loadSchedule();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadExceptions = async () => {
      setLoadingExceptions(true);
      try {
        const data = await fetchScheduleExceptions(view.year, view.month);
        if (!active) return;
        setExceptions(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudieron cargar las excepciones.");
      } finally {
        if (!active) return;
        setLoadingExceptions(false);
      }
    };
    loadExceptions();
    return () => {
      active = false;
    };
  }, [view.month, view.year]);

  useEffect(() => {
    let active = true;
    const loadReservas = async () => {
      setLoadingReservas(true);
      try {
        const mesStr = `${view.year}-${String(view.month + 1).padStart(2, "0")}`;
        const data = await adminApiRequest<{ reservas: ApiReserva[] }>(`/reservas?mes=${mesStr}`);
        if (!active) return;
        setReservas(data.reservas);
      } catch (err) {
        if (!active) return;
        console.error(err);
      } finally {
        if (!active) return;
        setLoadingReservas(false);
      }
    };
    loadReservas();
    return () => {
      active = false;
    };
  }, [view.month, view.year]);

  const reservasMostradas = selectedDate
    ? reservas.filter(r => r.fecha.split('T')[0] === selectedDate)
    : reservas;

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(reservasMostradas.length / ITEMS_PER_PAGE);
  const paginatedReservas = reservasMostradas.slice(
    (reservaPage - 1) * ITEMS_PER_PAGE,
    reservaPage * ITEMS_PER_PAGE
  );

  const openExceptionForm = (date: string) => {
    const existing = exceptions.find((item) => item.date === date);
    if (existing) {
      setExceptionForm({
        id: existing.id,
        date: existing.date,
        type: existing.type,
        motivo: existing.motivo,
        open: existing.open ?? "",
        close: existing.close ?? "",
      });
    } else {
      setExceptionForm({ date, type: "cierre", motivo: "", open: "", close: "" });
    }
  };

  const closeExceptionForm = () => {
    setExceptionForm(null);
  };

  const canSaveException = !!exceptionForm && exceptionForm.motivo.trim().length > 0 && (
    exceptionForm.type === "cierre" || exceptionForm.type === "cerrar_reservas" || (exceptionForm.open && exceptionForm.close)
  );

  const canSaveSchedule = !!editingDay && editingDay.open.trim().length > 0 && editingDay.close.trim().length > 0;

  const weeklySchedule = WEEK_DAYS.map((day) => {
    const entry = schedule.find((item) => normalizeDay(item.day) === normalizeDay(day));
    return entry
      ? { id: entry.id, day: entry.day, open: entry.open, close: entry.close }
      : { day, open: "", close: "" };
  });

  const handleSaveException = () => {
    if (!exceptionForm || savingException) return;
    setSavingException(true);

    const payload: Omit<ScheduleException, "id"> = {
      date: exceptionForm.date,
      type: exceptionForm.type,
      motivo: exceptionForm.motivo.trim(),
      open: exceptionForm.type === "cambio" ? exceptionForm.open : undefined,
      close: exceptionForm.type === "cambio" ? exceptionForm.close : undefined,
    };

    const action = exceptionForm.id
      ? updateScheduleException({ id: exceptionForm.id, ...payload })
      : createScheduleException(payload);

    const save = async () => {
      try {
        await action;
        const data = await fetchScheduleExceptions(view.year, view.month);
        setExceptions(data);
        closeExceptionForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar la excepción.");
      } finally {
        setSavingException(false);
      }
    };
    save();
  };

  const handleDeleteException = () => {
    if (!exceptionForm?.id || savingException) return;
    const exceptionId = exceptionForm.id;
    setSavingException(true);
    const remove = async () => {
      try {
        await deleteScheduleException(exceptionId);
        const data = await fetchScheduleExceptions(view.year, view.month);
        setExceptions(data);
        closeExceptionForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo eliminar la excepción.");
      } finally {
        setSavingException(false);
      }
    };
    remove();
  };

  const handleUpdateReservaStatus = async (id: string, estado: "Autorizada" | "Desestimada" | "Cancelada", motivo?: string) => {
    if (savingReserva) return;
    setSavingReserva(true);
    try {
      const body: any = { estado };
      if (motivo) body.motivoCancelacion = motivo;

      await adminApiRequest(`/reservas/${id}/estado`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      setReservas((current) => current.map((r) => r._id === id ? { ...r, estado, motivoCancelacion: motivo } : r));
      toast.success(`Reserva ${estado.toLowerCase()} correctamente.`);

      if (estado === "Cancelada") {
        setCancelando(false);
        setMotivoCancelacion("");
      }
      setSelectedReserva(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la reserva.");
    } finally {
      setSavingReserva(false);
    }
  };

  return (
    <div>
      <AdminTitle title="Editor de horario y reservas" subtitle="Horarios regulares, excepciones por fecha y gestión de reservas." />
      {error && (
        <p className="mb-4 text-sm font-serif" style={{ color: "var(--destructive)" }}>
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr] items-start">
        <div className="space-y-6">
          <Card>
            <h2 className="text-2xl mb-4" style={{ color: "var(--forest)" }}>Horario semanal</h2>
            {loadingSchedule ? (
              <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>
                Cargando horarios...
              </p>
            ) : (
              <div className="space-y-3">
                {weeklySchedule.map((d) => {
                  const hours = d.open && d.close ? `${d.open} - ${d.close}` : "Sin horario";
                  return (
                    <div
                      key={d.day}
                      className="flex items-center justify-between gap-4 rounded-lg px-3 py-2"
                      style={{ background: "var(--cream)" }}
                    >
                      <div className="font-serif" style={{ color: "var(--coffee)" }}>{d.day}</div>
                      <div className="text-sm font-serif" style={{ color: "var(--coffee)" }}>{hours}</div>
                      <button
                        onClick={() => setEditingDay(d)}
                        className="p-1"
                        style={{ color: "var(--forest)" }}
                        aria-label={`Editar ${d.day}`}
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-semibold tracking-widest" style={{ color: "var(--muted-foreground)" }}>
              Referencia de calendario
            </h3>
            <div className="mt-4 grid gap-3 text-sm font-serif" style={{ color: "var(--coffee)" }}>
              <div className="flex items-center gap-3">
                <span className="size-3 rounded-full" style={{ border: "2px solid var(--forest)" }} />
                Horario especial (cambio)
              </div>
              <div className="flex items-center gap-3">
                <span className="size-3 rounded-full" style={{ border: "2px solid var(--destructive)" }} />
                Cerrado o festivo
              </div>
              <div className="flex items-center gap-3">
                <span className="size-3 rounded-full" style={{ border: "2px solid #FF9500" }} />
                Sin cupo de reservas
              </div>
              <div className="flex items-center gap-3">
                <span className="size-3 rounded-full" style={{ background: "var(--tan)", border: "2px solid var(--tan-dark)" }} />
                Seleccionado
              </div>
            </div>
          </Card>
        </div>

        <div>
          <ScheduleCalendar
            month={view.month}
            year={view.year}
            exceptions={exceptions}
            selectedDate={selectedDate}
            onSelectDate={openExceptionForm}
            onMonthChange={(year, month) => setView({ year, month })}
          />
          <p className="mt-4 text-sm font-serif" style={{ color: "var(--muted-foreground)" }}>
            Selecciona un día para crear o editar una excepción del horario.
          </p>
          {loadingExceptions && (
            <p className="mt-2 text-sm font-serif" style={{ color: "var(--muted-foreground)" }}>
              Cargando excepciones del mes...
            </p>
          )}

          <div className="mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h3 className="text-xl font-script" style={{ color: "var(--forest)" }}>
                Reservas {selectedDate ? `del ${selectedDate}` : "del mes"}
              </h3>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={selectedDate || ""}
                  onChange={(e) => {
                    setSelectedDate(e.target.value || null);
                    setReservaPage(1);
                  }}
                  className="w-auto text-sm py-1.5 h-9"
                />
                {selectedDate && (
                  <Btn variant="outline" onClick={() => { setSelectedDate(null); setReservaPage(1); }} className="text-sm py-1.5 px-3 h-9">
                    Limpiar filtro
                  </Btn>
                )}
              </div>
            </div>
            {loadingReservas ? (
              <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>Cargando reservas...</p>
            ) : reservasMostradas.length === 0 ? (
              <p className="font-serif text-sm italic" style={{ color: "var(--coffee)" }}>
                No hay reservas para {selectedDate ? "este día" : "este mes"}.
              </p>
            ) : (
              <div className="space-y-3">
                {paginatedReservas.map((reserva) => (
                  <div key={reserva._id} onClick={() => setSelectedReserva(reserva)} className="cursor-pointer">
                    <Card className="hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-serif font-semibold text-sm" style={{ color: "var(--coffee)" }}>{reserva.nombreCompleto}</p>
                          <p className="font-serif text-xs" style={{ color: "var(--muted-foreground)" }}>
                            {!selectedDate && <span>{reserva.fecha.split('T')[0]} • </span>}
                            {reserva.hora} • {reserva.cantidadPersonas} personas
                          </p>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-1 rounded" style={{
                          background: reserva.estado === "Pendiente" ? "var(--tan)" : reserva.estado === "Autorizada" ? "var(--forest)" : "rgba(243, 217, 209, 0.65)",
                          color: reserva.estado === "Autorizada" ? "var(--cream)" : reserva.estado === "Desestimada" || reserva.estado === "Cancelada" ? "var(--destructive)" : "var(--coffee)",
                        }}>
                          {reserva.estado}
                        </span>
                      </div>
                    </Card>
                  </div>
                ))}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <button
                      onClick={() => setReservaPage((p) => Math.max(1, p - 1))}
                      disabled={reservaPage === 1}
                      className="px-3 py-1 rounded-md text-sm font-serif transition-colors disabled:opacity-50"
                      style={{ background: "var(--tan)", color: "var(--coffee)" }}
                    >
                      Anterior
                    </button>
                    <span className="text-sm font-serif" style={{ color: "var(--muted-foreground)" }}>
                      Página {reservaPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setReservaPage((p) => Math.min(totalPages, p + 1))}
                      disabled={reservaPage === totalPages}
                      className="px-3 py-1 rounded-md text-sm font-serif transition-colors disabled:opacity-50"
                      style={{ background: "var(--tan)", color: "var(--coffee)" }}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={!!editingDay} onClose={() => setEditingDay(null)} title={`Editar ${editingDay?.day ?? ""}`}>
        {editingDay && (
          <>
            <Field label="Apertura"><Input type="time" value={editingDay.open} onChange={(e) => setEditingDay({ ...editingDay, open: e.target.value })} /></Field>
            <Field label="Cierre"><Input type="time" value={editingDay.close} onChange={(e) => setEditingDay({ ...editingDay, close: e.target.value })} /></Field>
            <div className="flex gap-2 justify-end">
              <Btn variant="outline" onClick={() => setEditingDay(null)}>Cancelar</Btn>
              <Btn
                disabled={!canSaveSchedule || savingSchedule}
                onClick={async () => {
                  if (savingSchedule) return;
                  setSavingSchedule(true);
                  try {
                    if (editingDay.id) {
                      await updateRegularSchedule(editingDay as ScheduleEntry);
                    } else {
                      await createRegularSchedule({ day: editingDay.day, open: editingDay.open, close: editingDay.close });
                    }
                    const data = await fetchRegularSchedule();
                    setSchedule(data);
                    setEditingDay(null);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "No se pudo actualizar el horario.");
                  } finally {
                    setSavingSchedule(false);
                  }
                }}
              >
                Guardar cambios
              </Btn>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!exceptionForm} onClose={closeExceptionForm} title="Excepción de horario">
        {exceptionForm && (
          <>
            <Field label="Fecha">
              <Input value={exceptionForm.date} readOnly />
            </Field>
            <Field label="Tipo">
              <Select
                value={exceptionForm.type}
                onChange={(e) => setExceptionForm({ ...exceptionForm, type: e.target.value as any })}
              >
                <option value="cambio">Cambio de horario</option>
                <option value="cierre">Cierre total</option>
                <option value="cerrar_reservas">Cerrar reservas</option>
              </Select>
            </Field>
            <Field label="Motivo">
              <Input value={exceptionForm.motivo} onChange={(e) => setExceptionForm({ ...exceptionForm, motivo: e.target.value })} />
            </Field>
            {exceptionForm.type === "cambio" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Apertura">
                  <Input type="time" value={exceptionForm.open} onChange={(e) => setExceptionForm({ ...exceptionForm, open: e.target.value })} />
                </Field>
                <Field label="Cierre">
                  <Input type="time" value={exceptionForm.close} onChange={(e) => setExceptionForm({ ...exceptionForm, close: e.target.value })} />
                </Field>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                {exceptionForm.id && (
                  <Btn variant="danger" disabled={savingException} onClick={handleDeleteException}>Eliminar</Btn>
                )}
              </div>
              <div className="flex gap-2">
                <Btn variant="outline" onClick={closeExceptionForm}>Cancelar</Btn>
                <Btn disabled={!canSaveException || savingException} onClick={handleSaveException}>Guardar cambios</Btn>
              </div>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!selectedReserva} onClose={() => { setSelectedReserva(null); setCancelando(false); setMotivoCancelacion(""); }} title={`Reserva ${selectedReserva?.estado?.toLowerCase()}`}>
        {selectedReserva && (
          <div className="flex flex-col gap-4">
            <Field label="Fecha">
              <Input value={selectedReserva.fecha.split('T')[0]} readOnly />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre completo">
                <Input value={selectedReserva.nombreCompleto} readOnly />
              </Field>
              <Field label="Correo electrónico">
                <Input value={selectedReserva.correoElectronico} readOnly />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Teléfono">
                <Input value={selectedReserva.telefono} readOnly />
              </Field>
              <Field label="Cantidad de personas">
                <Input value={selectedReserva.cantidadPersonas.toString()} readOnly />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Hora">
                <Input value={selectedReserva.hora} readOnly />
              </Field>
            </div>
            <Field label="Notas">
              <Input value={selectedReserva.notas || "Sin notas"} readOnly />
            </Field>

            {selectedReserva.estado === "Cancelada" && selectedReserva.motivoCancelacion && (
              <Field label="Motivo de Cancelación">
                <Input value={selectedReserva.motivoCancelacion} readOnly style={{ border: "1px solid var(--destructive)", color: "var(--destructive)" }} />
              </Field>
            )}

            {selectedReserva.estado === "Pendiente" && (
              <div className="flex gap-2 justify-end mt-4">
                <Btn variant="outline" disabled={savingReserva} onClick={() => handleUpdateReservaStatus(selectedReserva._id, "Desestimada")}>Desestimar</Btn>
                <Btn disabled={savingReserva} onClick={() => handleUpdateReservaStatus(selectedReserva._id, "Autorizada")}>Autorizar reserva</Btn>
              </div>
            )}

            {selectedReserva.estado === "Autorizada" && !cancelando && (
              <div className="flex justify-end mt-4">
                <Btn variant="danger" disabled={savingReserva} onClick={() => setCancelando(true)}>Cancelar reserva</Btn>
              </div>
            )}

            {cancelando && (
              <div className="mt-4 p-4 rounded-lg border" style={{ borderColor: "var(--destructive)", background: "rgba(243, 217, 209, 0.2)" }}>
                <Field label="Motivo de la cancelación (obligatorio)">
                  <textarea
                    className="w-full px-3 py-2 rounded font-serif outline-none min-h-[80px]"
                    style={{ background: "var(--cream)", border: "1px solid var(--destructive)", color: "var(--coffee)" }}
                    value={motivoCancelacion}
                    onChange={(e) => setMotivoCancelacion(e.target.value)}
                    placeholder="Escribe la razón para notificar al cliente..."
                  />
                </Field>
                <div className="flex gap-2 justify-end mt-2">
                  <Btn variant="outline" onClick={() => setCancelando(false)}>Volver</Btn>
                  <Btn variant="danger" disabled={savingReserva || motivoCancelacion.trim() === ""} onClick={() => handleUpdateReservaStatus(selectedReserva._id, "Cancelada", motivoCancelacion)}>
                    Confirmar cancelación
                  </Btn>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
