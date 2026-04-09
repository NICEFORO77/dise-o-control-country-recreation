"use client";

import { ChangeEvent, FormEvent, useDeferredValue, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL, SessionUser, apiFetch, clearSession, getStoredToken, getStoredUser, uploadProductPhoto } from "@/lib/api";
import { ModuleConfig, modules, summaryCards } from "@/lib/modules";

type LookupCache = Record<string, Array<Record<string, unknown>>>;
type ReportPayload = Record<string, Array<Record<string, unknown>>>;
type OperationForms = {
  reserva: Record<string, unknown>;
  pedido: Record<string, unknown>;
  detalle: Record<string, unknown>;
  simulacion: Record<string, unknown>;
};

export function DashboardViewPage({ initialView }: { initialView: string }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [summary, setSummary] = useState<Record<string, number | string>>({});
  const [reports, setReports] = useState<ReportPayload>({});
  const [activeKey, setActiveKey] = useState("reportes");
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [lookups, setLookups] = useState<LookupCache>({});
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [moduleSearch, setModuleSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedProductFile, setSelectedProductFile] = useState<File | null>(null);
  const [productImageError, setProductImageError] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [codes, setCodes] = useState<{ reserva?: string; pedido?: string }>({});
  const [operationForms, setOperationForms] = useState<OperationForms>({
    reserva: {},
    pedido: {},
    detalle: {},
    simulacion: {}
  });

  const visibleModules = modules.filter((module) => !user || module.roles.includes(user.role));
  const navigationModules = visibleModules.filter((module) => module.showInNavigation !== false);
  const activeModule = visibleModules.find((module) => module.key === activeKey) ?? visibleModules[0] ?? null;
  const deferredSearch = useDeferredValue(moduleSearch);
  const displayedRows = filterRows(rows, deferredSearch);
  const totalPages = Math.max(1, Math.ceil(displayedRows.length / pageSize));
  const paginatedRows = displayedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function loadOperationsWorkspace(currentUser: SessionUser) {
    const [clientes, mesas, reservas, pedidos, productos, codigos] = await Promise.all([
      apiFetch<Array<Record<string, unknown>>>("/api/crud/clientes"),
      apiFetch<Array<Record<string, unknown>>>("/api/crud/mesas"),
      apiFetch<Array<Record<string, unknown>>>("/api/crud/reservas"),
      apiFetch<Array<Record<string, unknown>>>("/api/crud/pedidos"),
      apiFetch<Array<Record<string, unknown>>>("/api/crud/productos"),
      apiFetch<{ reserva?: string; pedido?: string }>("/api/operaciones/codigos")
    ]);

    setLookups({
      clientes,
      mesas,
      reservas,
      pedidos,
      productos
    });
    setCodes(codigos);
    setOperationForms(buildOperationForms(currentUser, codigos));
  }

  useEffect(() => {
    const token = getStoredToken();
    const localUser = getStoredUser();

    if (!token || !localUser) {
      router.replace("/login");
      return;
    }

    let isMounted = true;

    async function bootstrap() {
      try {
        const currentUser = await apiFetch<SessionUser>("/api/auth/me");
        const [summaryPayload, reportsPayload] = await Promise.all([
          apiFetch<Record<string, number | string>>("/api/dashboard/summary"),
          apiFetch<ReportPayload>("/api/reportes")
        ]);
        const nextCodes = await apiFetch<{ reserva?: string; pedido?: string }>("/api/operaciones/codigos");

        if (!isMounted) {
          return;
        }

        setUser(currentUser);
        setSummary(summaryPayload);
        setReports(reportsPayload);
        setCodes(nextCodes);
        const allowedModuleKeys = modules.filter((module) => module.roles.includes(currentUser.role)).map((module) => module.key);
        const defaultView = currentUser.role === "ADMINISTRADOR" ? "usuarios" : "clientes";
        const allowedViews = new Set(["reportes", "operaciones", ...allowedModuleKeys]);
        const nextView = allowedViews.has(initialView) ? initialView : defaultView;
        setActiveKey(nextView);
        if (nextView !== initialView) {
          router.replace(buildDashboardRoute(nextView));
        }
      } catch {
        clearSession();
        router.replace("/login");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [initialView, router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeKey, deferredSearch, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (activeKey === "reportes") {
      setRows([]);
      setForm({});
      setEditingId(null);
      setModuleSearch("");
      return;
    }

    if (activeKey === "operaciones") {
      const currentUser = user;
      if (!currentUser) {
        return;
      }

      let isMounted = true;
      setModuleLoading(true);
      setError("");
      setMessage("");
      setRows([]);
      setForm({});
      setEditingId(null);
      setModuleSearch("");

      async function loadOperations() {
        try {
          if (!isMounted) {
            return;
          }

          await loadOperationsWorkspace(currentUser);
        } catch (operationError) {
          if (isMounted) {
            setError(operationError instanceof Error ? operationError.message : "No se pudo cargar operaciones");
          }
        } finally {
          if (isMounted) {
            setModuleLoading(false);
          }
        }
      }

      loadOperations();

      return () => {
        isMounted = false;
      };
    }

    if (!activeModule) {
      return;
    }

    let isMounted = true;
    setModuleLoading(true);
    setError("");
    setMessage("");
    setModuleSearch("");

    async function loadModule() {
      try {
        const dataset = await apiFetch<Array<Record<string, unknown>>>(activeModule.endpoint);
        const lookupResources = Array.from(
          new Set(activeModule.fields.map((field) => field.lookupResource).filter(Boolean) as string[])
        );

        const lookupEntries = await Promise.all(
          lookupResources.map(async (resource) => [resource, await apiFetch<Array<Record<string, unknown>>>(`/api/crud/${resource}`)] as const)
        );

        if (!isMounted) {
          return;
        }

        setRows(dataset);
        setLookups(Object.fromEntries(lookupEntries));
        setForm(buildInitialForm(activeModule, user));
        setEditingId(null);
        setSelectedProductFile(null);
        setProductImageError("");
        setFileInputKey((current) => current + 1);
      } catch (moduleError) {
        if (isMounted) {
          setError(moduleError instanceof Error ? moduleError.message : "No se pudo cargar el módulo");
        }
      } finally {
        if (isMounted) {
          setModuleLoading(false);
        }
      }
    }

    loadModule();

    return () => {
      isMounted = false;
    };
  }, [activeKey, activeModule, user]);

  async function refreshMetrics() {
    const [summaryPayload, reportsPayload, nextCodes] = await Promise.all([
      apiFetch<Record<string, number | string>>("/api/dashboard/summary"),
      apiFetch<ReportPayload>("/api/reportes"),
      apiFetch<{ reserva?: string; pedido?: string }>("/api/operaciones/codigos")
    ]);
    setSummary(summaryPayload);
    setReports(reportsPayload);
    setCodes(nextCodes);
  }

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  function navigateToView(view: string) {
    setActiveKey(view);
    router.push(buildDashboardRoute(view));
  }

  function onInputChange(fieldKey: string, value: unknown) {
    setForm((current) => ({ ...current, [fieldKey]: value }));
  }

  function onEdit(row: Record<string, unknown>) {
    if (!activeModule || activeModule.readOnly) {
      return;
    }
    setEditingId(Number(row[activeModule.idField]));
    const nextForm = buildInitialForm(activeModule, user);
    for (const field of activeModule.fields) {
      nextForm[field.key] = row[field.key] ?? nextForm[field.key] ?? "";
    }
    setForm(nextForm);
    setSelectedProductFile(null);
    setProductImageError("");
    setFileInputKey((current) => current + 1);
    setMessage(`Editando ${activeModule.title.toLowerCase()}.`);
    setError("");
  }

  function resetEditor() {
    if (!activeModule || !user) {
      return;
    }
    setForm(buildInitialForm(activeModule, user));
    setEditingId(null);
    setSelectedProductFile(null);
    setProductImageError("");
    setFileInputKey((current) => current + 1);
    setMessage("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeModule || !user || activeModule.readOnly) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = normalizePayload(activeModule, form);
      const endpoint = editingId ? `${activeModule.endpoint}/${editingId}` : activeModule.endpoint;
      const method = editingId ? "PUT" : "POST";
      const savedRow = await apiFetch<Record<string, unknown>>(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      if (activeModule.key === "productos" && selectedProductFile) {
        const productId = Number(savedRow[activeModule.idField]);
        await uploadProductPhoto(productId, selectedProductFile);
      }

      const updatedRows = await apiFetch<Array<Record<string, unknown>>>(activeModule.endpoint);
      setRows(updatedRows);
      resetEditor();
      await refreshMetrics();
      setMessage(editingId ? "Registro actualizado correctamente." : "Registro creado correctamente.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo guardar el registro");
    } finally {
      setSaving(false);
    }
  }

  function handleProductFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setProductImageError("");

    if (!file) {
      setSelectedProductFile(null);
      return;
    }

    const maxSize = 15 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setSelectedProductFile(null);
      setProductImageError("Solo se permiten imágenes JPG, JPEG, PNG o WEBP.");
      setFileInputKey((current) => current + 1);
      return;
    }

    if (file.size > maxSize) {
      setSelectedProductFile(null);
      setProductImageError("La imagen excede el tamaño permitido de 15 MB.");
      setFileInputKey((current) => current + 1);
      return;
    }

    setSelectedProductFile(file);
  }

  function updateOperationForm(section: keyof OperationForms, key: string, value: unknown) {
    setOperationForms((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value
      }
    }));
  }

  async function submitOperation(section: keyof OperationForms) {
    if (!user) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (section === "reserva") {
        await apiFetch("/api/crud/reservas", {
          method: "POST",
          body: JSON.stringify({
            ...normalizeOperationPayload(operationForms.reserva, ["id_cliente", "id_mesa", "cantidad_personas", "id_usuario_registro"]),
            id_usuario_registro: user.id
          })
        });
        setMessage("Reserva registrada correctamente.");
      }

      if (section === "pedido") {
        await apiFetch("/api/crud/pedidos", {
          method: "POST",
          body: JSON.stringify({
            ...normalizeOperationPayload(operationForms.pedido, ["id_reserva", "id_mesa", "id_cliente", "descuento", "id_usuario_registro"]),
            id_usuario_registro: user.id
          })
        });
        setMessage("Pedido registrado correctamente.");
      }

      if (section === "detalle") {
        await apiFetch("/api/crud/detalle-pedido", {
          method: "POST",
          body: JSON.stringify(normalizeOperationPayload(operationForms.detalle, ["id_pedido", "id_producto", "cantidad", "precio_unitario", "descuento_item"]))
        });
        setMessage("Producto agregado al pedido.");
      }

      if (section === "simulacion") {
        const result = await apiFetch<{ metodo_pago_sugerido: string; vuelto_estimado: number }>("/api/operaciones/simular-pago", {
          method: "POST",
          body: JSON.stringify({
            idPedido: Number(operationForms.simulacion.idPedido),
            montoRecibido: Number(operationForms.simulacion.montoRecibido),
            idUsuario: user.id
          })
        });
        setMessage(`Simulación registrada. Método sugerido: ${result.metodo_pago_sugerido}. Vuelto estimado: S/ ${Number(result.vuelto_estimado).toFixed(2)}.`);
      }

      await refreshMetrics();
      if (activeKey === "operaciones") {
        await loadOperationsWorkspace(user);
      }
    } catch (operationError) {
      setError(operationError instanceof Error ? operationError.message : "No se pudo registrar la operación");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!activeModule) {
      return;
    }

    const confirmed = window.confirm("¿Deseas eliminar este registro?");
    if (!confirmed) {
      return;
    }

    try {
      await apiFetch<void>(`${activeModule.endpoint}/${id}`, { method: "DELETE" });
      const updatedRows = await apiFetch<Array<Record<string, unknown>>>(activeModule.endpoint);
      setRows(updatedRows);
      await refreshMetrics();
      setMessage("Registro eliminado correctamente.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="glass-panel rounded-3xl px-8 py-6 text-base font-medium text-slate-700">
          Cargando panel operativo...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-4 lg:px-6">
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="glass-panel rounded-[2rem] p-5">
          <div className="rounded-[1.5rem] bg-slate-900 px-5 py-6 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-teal-300">Heliconias Pucallpa</p>
            <h1 className="mt-3 text-2xl font-semibold">Control interno</h1>
            <p className="mt-2 text-sm text-slate-300">{user?.fullName}</p>
            <span className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-amber-200">
              {user?.role}
            </span>
          </div>

          <div className="mt-6">
            <button
              className={`mb-2 w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                activeKey === "reportes" ? "bg-teal-600 text-white" : "bg-white/70 text-slate-700 hover:bg-white"
              }`}
              onClick={() => navigateToView("reportes")}
            >
              Reportes y tablero
            </button>

            <button
              className={`mb-2 w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                activeKey === "operaciones" ? "bg-emerald-600 text-white" : "bg-white/70 text-slate-700 hover:bg-white"
              }`}
              onClick={() => navigateToView("operaciones")}
            >
              Operaciones rápidas
            </button>

            <div className="space-y-2">
              {navigationModules.map((module) => (
                <button
                  key={module.key}
                  className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                    activeKey === module.key ? "bg-slate-900 text-white" : "bg-white/70 text-slate-700 hover:bg-white"
                  }`}
                  onClick={() => navigateToView(module.key)}
                >
                  {module.title}
                </button>
              ))}
            </div>
          </div>

          <button
            className="mt-6 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </aside>

        <section className="space-y-4">
          <header className="glass-panel rounded-[2rem] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-teal-700">Panel principal</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                  {activeKey === "reportes"
                    ? "Resumen ejecutivo y reportes obligatorios"
                    : activeKey === "operaciones"
                      ? "Reservas, pedidos y simulación de pago"
                      : activeModule?.title}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  {activeKey === "reportes"
                    ? "Revisa ventas, reservas, pedidos activos, caja, productos más vendidos y auditoría desde una sola vista."
                    : activeKey === "operaciones"
                      ? "Ejecuta el flujo operativo del recreo desde una vista rápida: reserva de mesa, apertura de pedido, agregado de productos y simulación de pago."
                      : activeModule?.description}
                </p>
              </div>
              <div className="rounded-2xl border border-teal-100 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-sm">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 align-middle" />
                Backend conectado:
                <span className="ml-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-800">
                  {API_URL.replace(/^https?:\/\//, "")}
                </span>
              </div>
            </div>
          </header>

          {activeKey === "reportes" ? (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {summaryCards.map((card) => (
                  <article key={card.key} className="glass-panel rounded-[1.6rem] p-5">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
                    <p className="mt-4 text-3xl font-semibold text-slate-900">{summary[card.key] ?? 0}</p>
                  </article>
                ))}
              </section>

              <section className="glass-panel rounded-[1.8rem] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Módulos del sistema</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Acceso directo a cada área</h3>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {navigationModules.map((module) => (
                    <button
                      key={`card-${module.key}`}
                      className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
                        activeKey === module.key
                          ? "border-emerald-200 bg-emerald-50 shadow-sm"
                          : "border-slate-200 bg-white/80 hover:border-teal-200 hover:bg-white"
                      }`}
                      onClick={() => navigateToView(module.key)}
                    >
                      <p className="text-sm font-semibold text-slate-900">{module.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{module.description}</p>
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          {activeKey === "reportes" ? (
            <section className="grid gap-4 xl:grid-cols-2">
              {Object.entries(reports).map(([key, reportRows]) => (
                <article key={key} className="glass-panel overflow-hidden rounded-[1.8rem]">
                  <div className="border-b border-slate-200/70 px-5 py-4">
                    <h3 className="text-lg font-semibold text-slate-900">{humanizeKey(key)}</h3>
                  </div>
                  <div className="overflow-x-auto px-5 py-4">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-slate-500">
                          {Object.keys(reportRows[0] ?? { detalle: "" }).map((column) => (
                            <th key={column} className="px-3 py-2 font-medium whitespace-nowrap">
                              {humanizeKey(column)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportRows.length ? (
                          reportRows.map((row, index) => (
                            <tr key={`${key}-${index}`} className="border-b border-slate-100 last:border-0">
                              {Object.entries(row).map(([column, value]) => (
                                <td key={column} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                                  {formatCell(column, value)}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="px-3 py-4 text-slate-500" colSpan={1}>
                              Sin datos disponibles.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>
              ))}
            </section>
          ) : activeKey === "operaciones" ? (
            <section className="grid gap-4 xl:grid-cols-2">
              <article className="rounded-[1.8rem] border border-emerald-200 bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800 p-6 text-white shadow-[0_20px_60px_rgba(6,78,59,0.24)]">
                <p className="text-xs uppercase tracking-[0.28em] text-emerald-100/90">Recreo turístico</p>
                <h3 className="mt-3 text-2xl font-semibold text-white">Flujo operativo listo para atención</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50">
                  Registra una reserva, abre el pedido, agrega consumos y simula el pago sin salir del panel.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/14 px-4 py-3 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Próx. reserva</p>
                    <p className="mt-2 text-xl font-semibold text-white">{codes.reserva ?? "R0001"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/14 px-4 py-3 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Próx. pedido</p>
                    <p className="mt-2 text-xl font-semibold text-white">{codes.pedido ?? "PD0001"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/14 px-4 py-3 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Mesas cargadas</p>
                    <p className="mt-2 text-xl font-semibold text-white">{lookups.mesas?.length ?? 0}</p>
                  </div>
                </div>
              </article>

              <article className="glass-panel rounded-[1.8rem] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Reserva de mesa</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Registrar nueva reserva</h3>
                  </div>
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                    {String(operationForms.reserva.codigo_reserva ?? codes.reserva ?? "R0001")}
                  </span>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-600">Cliente</span>
                    <select
                      className={operationInputClassName}
                      value={String(operationForms.reserva.id_cliente ?? "")}
                      onChange={(event) => updateOperationForm("reserva", "id_cliente", event.target.value)}
                    >
                      <option value="">Selecciona un cliente</option>
                      {(lookups.clientes ?? []).map((cliente) => (
                        <option key={String(cliente.id_cliente)} value={String(cliente.id_cliente)}>
                          {formatClientLabel(cliente)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-600">Mesa</span>
                    <select
                      className={operationInputClassName}
                      value={String(operationForms.reserva.id_mesa ?? "")}
                      onChange={(event) => updateOperationForm("reserva", "id_mesa", event.target.value)}
                    >
                      <option value="">Selecciona una mesa</option>
                      {(lookups.mesas ?? []).map((mesa) => (
                        <option key={String(mesa.id_mesa)} value={String(mesa.id_mesa)}>
                          {String(mesa.codigo_mesa)} - Cap. {String(mesa.capacidad)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-600">Fecha</span>
                    <input
                      type="date"
                      className={operationInputClassName}
                      value={String(operationForms.reserva.fecha_reserva ?? "")}
                      onChange={(event) => updateOperationForm("reserva", "fecha_reserva", event.target.value)}
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-600">Personas</span>
                    <input
                      type="number"
                      min="1"
                      className={operationInputClassName}
                      value={String(operationForms.reserva.cantidad_personas ?? 1)}
                      onChange={(event) => updateOperationForm("reserva", "cantidad_personas", event.target.value)}
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-600">Hora inicio</span>
                    <input
                      type="time"
                      className={operationInputClassName}
                      value={String(operationForms.reserva.hora_inicio ?? "12:00")}
                      onChange={(event) => updateOperationForm("reserva", "hora_inicio", event.target.value)}
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-600">Hora fin</span>
                    <input
                      type="time"
                      className={operationInputClassName}
                      value={String(operationForms.reserva.hora_fin ?? "14:00")}
                      onChange={(event) => updateOperationForm("reserva", "hora_fin", event.target.value)}
                    />
                  </label>
                </div>
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-medium text-slate-600">Observaciones</span>
                  <textarea
                    className={`${operationInputClassName} min-h-[96px] resize-y`}
                    value={String(operationForms.reserva.observaciones ?? "")}
                    onChange={(event) => updateOperationForm("reserva", "observaciones", event.target.value)}
                    placeholder="Ejemplo: cumpleaños familiar, decoración ligera, preferencia de sombra."
                  />
                </label>
                <button
                  type="button"
                  disabled={saving}
                  className="mt-5 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => submitOperation("reserva")}
                >
                  {saving ? "Procesando..." : "Registrar reserva"}
                </button>
              </article>

              <article className="glass-panel rounded-[1.8rem] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-orange-700">Gestión del pedido</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Abrir pedido por mesa</h3>
                  </div>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                    {String(operationForms.pedido.codigo_pedido ?? codes.pedido ?? "PD0001")}
                  </span>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-600">Reserva asociada</span>
                    <select
                      className={operationInputClassName}
                      value={String(operationForms.pedido.id_reserva ?? "")}
                      onChange={(event) => updateOperationForm("pedido", "id_reserva", event.target.value)}
                    >
                      <option value="">Sin reserva previa</option>
                      {(lookups.reservas ?? []).map((reserva) => (
                        <option key={String(reserva.id_reserva)} value={String(reserva.id_reserva)}>
                          {String(reserva.codigo_reserva)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-600">Mesa</span>
                    <select
                      className={operationInputClassName}
                      value={String(operationForms.pedido.id_mesa ?? "")}
                      onChange={(event) => updateOperationForm("pedido", "id_mesa", event.target.value)}
                    >
                      <option value="">Selecciona una mesa</option>
                      {(lookups.mesas ?? []).map((mesa) => (
                        <option key={String(mesa.id_mesa)} value={String(mesa.id_mesa)}>
                          {String(mesa.codigo_mesa)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-600">Cliente</span>
                    <select
                      className={operationInputClassName}
                      value={String(operationForms.pedido.id_cliente ?? "")}
                      onChange={(event) => updateOperationForm("pedido", "id_cliente", event.target.value)}
                    >
                      <option value="">Cliente eventual</option>
                      {(lookups.clientes ?? []).map((cliente) => (
                        <option key={String(cliente.id_cliente)} value={String(cliente.id_cliente)}>
                          {formatClientLabel(cliente)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-600">Descuento</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={operationInputClassName}
                      value={String(operationForms.pedido.descuento ?? 0)}
                      onChange={(event) => updateOperationForm("pedido", "descuento", event.target.value)}
                    />
                  </label>
                </div>
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-medium text-slate-600">Observaciones</span>
                  <textarea
                    className={`${operationInputClassName} min-h-[96px] resize-y`}
                    value={String(operationForms.pedido.observaciones ?? "")}
                    onChange={(event) => updateOperationForm("pedido", "observaciones", event.target.value)}
                    placeholder="Ejemplo: mesa en piscina, atención rápida, cliente corporativo."
                  />
                </label>
                <button
                  type="button"
                  disabled={saving}
                  className="mt-5 w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => submitOperation("pedido")}
                >
                  {saving ? "Procesando..." : "Abrir pedido"}
                </button>
              </article>

              <article className="glass-panel rounded-[1.8rem] p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-700">Detalle del pedido</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Agregar productos al consumo</h3>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-600">Pedido</span>
                    <select
                      className={operationInputClassName}
                      value={String(operationForms.detalle.id_pedido ?? "")}
                      onChange={(event) => updateOperationForm("detalle", "id_pedido", event.target.value)}
                    >
                      <option value="">Selecciona un pedido</option>
                      {(lookups.pedidos ?? []).map((pedido) => (
                        <option key={String(pedido.id_pedido)} value={String(pedido.id_pedido)}>
                          {String(pedido.codigo_pedido)} - Mesa {String(pedido.id_mesa)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-600">Producto</span>
                    <select
                      className={operationInputClassName}
                      value={String(operationForms.detalle.id_producto ?? "")}
                      onChange={(event) => {
                        const selectedId = event.target.value;
                        updateOperationForm("detalle", "id_producto", selectedId);
                        updateOperationForm("detalle", "precio_unitario", findProductPrice(lookups.productos ?? [], selectedId));
                      }}
                    >
                      <option value="">Selecciona un producto</option>
                      {(lookups.productos ?? []).map((producto) => (
                        <option key={String(producto.id_producto)} value={String(producto.id_producto)}>
                          {String(producto.nombre)} - S/ {formatMoney(producto.precio_venta)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-600">Cantidad</span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      className={operationInputClassName}
                      value={String(operationForms.detalle.cantidad ?? 1)}
                      onChange={(event) => updateOperationForm("detalle", "cantidad", event.target.value)}
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-600">Precio unitario</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={operationInputClassName}
                      value={String(operationForms.detalle.precio_unitario ?? "")}
                      onChange={(event) => updateOperationForm("detalle", "precio_unitario", event.target.value)}
                    />
                  </label>
                </div>
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-medium text-slate-600">Observaciones</span>
                  <textarea
                    className={`${operationInputClassName} min-h-[96px] resize-y`}
                    value={String(operationForms.detalle.observaciones ?? "")}
                    onChange={(event) => updateOperationForm("detalle", "observaciones", event.target.value)}
                    placeholder="Ejemplo: sin hielo, punto de cocción, entrega prioritaria."
                  />
                </label>
                <button
                  type="button"
                  disabled={saving}
                  className="mt-5 w-full rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => submitOperation("detalle")}
                >
                  {saving ? "Procesando..." : "Agregar al pedido"}
                </button>
              </article>

              <article className="glass-panel rounded-[1.8rem] p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-lime-700">Simulación del pago</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Calcular cobro y vuelto</h3>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-600">Pedido</span>
                    <select
                      className={operationInputClassName}
                      value={String(operationForms.simulacion.idPedido ?? "")}
                      onChange={(event) => updateOperationForm("simulacion", "idPedido", event.target.value)}
                    >
                      <option value="">Selecciona un pedido</option>
                      {(lookups.pedidos ?? []).map((pedido) => (
                        <option key={String(pedido.id_pedido)} value={String(pedido.id_pedido)}>
                          {String(pedido.codigo_pedido)} - Total S/ {formatMoney(pedido.total)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-600">Monto recibido</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={operationInputClassName}
                      value={String(operationForms.simulacion.montoRecibido ?? "")}
                      onChange={(event) => updateOperationForm("simulacion", "montoRecibido", event.target.value)}
                    />
                  </label>
                </div>
                <div className="mt-5 rounded-2xl border border-lime-100 bg-lime-50 px-4 py-4 text-sm text-lime-900">
                  La simulación toma subtotal, descuento, IGV y total del pedido seleccionado, y guarda el cálculo en la tabla
                  <span className="font-semibold"> simulaciones_pago</span>.
                </div>
                <button
                  type="button"
                  disabled={saving}
                  className="mt-5 w-full rounded-2xl bg-lime-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-lime-500 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => submitOperation("simulacion")}
                >
                  {saving ? "Procesando..." : "Simular pago"}
                </button>
              </article>
            </section>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
              <section className="glass-panel overflow-hidden rounded-[1.8rem]">
                <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Registros</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {activeModule?.title} · {displayedRows.length} resultados visibles
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={String(pageSize)}
                      onChange={(event) => setPageSize(Number(event.target.value))}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-400"
                    >
                      <option value="10">10 por página</option>
                      <option value="20">20 por página</option>
                      <option value="50">50 por página</option>
                    </select>
                    <input
                      type="search"
                      value={moduleSearch}
                      onChange={(event) => setModuleSearch(event.target.value)}
                      placeholder="Buscar en la tabla..."
                      className="w-56 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-400"
                    />
                    {moduleLoading ? <span className="text-sm text-slate-500">Cargando...</span> : null}
                  </div>
                </div>
                <div className="overflow-x-auto px-5 py-4">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        {Object.keys(rows[0] ?? buildTableFallback(activeModule)).map((column) => (
                          <th key={column} className="px-3 py-2 font-medium whitespace-nowrap">
                            {humanizeKey(column)}
                          </th>
                        ))}
                        {!activeModule?.readOnly ? <th className="px-3 py-2">Acciones</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.length ? (
                        paginatedRows.map((row, index) => (
                          <tr key={buildRowKey(row, activeModule, index)} className="border-b border-slate-100 align-top last:border-0">
                            {Object.entries(row).map(([column, value]) => (
                              <td key={column} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                                {formatCell(column, value)}
                              </td>
                            ))}
                            {!activeModule?.readOnly ? (
                              <td className="px-3 py-2">
                                <div className="flex gap-2">
                                  <button
                                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                                    onClick={() => onEdit(row)}
                                  >
                                    Editar
                                  </button>
                                  {activeModule?.allowDelete !== false ? (
                                    <button
                                      className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600"
                                      onClick={() => handleDelete(Number(row[activeModule.idField]))}
                                    >
                                      Eliminar
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            ) : null}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-3 py-4 text-slate-500" colSpan={activeModule?.readOnly ? 1 : 2}>
                            No hay registros para mostrar con ese filtro.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {displayedRows.length ? (
                  <div className="flex flex-col gap-3 border-t border-slate-200/70 px-5 py-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
                    <p>
                      Mostrando {Math.min((currentPage - 1) * pageSize + 1, displayedRows.length)} a {Math.min(currentPage * pageSize, displayedRows.length)} de {displayedRows.length} registros
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        className="rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      >
                        Anterior
                      </button>
                      <span className="rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-700">
                        Página {currentPage} de {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        className="rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="glass-panel rounded-[1.8rem] p-5">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">{editingId ? "Editar registro" : "Nuevo registro"}</h3>
                  {!activeModule?.readOnly ? (
                    <button className="text-sm font-medium text-teal-700" onClick={resetEditor}>
                      Limpiar
                    </button>
                  ) : null}
                </div>

                {activeModule?.readOnly ? (
                  <p className="text-sm leading-6 text-slate-500">
                    Este módulo es de solo consulta. Puedes revisar la bitácora desde la tabla de la izquierda.
                  </p>
                ) : (
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid gap-4 md:grid-cols-2">
                      {activeModule?.fields.map((field) => (
                        <label key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                          <span className="mb-2 block text-sm font-medium text-slate-600">{field.label}</span>
                          {renderField(field, form[field.key], lookups[field.lookupResource ?? ""], onInputChange)}
                        </label>
                      ))}
                    </div>

                    {activeModule?.key === "productos" ? (
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-600">Foto del producto</span>
                        <input
                          key={fileInputKey}
                          type="file"
                          accept="image/*"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
                          onChange={handleProductFileChange}
                        />
                        <p className="mt-2 text-xs text-slate-500">Formatos permitidos: JPG, JPEG, PNG o WEBP. Tamaño máximo: 15.0 MB.</p>
                        {productImageError ? (
                          <p className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                            {productImageError}
                          </p>
                        ) : null}
                      </label>
                    ) : null}

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Guardando..." : editingId ? "Actualizar registro" : "Crear registro"}
                    </button>
                  </form>
                )}
              </section>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function renderField(
  field: ModuleConfig["fields"][number],
  value: unknown,
  options: Array<Record<string, unknown>> | undefined,
  onInputChange: (key: string, value: unknown) => void
) {
  const baseClassName =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-400";

  if (field.type === "textarea") {
    return (
      <textarea
        className={`${baseClassName} min-h-[110px] resize-y`}
        value={String(value ?? "")}
        onChange={(event) => onInputChange(field.key, event.target.value)}
        placeholder={field.placeholder}
      />
    );
  }

  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onInputChange(field.key, event.target.checked)} />
        Habilitado
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <select className={baseClassName} value={String(value ?? "")} onChange={(event) => onInputChange(field.key, event.target.value)}>
        <option value="">Selecciona una opción</option>
        {field.options
          ? field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          : (options ?? []).map((option) => (
              <option key={String(option[field.optionValue ?? "id"])} value={String(option[field.optionValue ?? "id"])}>
                {String(option[field.optionLabel ?? field.optionValue ?? "id"])}
              </option>
            ))}
      </select>
    );
  }

  return (
    <input
      type={field.type === "number" ? "number" : field.type}
      className={baseClassName}
      value={String(value ?? "")}
      onChange={(event) => onInputChange(field.key, event.target.value)}
      placeholder={field.placeholder}
    />
  );
}

function buildOperationForms(user: SessionUser | null, nextCodes: { reserva?: string; pedido?: string }): OperationForms {
  return {
    reserva: {
      codigo_reserva: nextCodes.reserva ?? "R0001",
      id_cliente: "",
      id_mesa: "",
      fecha_reserva: "",
      hora_inicio: "12:00",
      hora_fin: "14:00",
      cantidad_personas: 1,
      estado_reserva: "PENDIENTE",
      observaciones: "",
      id_usuario_registro: user?.id ?? ""
    },
    pedido: {
      codigo_pedido: nextCodes.pedido ?? "PD0001",
      id_reserva: "",
      id_mesa: "",
      id_cliente: "",
      estado_pedido: "ABIERTO",
      descuento: 0,
      observaciones: "",
      id_usuario_registro: user?.id ?? ""
    },
    detalle: {
      id_pedido: "",
      id_producto: "",
      cantidad: 1,
      precio_unitario: "",
      descuento_item: 0,
      observaciones: ""
    },
    simulacion: {
      idPedido: "",
      montoRecibido: ""
    }
  };
}

function buildInitialForm(module: ModuleConfig, user: SessionUser | null) {
  return module.fields.reduce<Record<string, unknown>>((accumulator, field) => {
    if (field.type === "boolean") {
      accumulator[field.key] = field.key === "estado";
    } else if (user && ["id_usuario_registro", "id_usuario", "id_usuario_apertura"].includes(field.key)) {
      accumulator[field.key] = user.id;
    } else if (field.key === "estado_operativo") {
      accumulator[field.key] = "DISPONIBLE";
    } else if (field.key === "estado_reserva") {
      accumulator[field.key] = "PENDIENTE";
    } else if (field.key === "estado_pedido") {
      accumulator[field.key] = "ABIERTO";
    } else if (field.key === "estado_pago") {
      accumulator[field.key] = "PAGADO";
    } else if (field.key === "tipo_movimiento") {
      accumulator[field.key] = "INGRESO";
    } else if (field.key === "unidad_medida") {
      accumulator[field.key] = "UNIDAD";
    } else {
      accumulator[field.key] = "";
    }
    return accumulator;
  }, {});
}

function normalizePayload(module: ModuleConfig, form: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};

  for (const field of module.fields) {
    const rawValue = form[field.key];
    if (field.type === "boolean") {
      payload[field.key] = Boolean(rawValue);
      continue;
    }

    if (rawValue === "" || rawValue === null || typeof rawValue === "undefined") {
      continue;
    }

    if (field.type === "number") {
      payload[field.key] = Number(rawValue);
      continue;
    }

    if (field.type === "select") {
      payload[field.key] = field.lookupResource ? Number(rawValue) : rawValue;
      continue;
    }

    payload[field.key] = rawValue;
  }

  return payload;
}

function normalizeOperationPayload(payload: Record<string, unknown>, numericKeys: string[]) {
  const normalized: Record<string, unknown> = {};

  for (const [key, rawValue] of Object.entries(payload)) {
    if (rawValue === "" || rawValue === null || typeof rawValue === "undefined") {
      continue;
    }

    if (numericKeys.includes(key)) {
      normalized[key] = Number(rawValue);
      continue;
    }

    normalized[key] = rawValue;
  }

  return normalized;
}

function humanizeKey(value: string) {
  return value.replaceAll("_", " ").replace(/([A-Z])/g, " $1").replace(/\b\w/g, (char) => char.toUpperCase()).trim();
}

function formatClientLabel(cliente: Record<string, unknown>) {
  const nombres = String(cliente.nombres ?? "").trim();
  const apellidos = String(cliente.apellidos ?? "").trim();
  return `${nombres}${apellidos ? ` ${apellidos}` : ""}`.trim();
}

function formatMoney(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

function findProductPrice(products: Array<Record<string, unknown>>, productId: string) {
  const selected = products.find((product) => String(product.id_producto) === String(productId));
  return selected ? Number(selected.precio_venta ?? 0) : "";
}

function formatCell(column: string, value: unknown) {
  if (value === null || typeof value === "undefined" || value === "") {
    return "—";
  }

  if (column === "foto_url" && typeof value === "string") {
    return <img src={`${API_URL}${value}`} alt="Producto" className="h-12 w-12 rounded-xl object-cover" />;
  }

  if ((column === "valores_anteriores" || column === "valores_nuevos") && typeof value === "object") {
    return (
      <pre className="max-w-[340px] overflow-x-auto whitespace-pre-wrap rounded-2xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  if ((column === "valores_anteriores" || column === "valores_nuevos") && typeof value === "string") {
    return (
      <pre className="max-w-[340px] overflow-x-auto whitespace-pre-wrap rounded-2xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">
        {value}
      </pre>
    );
  }

  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  return String(value);
}

function buildTableFallback(module: ModuleConfig | null) {
  if (!module) {
    return { id: "" };
  }

  return module.fields.reduce<Record<string, string>>(
    (accumulator, field) => ({ ...accumulator, [field.key]: "" }),
    { [module.idField]: "" }
  );
}

function filterRows(rows: Array<Record<string, unknown>>, search: string) {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) {
    return rows;
  }

  return rows.filter((row) =>
    Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch))
  );
}

function buildRowKey(row: Record<string, unknown>, module: ModuleConfig | null, index: number) {
  if (module?.idField && row[module.idField] !== null && typeof row[module.idField] !== "undefined") {
    return `${module.key}-${String(row[module.idField])}`;
  }

  const fallbackIdEntry = Object.entries(row).find(([key, value]) => {
    if (value === null || typeof value === "undefined" || value === "") {
      return false;
    }
    return key.startsWith("id_") || key.startsWith("codigo_");
  });

  if (fallbackIdEntry) {
    return `${module?.key ?? "row"}-${fallbackIdEntry[0]}-${String(fallbackIdEntry[1])}`;
  }

  return `${module?.key ?? "row"}-${index}`;
}

function buildDashboardRoute(view: string) {
  return `/dashboard/${view}`;
}

const operationInputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400";

export default function DashboardIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const currentUser = getStoredUser();
    const fallbackView = currentUser?.role === "ADMINISTRADOR" ? "usuarios" : "clientes";
    router.replace(buildDashboardRoute(fallbackView));
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="glass-panel rounded-3xl px-8 py-6 text-base font-medium text-slate-700">
        Cargando módulo...
      </div>
    </main>
  );
}
