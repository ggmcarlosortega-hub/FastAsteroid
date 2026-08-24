"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  Camera,
  Phone,
  User,
  MapPin,
  Package,
  Banknote,
  Box,
  Save,
  ArrowLeft,
  Loader2,
  Plus,
} from "lucide-react";
import { parseComandaText } from "../logic/comandaParser";
import { getCurrentPositionAsync } from "../logic/geolocation";

const MySwal = withReactContent(Swal);
const VOLVER = Symbol("volver");
const ESPACIOS_VALIDOS = [1, 2, 3];

// Mismo patrón que NuevoDomicilioModal.js: cada paso es su propio Swal.fire
// independiente, encadenado desde la función async orquestadora — SweetAlert2
// puede remontar el contenido de un popup abierto y borrar el estado de React de
// un componente que abarque varios pasos (ver conventions.md).

// Escala de grises + contraste simple: mejora bastante la lectura de OCR sobre
// una foto real (fondo con ruido, luz despareja) sin agregar ninguna dependencia
// — se probó contra una comanda real y subió la confianza de Tesseract de ~39% a
// ~59% solo con esto más el modo de segmentación de página correcto.
function preprocesarImagen(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const datos = imageData.data;
      for (let i = 0; i < datos.length; i += 4) {
        const gris = 0.299 * datos[i] + 0.587 * datos[i + 1] + 0.114 * datos[i + 2];
        const valor = gris > 150 ? 255 : gris < 90 ? 0 : gris;
        datos[i] = datos[i + 1] = datos[i + 2] = valor;
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function leerComanda(dataUrl) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("spa");
  try {
    await worker.setParameters({ tessedit_pageseg_mode: "4" });
    const imagenProcesada = await preprocesarImagen(dataUrl);
    const { data } = await worker.recognize(imagenProcesada);
    return parseComandaText(data.text);
  } finally {
    await worker.terminate();
  }
}

// --- Paso 1: capturar la foto de la comanda y leerla ---

function CapturaStepContent({ onListo }) {
  const [leyendo, setLeyendo] = useState(false);

  async function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLeyendo(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      // Si el OCR falla por completo (ej. worker no carga), se sigue con los
      // campos vacíos en vez de bloquear — el domiciliario los completa a mano.
      const parsed = await leerComanda(dataUrl).catch(() => ({
        telefono: "",
        nombre: "",
        referencia: "",
        productos: "",
        precio: "",
      }));
      onListo({ foto: dataUrl, ...parsed });
    };
    reader.readAsDataURL(file);
  }

  if (leyendo) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 size={28} className="animate-spin text-orange-500" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Leyendo la comanda...</p>
      </div>
    );
  }

  return (
    <div className="text-left">
      <p className="mb-3 flex items-start gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <Camera size={16} className="mt-0.5 shrink-0" />
        Toma la foto lo más cerca, derecha y con buena luz posible — así se lee mejor
        automáticamente. Siempre vas a poder revisar y corregir antes de guardar.
      </p>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFoto}
        className="w-full text-sm"
      />
    </div>
  );
}

function openCapturaStep() {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Escanear comanda",
      html: (
        <CapturaStepContent
          onListo={(datos) => {
            resolved = true;
            resolve(datos);
            MySwal.close();
          }}
        />
      ),
      showConfirmButton: false,
      showCloseButton: true,
      allowOutsideClick: false,
      width: 420,
      didClose: () => {
        if (!resolved) resolve(null);
      },
    });
  });
}

// --- Paso 2: revisar y corregir lo que se leyó ---

function RevisionStepContent({ valoresIniciales, onBack, onConfirmar }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      telefono: valoresIniciales.telefono ?? "",
      nombre: valoresIniciales.nombre ?? "",
      referencia: valoresIniciales.referencia ?? "",
      productos: valoresIniciales.productos ?? "",
      precio: valoresIniciales.precio ?? "",
    },
  });
  const telefonoActual = watch("telefono");

  return (
    <form onSubmit={handleSubmit(onConfirmar)} className="flex flex-col gap-4 text-left">
      <p className="text-xs text-amber-600 dark:text-amber-400">
        La lectura automática puede fallar, sobre todo con el teléfono — revisa cada campo antes
        de continuar.
      </p>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Phone size={14} />
          Teléfono del cliente
        </label>
        <div className="flex gap-2">
          <input
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
            {...register("telefono", { required: "Obligatorio" })}
          />
          {telefonoActual && (
            <a
              href={`tel:${telefonoActual}`}
              title="Llamar al cliente"
              className="flex shrink-0 items-center justify-center rounded-lg border border-zinc-300 px-3 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <Phone size={16} />
            </a>
          )}
        </div>
        {errors.telefono && <p className="mt-1 text-xs text-red-500">{errors.telefono.message}</p>}
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <User size={14} />
          Nombre del cliente
        </label>
        <input
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("nombre", { required: "Obligatorio" })}
        />
        {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>}
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <MapPin size={14} />
          Referencia / dirección
        </label>
        <input
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("referencia", { required: "Obligatorio" })}
        />
        {errors.referencia && (
          <p className="mt-1 text-xs text-red-500">{errors.referencia.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Package size={14} />
          Productos
        </label>
        <textarea
          rows={2}
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

      <div className="mt-2 flex justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft size={14} />
          Repetir foto
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Save size={15} />
          Continuar
        </button>
      </div>
    </form>
  );
}

function openRevisionStep(valoresIniciales) {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Revisar datos leídos",
      html: (
        <RevisionStepContent
          valoresIniciales={valoresIniciales}
          onBack={() => {
            resolved = true;
            resolve(VOLVER);
            MySwal.close();
          }}
          onConfirmar={(valores) => {
            resolved = true;
            resolve(valores);
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

// --- Resolución de cliente + ubicación (sin panel propio, con loader) ---

function UbicacionesStepContent({ cliente, referenciaComanda, onBack, onSelect }) {
  return (
    <div className="text-left">
      <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
        <strong>{cliente.nombre}</strong> ya tiene ubicaciones guardadas.
      </p>
      <div className="max-h-56 divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {cliente.ubicaciones.map((u) => (
          <button
            key={u.id_ubicacion}
            onClick={() => onSelect(u)}
            className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {u.alias_direccion}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {u.latitud}, {u.longitud}
            </span>
          </button>
        ))}
      </div>
      <button
        onClick={() => onSelect(null)}
        className="mt-3 flex w-full items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 dark:border-zinc-700 dark:hover:bg-orange-900/10"
      >
        <Plus size={15} />
        Es una dirección nueva{referenciaComanda ? ` — "${referenciaComanda}"` : ""}
      </button>
      <button
        onClick={onBack}
        className="mt-3 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        Volver
      </button>
    </div>
  );
}

function openUbicacionesStep(cliente, referenciaComanda) {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Ubicación del cliente",
      html: (
        <UbicacionesStepContent
          cliente={cliente}
          referenciaComanda={referenciaComanda}
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
      width: 420,
      didClose: () => {
        if (!resolved) resolve(null);
      },
    });
  });
}

function mostrarCargando(titulo) {
  MySwal.fire({
    title: titulo,
    didOpen: () => MySwal.showLoading(),
    allowOutsideClick: false,
    showConfirmButton: false,
  });
}

// El teléfono/nombre extraídos identifican al cliente; la referencia de la
// comanda solo se usa si hace falta crear una ubicación nueva. Como la comanda no
// trae coordenadas GPS, una ubicación nueva se guarda con la posición actual del
// domiciliario como punto de partida temporal — al marcar la entrega, el sistema
// ya reemplaza esa ubicación por la posición real capturada ahí (sección 6 del
// documento unificado), así que no hace falta que sea exacta desde el principio.
async function resolverClienteYUbicacion(datos) {
  mostrarCargando("Buscando cliente...");

  let cliente;
  const resCliente = await fetch(`/api/clientes/${datos.telefono}`);
  if (resCliente.ok) {
    cliente = await resCliente.json();
  } else {
    const resCrear = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefono: datos.telefono, nombre: datos.nombre }),
    });
    const dataCrear = await resCrear.json();
    if (!resCrear.ok) throw new Error(dataCrear.error ?? "No se pudo registrar el cliente");
    cliente = { ...dataCrear, ubicaciones: [] };
  }
  MySwal.close();

  let ubicacion = null;
  if (cliente.ubicaciones?.length > 0) {
    ubicacion = await openUbicacionesStep(cliente, datos.referencia);
    if (ubicacion === VOLVER) return VOLVER;
  }

  if (!ubicacion) {
    mostrarCargando("Capturando tu ubicación...");
    const posicion = await getCurrentPositionAsync();
    if (!posicion) {
      MySwal.close();
      throw new Error("No se pudo capturar tu ubicación GPS. Actívala e intenta de nuevo");
    }
    const resUbicacion = await fetch(`/api/clientes/${cliente.telefono}/ubicaciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alias_direccion: datos.referencia?.trim() || `Comanda ${new Date().toLocaleDateString("es-CO")}`,
        latitud: posicion.latitud,
        longitud: posicion.longitud,
      }),
    });
    const dataUbicacion = await resUbicacion.json();
    MySwal.close();
    if (!resUbicacion.ok) throw new Error(dataUbicacion.error ?? "No se pudo guardar la ubicación");
    ubicacion = dataUbicacion;
  }

  return { telefono_cliente: cliente.telefono, ubicacion };
}

// --- Paso final: espacio del baúl (la foto ya se tiene, no se vuelve a pedir) ---

function EspacioStepContent({ espaciosOcupados, onBack, onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { espacio_baul: "" } });
  const espaciosLibres = ESPACIOS_VALIDOS.filter((e) => !espaciosOcupados.includes(e));

  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit({ espacio_baul: Number(v.espacio_baul) }))}
      className="flex flex-col gap-4 text-left"
    >
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Box size={14} />
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

      <div className="mt-2 flex justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft size={14} />
          Volver
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Save size={15} />
          Registrar domicilio
        </button>
      </div>
    </form>
  );
}

function openEspacioStep(espaciosOcupados) {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Espacio del baúl",
      html: (
        <EspacioStepContent
          espaciosOcupados={espaciosOcupados}
          onBack={() => {
            resolved = true;
            resolve(VOLVER);
            MySwal.close();
          }}
          onSubmit={(valores) => {
            resolved = true;
            resolve(valores);
            MySwal.close();
          }}
        />
      ),
      showConfirmButton: false,
      showCloseButton: true,
      width: 380,
      didClose: () => {
        if (!resolved) resolve(null);
      },
    });
  });
}

// --- Orquestador ---

export async function openEscanearComandaModal(espaciosOcupados) {
  let datosOCR = null;
  let clienteUbicacion = null;
  let paso = "captura";

  while (true) {
    if (paso === "captura") {
      const resultado = await openCapturaStep();
      if (!resultado) return null;
      datosOCR = resultado;
      paso = "revision";
      continue;
    }

    if (paso === "revision") {
      const resultado = await openRevisionStep(datosOCR);
      if (resultado === VOLVER) {
        paso = "captura";
        continue;
      }
      if (!resultado) return null;
      datosOCR = { ...datosOCR, ...resultado };
      paso = "resolviendo";
      continue;
    }

    if (paso === "resolviendo") {
      try {
        const resultado = await resolverClienteYUbicacion(datosOCR);
        if (resultado === VOLVER) {
          paso = "revision";
          continue;
        }
        clienteUbicacion = resultado;
      } catch (err) {
        await Swal.fire({ icon: "error", title: "No se pudo continuar", text: err.message });
        paso = "revision";
        continue;
      }
      paso = "espacio";
      continue;
    }

    // paso === "espacio"
    const resultado = await openEspacioStep(espaciosOcupados);
    if (resultado === VOLVER) {
      paso = "revision";
      continue;
    }
    if (!resultado) return null;

    const res = await fetch("/api/domicilios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telefono_cliente: clienteUbicacion.telefono_cliente,
        id_ubicacion: clienteUbicacion.ubicacion.id_ubicacion,
        productos: datosOCR.productos,
        precio: Number(datosOCR.precio),
        espacio_baul: resultado.espacio_baul,
        foto_productos_url: datosOCR.foto,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      await Swal.fire({ icon: "error", title: "No se pudo crear el domicilio", text: data.error });
      paso = "espacio";
      continue;
    }

    return data;
  }
}
