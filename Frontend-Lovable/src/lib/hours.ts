import { apiRequest } from "@/lib/api";

export type ScheduleEntry = { id: string; day: string; dayEn?: string; open: string; close: string };

export type ScheduleException = {
  id: string;
  date: string;
  type: "cambio" | "cierre" | "cerrar_reservas";
  motivo: string;
  motivoEn?: string;
  open?: string;
  close?: string;
};

type ScheduleApi = {
  _id: string;
  dia: string;
  dia_en?: string;
  hora_apertura: string;
  hora_cierre: string;
};

type ExceptionApi = {
  _id: string;
  fecha: string;
  tipo: "cambio" | "cierre" | "cerrar_reservas";
  motivo: string;
  motivo_en?: string;
  hora_apertura?: string;
  hora_cierre?: string;
};

const DAY_ORDER = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

function normalizeDayLabel(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

export function formatExceptionHours(exception: ScheduleException) {
  if (!exception.open || !exception.close) return "";
  return `${exception.open} - ${exception.close}`;
}

function mapRegular(entry: ScheduleApi): ScheduleEntry {
  return {
    id: entry._id,
    day: entry.dia,
    dayEn: entry.dia_en,
    open: entry.hora_apertura,
    close: entry.hora_cierre,
  };
}

function mapException(entry: ExceptionApi): ScheduleException {
  return {
    id: entry._id,
    date: entry.fecha,
    type: entry.tipo,
    motivo: entry.motivo,
    motivoEn: entry.motivo_en,
    open: entry.hora_apertura,
    close: entry.hora_cierre,
  };
}

function sortSchedule(entries: ScheduleEntry[]) {
  return [...entries].sort((a, b) => {
    const aIndex = DAY_ORDER.indexOf(normalizeDayLabel(a.day));
    const bIndex = DAY_ORDER.indexOf(normalizeDayLabel(b.day));
    if (aIndex === -1 || bIndex === -1) return a.day.localeCompare(b.day, "es");
    return aIndex - bIndex;
  });
}

export async function fetchRegularSchedule() {
  const data = await apiRequest<{ horarios: ScheduleApi[] }>("/horarios/regular");
  return sortSchedule(data.horarios.map(mapRegular));
}

export async function createRegularSchedule(entry: Omit<ScheduleEntry, "id">) {
  const payload = {
    dia: entry.day,
    hora_apertura: entry.open,
    hora_cierre: entry.close,
  };
  const data = await apiRequest<{ horario: ScheduleApi }>("/horarios/regular", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapRegular(data.horario);
}

export async function updateRegularSchedule(entry: ScheduleEntry) {
  const payload = {
    dia: entry.day,
    hora_apertura: entry.open,
    hora_cierre: entry.close,
  };
  const data = await apiRequest<{ horario: ScheduleApi }>(`/horarios/regular/${entry.id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return mapRegular(data.horario);
}

export async function fetchScheduleExceptions(year: number, monthIndex: number) {
  const month = `${year}-${pad(monthIndex + 1)}`;
  const data = await apiRequest<{ excepciones: ExceptionApi[] }>(`/horarios/excepciones?month=${month}`);
  return data.excepciones.map(mapException);
}

export async function createScheduleException(payload: Omit<ScheduleException, "id">) {
  const data = await apiRequest<{ excepcion: ExceptionApi }>("/horarios/excepciones", {
    method: "POST",
    body: JSON.stringify({
      fecha: payload.date,
      tipo: payload.type,
      motivo: payload.motivo,
      hora_apertura: payload.type === "cambio" ? payload.open : undefined,
      hora_cierre: payload.type === "cambio" ? payload.close : undefined,
    }),
  });
  return mapException(data.excepcion);
}

export async function updateScheduleException(payload: ScheduleException) {
  const data = await apiRequest<{ excepcion: ExceptionApi }>(`/horarios/excepciones/${payload.id}`, {
    method: "PUT",
    body: JSON.stringify({
      fecha: payload.date,
      tipo: payload.type,
      motivo: payload.motivo,
      hora_apertura: payload.type === "cambio" ? payload.open : undefined,
      hora_cierre: payload.type === "cambio" ? payload.close : undefined,
    }),
  });
  return mapException(data.excepcion);
}

export async function deleteScheduleException(id: string) {
  await apiRequest(`/horarios/excepciones/${id}`, { method: "DELETE" });
}
