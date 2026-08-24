"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  Search,
  UserPlus,
  User,
  Phone,
  MapPin,
  Plus,
  Navigation,
  Package,
  Camera,
  Banknote,
  ArrowLeft,
  Save,
} from "lucide-react";

const MySwal = withReactContent(Swal);

// Cada paso del wizard es su PROPIO Swal.fire independiente, encadenado con
// async/await en openNuevoDomicilioModal. SweetAlert2 puede re-renderizar el
// contenido de un popup abierto (por ejemplo al recalcular su tamaño), lo que
// remonta el componente React montado dentro y borra su estado — así que un
// solo componente con pasos internos (cliente → ubicación → detalle) pierde el
// cliente/ubicación ya elegidos a mitad de camino. Encadenar modales separados
// evita el problema por completo: el cliente y la ubicación seleccionados viven
// como variables normales de la función async, no como estado de React.

function ClienteStepContent({ onSelect }) {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState([]);
  const [crearNuevo, setCrearNuevo] = useState(false);
  const [serverError, setServerError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { telefono: "", nombre: "" } });

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/clientes${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      setResultados(await res.json());
    }, 300);
    return () => clearTimeout(timeout);
  }, [q]);

  async function onCrear(values) {
    setServerError(null);
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      setServerError(data.error ?? "No se pudo crear el cliente");
      return;
    }
    onSelect(data);
  }

  if (crearNuevo) {
    return (
      <form onSubmit={handleSubmit(onCrear)} className="flex flex-col gap-4 text-left">
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <Phone size={14} />
            Teléfono
          </label>
          <input
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
            {...register("telefono", { required: "Obligatorio" })}
          />
          {errors.telefono && <p className="mt-1 text-xs text-red-500">{errors.telefono.message}</p>}
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <User size={14} />
            Nombre
          </label>
          <input
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
            {...register("nombre", { required: "Obligatorio" })}
          />
          {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>}
        </div>
        {serverError && <p className="text-sm text-red-500">{serverError}</p>}
        <div className="mt-2 flex justify-between gap-2">
          <button
            type="button"
            onClick={() => setCrearNuevo(false)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft size={14} />
            Buscar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Save size={15} />
            Crear y continuar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="text-left">
      <div className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
        <Search size={16} className="text-zinc-400" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o teléfono..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="mt-3 max-h-56 divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {resultados.length === 0 && (
          <p className="p-4 text-center text-sm text-zinc-400">Sin resultados.</p>
        )}
        {resultados.map((cliente) => (
          <button
            key={cliente.telefono}
            onClick={() => onSelect(cliente)}
            className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{cliente.nombre}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{cliente.telefono}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => setCrearNuevo(true)}
        className="mt-3 flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700"
      >
        <UserPlus size={15} />
        Cliente nuevo
      </button>
    </div>
  );
}

function openClienteStep() {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Nuevo domicilio · Cliente",
      html: (
        <ClienteStepContent
          onSelect={(cliente) => {
            resolved = true;
            resolve(cliente);
            MySwal.close();
          }}
        />
      ),
      showConfirmButton: false,
      showCloseButton: true,
      width: 460,
      didClose: () => {
        if (!resolved) resolve(null);
      },
    });
  });
}

function UbicacionStepContent({ cliente, onBack, onSelect }) {
  const [ubicaciones, setUbicaciones] = useState(null);
  const [crearNueva, setCrearNueva] = useState(false);
  const [serverError, setServerError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { alias_direccion: "", latitud: "", longitud: "" } });

  useEffect(() => {
    fetch(`/api/clientes/${cliente.telefono}`)
      .then((res) => res.json())
      .then((data) => setUbicaciones(data.ubicaciones));
  }, [cliente.telefono]);

  async function onCrear(values) {
    setServerError(null);
    const res = await fetch(`/api/clientes/${cliente.telefono}/ubicaciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alias_direccion: values.alias_direccion,
        latitud: Number(values.latitud),
        longitud: Number(values.longitud),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setServerError(data.error ?? "No se pudo guardar la ubicación");
      return;
    }
    onSelect(data);
  }

  if (crearNueva) {
    return (
      <form onSubmit={handleSubmit(onCrear)} className="flex flex-col gap-4 text-left">
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <MapPin size={14} />
            Alias / dirección
          </label>
          <input
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
            {...register("alias_direccion", { required: "Obligatorio" })}
          />
          {errors.alias_direccion && (
            <p className="mt-1 text-xs text-red-500">{errors.alias_direccion.message}</p>
          )}
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <Navigation size={14} />
              Latitud
            </label>
            <input
              type="number"
              step="any"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
              {...register("latitud", { required: "Obligatorio" })}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">Longitud</label>
            <input
              type="number"
              step="any"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
              {...register("longitud", { required: "Obligatorio" })}
            />
          </div>
        </div>
        {serverError && <p className="text-sm text-red-500">{serverError}</p>}
        <div className="mt-2 flex justify-between gap-2">
          <button
            type="button"
            onClick={() => setCrearNueva(false)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft size={14} />
            Ubicaciones
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Save size={15} />
            Guardar y continuar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="text-left">
      <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
        Ubicación de entrega para <strong>{cliente.nombre}</strong>
      </p>

      <div className="max-h-56 divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {ubicaciones === null && <p className="p-4 text-center text-sm text-zinc-400">Cargando...</p>}
        {ubicaciones?.length === 0 && (
          <p className="p-4 text-center text-sm text-zinc-400">Sin ubicaciones guardadas.</p>
        )}
        {ubicaciones?.map((ubicacion) => (
          <button
            key={ubicacion.id_ubicacion}
            onClick={() => onSelect(ubicacion)}
            className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {ubicacion.alias_direccion}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {ubicacion.latitud}, {ubicacion.longitud}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          <ArrowLeft size={14} />
          Cliente
        </button>
        <button
          onClick={() => setCrearNueva(true)}
          className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700"
        >
          <Plus size={15} />
          Nueva ubicación
        </button>
      </div>
    </div>
  );
}

const VOLVER = Symbol("volver");

function openUbicacionStep(cliente) {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Nuevo domicilio · Ubicación",
      html: (
        <UbicacionStepContent
          cliente={cliente}
          onBack={() => {
            resolved = true;
            resolve(VOLVER);
            MySwal.close();
          }}
          onSelect={(ubicacion) => {
            resolved = true;
            resolve(ubicacion);
            MySwal.close();
          }}
        />
      ),
      showConfirmButton: false,
      showCloseButton: true,
      width: 460,
      didClose: () => {
        if (!resolved) resolve(null);
      },
    });
  });
}

function DetalleStepContent({ espaciosOcupados, pedirEspacio, onBack, onSubmit, serverError }) {
  const [foto, setFoto] = useState(null);
  const [fotoError, setFotoError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { productos: "", precio: "", espacio_baul: "" } });

  const espaciosLibres = pedirEspacio ? [1, 2, 3].filter((e) => !espaciosOcupados.includes(e)) : [];

  function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFoto(reader.result);
      setFotoError(null);
    };
    reader.readAsDataURL(file);
  }

  function onFormSubmit(values) {
    if (!foto) {
      setFotoError("La foto del pedido es obligatoria");
      return;
    }
    onSubmit({
      productos: values.productos,
      precio: Number(values.precio),
      ...(pedirEspacio ? { espacio_baul: Number(values.espacio_baul) } : {}),
      foto_productos_url: foto,
    });
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4 text-left">
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Package size={14} />
          Productos
        </label>
        <textarea
          rows={2}
          placeholder="2 hamburguesas, 1 gaseosa..."
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("productos", { required: "Obligatorio" })}
        />
        {errors.productos && <p className="mt-1 text-xs text-red-500">{errors.productos.message}</p>}
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Banknote size={14} />
          Precio (valor del pedido)
        </label>
        <input
          type="number"
          min="1"
          step="any"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("precio", { required: "Obligatorio", min: { value: 1, message: "Debe ser mayor a 0" } })}
        />
        {errors.precio && <p className="mt-1 text-xs text-red-500">{errors.precio.message}</p>}
      </div>

      {pedirEspacio && (
        <div>
          <label className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Espacio del baúl
          </label>
          <select
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
            {...register("espacio_baul", { required: "Obligatorio" })}
          >
            <option value="">Selecciona un espacio libre</option>
            {espaciosLibres.map((e) => (
              <option key={e} value={e}>
                Espacio {e}
              </option>
            ))}
          </select>
          {errors.espacio_baul && (
            <p className="mt-1 text-xs text-red-500">{errors.espacio_baul.message}</p>
          )}
        </div>
      )}

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Camera size={14} />
          Foto del pedido
        </label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFoto}
          className="w-full text-sm"
        />
        {foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="Foto del pedido" className="mt-2 h-28 w-28 rounded-lg object-cover" />
        )}
        {fotoError && <p className="mt-1 text-xs text-red-500">{fotoError}</p>}
      </div>

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

      <div className="mt-2 flex justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft size={14} />
          Ubicación
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Save size={15} />
          {pedirEspacio ? "Iniciar domicilio" : "Asignar domicilio"}
        </button>
      </div>
    </form>
  );
}

function openDetalleStep(espaciosOcupados, serverError, pedirEspacio = true) {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Nuevo domicilio · Detalle",
      html: (
        <DetalleStepContent
          espaciosOcupados={espaciosOcupados}
          pedirEspacio={pedirEspacio}
          serverError={serverError}
          onBack={() => {
            resolved = true;
            resolve(VOLVER);
            MySwal.close();
          }}
          onSubmit={(detalle) => {
            resolved = true;
            resolve(detalle);
            MySwal.close();
          }}
        />
      ),
      showConfirmButton: false,
      showCloseButton: true,
      width: 460,
      didClose: () => {
        if (!resolved) resolve(null);
      },
    });
  });
}

export async function openNuevoDomicilioModal(espaciosOcupados) {
  let cliente = null;
  let ubicacion = null;
  let detalleError = null;
  let paso = "cliente";

  while (true) {
    if (paso === "cliente") {
      const resultado = await openClienteStep();
      if (!resultado) return null;
      cliente = resultado;
      paso = "ubicacion";
      continue;
    }

    if (paso === "ubicacion") {
      const resultado = await openUbicacionStep(cliente);
      if (resultado === VOLVER) {
        paso = "cliente";
        continue;
      }
      if (!resultado) return null;
      ubicacion = resultado;
      paso = "detalle";
      continue;
    }

    // paso === "detalle"
    const resultado = await openDetalleStep(espaciosOcupados, detalleError);
    if (resultado === VOLVER) {
      detalleError = null;
      paso = "ubicacion";
      continue;
    }
    if (!resultado) return null;

    const res = await fetch("/api/domicilios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telefono_cliente: cliente.telefono,
        id_ubicacion: ubicacion.id_ubicacion,
        ...resultado,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      detalleError = data.error ?? "No se pudo crear el domicilio";
      continue;
    }

    return data;
  }
}

// --- Flujo exclusivo de Admin: además elige a qué domiciliario se asigna. ---

function DomiciliarioStepContent({ onBack, onSelect }) {
  const [domiciliarios, setDomiciliarios] = useState(null);

  useEffect(() => {
    fetch("/api/domiciliarios")
      .then((res) => res.json())
      .then(setDomiciliarios);
  }, []);

  return (
    <div className="text-left">
      <div className="max-h-56 divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {domiciliarios === null && <p className="p-4 text-center text-sm text-zinc-400">Cargando...</p>}
        {domiciliarios?.length === 0 && (
          <p className="p-4 text-center text-sm text-zinc-400">No hay domiciliarios registrados.</p>
        )}
        {domiciliarios?.map((domiciliario) => (
          <button
            key={domiciliario.telefono}
            onClick={() => onSelect(domiciliario)}
            className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {domiciliario.nombre}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{domiciliario.telefono}</span>
          </button>
        ))}
      </div>

      <button
        onClick={onBack}
        className="mt-3 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        Ubicación
      </button>
    </div>
  );
}

function openDomiciliarioStep() {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Nuevo domicilio · Asignar a",
      html: (
        <DomiciliarioStepContent
          onBack={() => {
            resolved = true;
            resolve(VOLVER);
            MySwal.close();
          }}
          onSelect={(domiciliario) => {
            resolved = true;
            resolve(domiciliario);
            MySwal.close();
          }}
        />
      ),
      showConfirmButton: false,
      showCloseButton: true,
      width: 460,
      didClose: () => {
        if (!resolved) resolve(null);
      },
    });
  });
}

export async function openNuevoDomicilioModalAdmin() {
  let cliente = null;
  let ubicacion = null;
  let domiciliario = null;
  let detalleError = null;
  let paso = "cliente";

  while (true) {
    if (paso === "cliente") {
      const resultado = await openClienteStep();
      if (!resultado) return null;
      cliente = resultado;
      paso = "ubicacion";
      continue;
    }

    if (paso === "ubicacion") {
      const resultado = await openUbicacionStep(cliente);
      if (resultado === VOLVER) {
        paso = "cliente";
        continue;
      }
      if (!resultado) return null;
      ubicacion = resultado;
      paso = "domiciliario";
      continue;
    }

    if (paso === "domiciliario") {
      const resultado = await openDomiciliarioStep();
      if (resultado === VOLVER) {
        paso = "ubicacion";
        continue;
      }
      if (!resultado) return null;
      domiciliario = resultado;
      paso = "detalle";
      continue;
    }

    // paso === "detalle" — el Admin no elige espacio de baúl: lo hace el
    // domiciliario al recoger el domicilio (sección 4 del documento).
    const resultado = await openDetalleStep([], detalleError, false);
    if (resultado === VOLVER) {
      detalleError = null;
      paso = "domiciliario";
      continue;
    }
    if (!resultado) return null;

    const res = await fetch("/api/domicilios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telefono_cliente: cliente.telefono,
        id_ubicacion: ubicacion.id_ubicacion,
        telefono_domiciliario: domiciliario.telefono,
        ...resultado,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      detalleError = data.error ?? "No se pudo crear el domicilio";
      continue;
    }

    return data;
  }
}
