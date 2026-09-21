"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Camera,
  ImageUp,
  Phone,
  User,
  MapPin,
  Banknote,
  Save,
  ArrowLeft,
  Loader2,
  Plus,
} from "lucide-react";
import { parseComandaText } from "../logic/comandaParser";
import { getCurrentPositionAsync } from "../logic/geolocation";
import { comprimirImagen } from "../logic/imagenUtil";
import { leerMejorTexto } from "../../../lib/ocr";
import EspacioBaulSelector from "./EspacioBaulSelector";
import SeleccionProductosPicker from "../../inventario/components/SeleccionProductosPicker";
import { sumaLineas } from "../../inventario/logic/lineasProductos";
import MySwal from "../../../lib/swal";
const VOLVER = Symbol("volver");

// Mismo patrón que NuevoDomicilioModal.js: cada paso es su propio Swal.fire
// independiente, encadenado desde la función async orquestadora — SweetAlert2
// puede remontar el contenido de un popup abierto y borrar el estado de React de
// un componente que abarque varios pasos (ver conventions.md).

// Lectura del OCR (reintento de 4 rotaciones, preprocesado a gris) extraída a
// lib/ocr.js — es infraestructura genérica, no algo específico de comandas; el
// nuevo escaneo de facturas de compra (EscanearCompraModal.js) la reutiliza.
async function leerComanda(dataUrl) {
  const texto = await leerMejorTexto(dataUrl);
  return parseComandaText(texto);
}

// --- Paso 1: capturar la foto de la comanda y leerla ---

function CapturaStepContent({ onListo }) {
  const [leyendo, setLeyendo] = useState(false);
  const inputCamaraRef = useRef(null);
  const inputGaleriaRef = useRef(null);

  async function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLeyendo(true);

    const reader = new FileReader();
    reader.onload = async () => {
      // Se comprime antes de leer y guardar: una foto de celular sin comprimir
      // puede pesar varios MB, lo que hace el OCR lentísimo/impreciso en un
      // celular real y además puede superar el límite de tamaño del body en
      // el servidor.
      const dataUrl = await comprimirImagen(reader.result);
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
        Toma la foto lo más cerca, derecha y con buena luz posible, o busca una ya tomada — así se
        lee mejor automáticamente. Siempre vas a poder revisar y corregir antes de guardar.
      </p>

      {/* Dos inputs ocultos: el de cámara lleva `capture="environment"` (abre la
          cámara directo en el celular), el de galería no lo lleva (abre el
          selector de archivos/galería normal) — cada botón dispara el suyo. */}
      <input
        ref={inputCamaraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFoto}
        className="hidden"
      />
      <input
        ref={inputGaleriaRef}
        type="file"
        accept="image/*"
        onChange={handleFoto}
        className="hidden"
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => inputCamaraRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Camera size={16} />
          Tomar foto
        </button>
        <button
          type="button"
          onClick={() => inputGaleriaRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <ImageUp size={16} />
          Buscar foto
        </button>
      </div>
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
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      telefono: valoresIniciales.telefono ?? "",
      nombre: valoresIniciales.nombre ?? "",
      referencia: valoresIniciales.referencia ?? "",
    },
  });
  const telefonoActual = watch("telefono");

  // Autocompletar por teléfono: si el número (leído por OCR o corregido a mano)
  // ya coincide con un cliente guardado, se rellenan nombre y referencia solos —
  // también sirve de red de seguridad para errores de OCR en el teléfono, porque
  // si al corregirlo aparece un cliente real se nota al toque. Mismo patrón de
  // debounce que ClienteStepContent en NuevoDomicilioModal.js.
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  useEffect(() => {
    setClienteEncontrado(false);
    if (!/^\d{10}$/.test(telefonoActual ?? "")) return;
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/clientes/${telefonoActual}`);
      if (!res.ok) return;
      const cliente = await res.json();
      setValue("nombre", cliente.nombre);
      if (cliente.ubicaciones?.[0]) {
        setValue("referencia", cliente.ubicaciones[0].alias_direccion);
      }
      setClienteEncontrado(true);
    }, 400);
    return () => clearTimeout(timeout);
  }, [telefonoActual, setValue]);

  // El OCR solo lee texto de la foto — no es confiable mapear eso a un producto
  // exacto del catálogo, así que acá siempre se elige a mano (igual que en "Nuevo
  // domicilio"), aunque el resto de los campos sí vengan pre-llenados por el OCR.
  const [lineas, setLineas] = useState([]);
  const [lineasError, setLineasError] = useState(null);
  // El precio que lee el OCR (de la línea TOTAL de la comanda) es solo un punto de
  // partida ANTES de elegir productos — precioTocado arranca en false siempre
  // (nunca en true por venir del OCR), porque si no, en cuanto el domiciliario
  // elige productos del catálogo el precio se queda pegado al de la comanda y
  // puede no coincidir con lo que realmente se está cobrando (bug real: el total
  // leído por OCR y la suma de productos elegidos son cosas distintas).
  const [precio, setPrecio] = useState(valoresIniciales.precio ? String(valoresIniciales.precio) : "");
  const [precioTocado, setPrecioTocado] = useState(false);
  const [precioError, setPrecioError] = useState(null);

  function handleLineasChange(nuevasLineas) {
    setLineas(nuevasLineas);
    setLineasError(null);
    if (!precioTocado) {
      const sugerido = sumaLineas(nuevasLineas);
      setPrecio(sugerido > 0 ? String(sugerido) : "");
    }
  }

  function onSubmit(values) {
    let valido = true;
    if (lineas.length === 0) {
      setLineasError("Elige al menos un producto");
      valido = false;
    }
    const precioNum = Number(precio);
    if (!Number.isFinite(precioNum) || precioNum <= 0) {
      setPrecioError("Debe ser mayor a 0");
      valido = false;
    }
    if (!valido) return;

    onConfirmar({
      ...values,
      productos_lineas: lineas.map((l) => ({ id_producto: l.id_producto, cantidad: l.cantidad })),
      precio: precioNum,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      <p className="text-xs text-amber-600 dark:text-amber-400">
        La lectura automática puede fallar, sobre todo con el teléfono — revisa cada campo antes
        de continuar.
      </p>

      {/* Teléfono leído por el OCR — con botón de llamada directa (tel:) al lado,
          para poder confirmar con el cliente si el número se ve dudoso. */}
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
        {clienteEncontrado && (
          <p className="mt-1 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <User size={12} />
            Cliente ya registrado — nombre y referencia autocompletados
          </p>
        )}
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

      {/* El OCR no elige productos del catálogo por sí solo — se escogen a mano
          acá, igual que en "Nuevo domicilio" (ver comentario más arriba). */}
      <SeleccionProductosPicker value={lineas} onChange={handleLineasChange} error={lineasError} />

      {/* Precio autocalculado al elegir productos, editable si se negoció otro. */}
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Banknote size={14} />
          Precio (valor del pedido)
        </label>
        <input
          type="number"
          min="1"
          step="any"
          value={precio}
          onChange={(e) => {
            setPrecio(e.target.value);
            setPrecioTocado(true);
            setPrecioError(null);
          }}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
        />
        {precioError && <p className="mt-1 text-xs text-red-500">{precioError}</p>}
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
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
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
      {/* Direcciones ya guardadas del cliente — si ninguna sirve, el botón de
          abajo ("Es una dirección nueva") crea una con la referencia leída de
          la comanda y la posición GPS actual del domiciliario. */}
      <div className="max-h-56 divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {cliente.ubicaciones.map((u) => (
          <button
            key={u.id_ubicacion}
            onClick={() => onSelect(u)}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-800 dark:active:bg-zinc-700"
          >
            <MapPin size={14} className="shrink-0 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {u.alias_direccion}
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
  const [espacio, setEspacio] = useState(null);
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!espacio) {
      setError("Obligatorio");
      return;
    }
    onSubmit({ espacio_baul: espacio });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
      <EspacioBaulSelector
        espaciosOcupados={espaciosOcupados}
        value={espacio}
        onChange={(e) => {
          setEspacio(e);
          setError(null);
        }}
        error={error}
      />

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
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
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

export async function openEscanearComandaModal(espaciosOcupados, ubicacionRecogida) {
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
        await MySwal.fire({ icon: "error", title: "No se pudo continuar", text: err.message });
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
        ubicacion_recogida: ubicacionRecogida,
        productos_lineas: datosOCR.productos_lineas,
        precio: Number(datosOCR.precio),
        espacio_baul: resultado.espacio_baul,
        foto_productos_url: datosOCR.foto,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      await MySwal.fire({ icon: "error", title: "No se pudo crear el domicilio", text: data.error });
      paso = "espacio";
      continue;
    }

    return data;
  }
}
