import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { AdminTitle } from "@/components/admin/AdminLayout";
import { Card, Field, Input, Select, Btn, Table, Modal } from "@/components/admin/ui";
import { createUser, deleteUser, getUsers, updateUser, useAuth, type AdminUser } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/usuarios")({ component: Page });

function Page() {
  const me = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [form, setForm] = useState({ email: "", password: "", role: "Admin" as AdminUser["role"] });
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [notice, setNotice] = useState<{ title: string; message: string; type: "success" | "warning" } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const superCount = users.filter((u) => u.role === "Super Admin" && u.activo).length;

  const loadUsers = async () => {
    try {
      setLoading(true);
      setUsers(await getUsers());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los administradores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const add = async () => {
    if (!form.email || !form.password) return;
    if (users.some((u) => u.email.toLowerCase() === form.email.toLowerCase())) {
      setNotice({
        title: "Correo ya registrado",
        message: "Ese correo ya pertenece a un administrador. Usa otro correo o edita el usuario existente.",
        type: "warning",
      });
      return;
    }

    try {
      const admin = await createUser(form);
      setUsers([...users, admin]);
      setForm({ email: "", password: "", role: "Admin" });
      setError("");
      setNotice({
        title: "Administrador agregado",
        message: `${admin.email} ya puede acceder al panel administrativo.`,
        type: "success",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el administrador");
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id_admin);
      setUsers(users.filter((x) => x.id_admin !== deleteTarget.id_admin));
      setNotice({
        title: "Administrador eliminado",
        message: `${deleteTarget.email} ya no tiene acceso al panel.`,
        type: "success",
      });
      setDeleteTarget(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el administrador");
    }
  };

  const saveEditing = async () => {
    if (!editing) return;

    try {
      const updated = await updateUser(editing);
      setUsers(users.map((x) => x.id_admin === updated.id_admin ? updated : x));
      setEditing(null);
      setError("");
      setNotice({
        title: "Cambios guardados",
        message: `La información de ${updated.email} fue actualizada.`,
        type: "success",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el administrador");
    }
  };

  return (
    <div>
      <AdminTitle title="Usuarios Administradores" subtitle="Gestiona quiénes tienen acceso al panel de administración del sitio." />
      {error && <p className="mb-4 text-sm" style={{ color: "var(--destructive)" }}>{error}</p>}

      <Card className="mb-6">
        <h2 className="text-2xl mb-4" style={{ color: "var(--forest)" }}>Administradores registrados</h2>
        {loading ? (
          <p className="font-serif" style={{ color: "var(--coffee)" }}>Cargando administradores...</p>
        ) : (
          <Table headers={["Correo electrónico", "Rol", "Estado", "Acciones"]}>
            {users.map((u) => {
              const isOnlySuper = u.role === "Super Admin" && u.activo && superCount === 1;
              return (
                <tr key={u.id_admin} className="border-t" style={{ borderColor: "var(--tan-dark)" }}>
                  <td className="px-4 py-3" style={{ color: "var(--coffee)" }}>{u.email}</td>
                  <td className="px-4 py-3" style={{ color: "var(--coffee)" }}>{u.role}</td>
                  <td className="px-4 py-3" style={{ color: "var(--coffee)" }}>{u.activo ? "Activo" : "Inactivo"}</td>
                  <td className="px-4 py-3 flex gap-3">
                    <button aria-label={`Editar ${u.email}`} onClick={() => setEditing(u)} style={{ color: "var(--forest)" }}><Pencil size={18} /></button>
                    {isOnlySuper ? (
                      <span className="text-xs italic" style={{ color: "var(--tan-dark)" }}>Protegido</span>
                    ) : (
                      <button aria-label={`Eliminar ${u.email}`} onClick={() => setDeleteTarget(u)} style={{ color: "var(--destructive)" }}><Trash2 size={18} /></button>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      {me?.role === "Super Admin" && (
        <Card className="max-w-xl">
          <h2 className="text-2xl mb-4" style={{ color: "var(--forest)" }}>Agregar un nuevo administrador</h2>
          <Field label="Correo electrónico"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Contraseña"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Rol">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminUser["role"] })}>
              <option value="Admin">Admin</option>
              <option value="Super Admin">Super Admin</option>
            </Select>
          </Field>
          <Btn onClick={() => void add()}>Agregar</Btn>
          <p className="mt-3 text-sm italic" style={{ color: "var(--coffee)", opacity: .7 }}>Nota: no se puede eliminar al único Super Admin activo. El correo electrónico debe ser único.</p>
        </Card>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar administrador">
        {editing && (
          <>
            <Field label="Correo electrónico"><Input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value, correo: e.target.value })} /></Field>
            <Field label="Rol">
              <Select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value as AdminUser["role"], rol: e.target.value as AdminUser["role"] })}>
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
              </Select>
            </Field>
            <Field label="Estado">
              <Select value={editing.activo ? "true" : "false"} onChange={(e) => setEditing({ ...editing, activo: e.target.value === "true" })}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </Select>
            </Field>
            <div className="flex gap-2 justify-end">
              <Btn variant="outline" onClick={() => setEditing(null)}>Cancelar</Btn>
              <Btn onClick={() => void saveEditing()}>Guardar</Btn>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar administrador">
        {deleteTarget && (
          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="size-11 shrink-0 rounded-full inline-flex items-center justify-center" style={{ background: "rgba(190, 24, 24, .1)", color: "var(--destructive)" }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="font-serif leading-relaxed" style={{ color: "var(--coffee)" }}>
                  Vas a eliminar el acceso administrativo de <strong>{deleteTarget.email}</strong>.
                </p>
                <p className="mt-2 text-sm font-serif" style={{ color: "var(--coffee)", opacity: .72 }}>
                  Esta acción no elimina información del negocio, pero esa cuenta ya no podrá iniciar sesión en el panel.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Btn>
              <Btn variant="danger" onClick={() => void remove()}>Eliminar acceso</Btn>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!notice} onClose={() => setNotice(null)} title={notice?.title || ""}>
        {notice && (
          <div className="space-y-5">
            <div className="flex gap-4">
              <div
                className="size-11 shrink-0 rounded-full inline-flex items-center justify-center"
                style={{
                  background: notice.type === "success" ? "rgba(22, 101, 52, .1)" : "rgba(146, 64, 14, .12)",
                  color: notice.type === "success" ? "var(--forest)" : "var(--coffee)",
                }}
              >
                {notice.type === "success" ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
              </div>
              <p className="font-serif leading-relaxed" style={{ color: "var(--coffee)" }}>{notice.message}</p>
            </div>
            <div className="flex justify-end">
              <Btn onClick={() => setNotice(null)}>Entendido</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
