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
import { analizarComanda, clave } from "../logic/comandaProductos";
import { getCurrentPositionAsync } from "../logic/geolocation";
import { comprimirImagen } from "../logic/imagenUtil";
import { leerTextoComanda } from "../../../lib/ocr";
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
// Lee la comanda y la cruza con el catálogo activo: las líneas que coinciden llegan
// ya como sugerencia de productos; las que no, se muestran aparte para elegirlas a
// mano. Nada se guarda aquí — el resultado solo prellena el paso de revisión.
async function leerComanda(dataUrl) {
  const texto = await leerTextoComanda(dataUrl);
  const [catalogo, municipios, aprendizaje] = await Promise.all([
    fetch("/api/productos?activos=1").then((res) => res.json()).catch(() => []),
    fetch("/api/municipios").then((res) => res.json()).catch(() => []),
    fetch("/api/ocr/aprendizaje").then((res) => res.json()).catch(() => []),
  ]);
  const analisis = analizarComanda(texto, catalogo, municipios, aprendizaje);
  return {
    telefono: analisis.telefono,
    telefonoValido: analisis.telefonoValido,
    nombre: "",
    referencia: analisis.referencia,
    totalCuadra: analisis.totalCuadra,
    adicion: analisis.adicion,
    lineasSugeridas: analisis.lineas
      .filter((l) => l.id_producto)
      .map((l) => ({
        id_producto: l.id_producto,
        cantidad: l.cantidad,
        nombre: l.nombre,
        precio_venta: l.precio_venta,
      })),
    municipios,
    lineasSinCoincidencia: analisis.lineasSinCoincidencia,
  };
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
        telefonoValido: false,
        nombre: "",
        referencia: "",
        precio: "",
        totalCuadra: null,
        lineasSugeridas: [],
        municipios: [],
        lineasSinCoincidencia: [],
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
      {/* Estándar de foto: el ticket térmico ocupa casi toda la imagen, en vertical.
          Con esto el OCR lee en una sola pasada (ver leerTextoComanda en lib/ocr.js). */}
      <div className="mb-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          <Camera size={14} />
          Así debe verse la foto
        </p>
        <div className="flex items-start gap-3">
          <div className="flex aspect-[1/2.2] w-14 shrink-0 items-center justify-center rounded border-2 border-dashed border-orange-400 text-center text-[10px] leading-tight text-orange-600 dark:text-orange-400">
            Ticket aquí
          </div>
          <ul className="flex list-disc flex-col gap-1 pl-4 text-xs text-zinc-500 dark:text-zinc-400">
            <li>El ticket completo, de arriba abajo y en vertical.</li>
            <li>Sobre una superficie plana, sin sombras ni reflejos.</li>
            <li>Sin dedos, billetes ni papeles encima del ticket.</li>
          </ul>
        </div>
      </div>
      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
        Siempre vas a poder revisar y corregir antes de guardar.
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
      telefono_alterno: valoresIniciales.telefono_alterno ?? "",
      nombre: valoresIniciales.nombre ?? "",
      referencia: valoresIniciales.referencia ?? "",
    },
  });
  const telefonoActual = watch("telefono");

  // Autocompletar por teléfono: si el número (leído por OCR o corregido a mano) ya es
  // de un cliente guardado, principal o alterno, se rellenan nombre, referencia y
  // teléfono alterno. Mismo patrón de debounce que ClienteStepContent.
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  useEffect(() => {
    setClienteEncontrado(false);
    if (!/^\d{10}$/.test(telefonoActual ?? "")) return;
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/clientes/${telefonoActual}`);
      if (!res.ok) return;
      const cliente = await res.json();
      setValue("nombre", cliente.nombre);
      setValue("telefono_alterno", cliente.telefono_alterno ?? "");
      if (cliente.ubicaciones?.[0]) {
        setValue("referencia", cliente.ubicaciones[0].alias_direccion);
      }
      setClienteEncontrado(true);
    }, 400);
    return () => clearTimeout(timeout);
  }, [telefonoActual, setValue]);

  // Solo se prellenan los productos que el OCR reconoce en el catálogo. Los demás no se
  // muestran; el domiciliario elige a mano en el selector.
  const [lineas, setLineas] = useState(valoresIniciales.lineasSugeridas ?? []);
  const [lineasError, setLineasError] = useState(null);
  // Productos de la comanda que no están en el catálogo: se muestran con su costo
  // (arranca con el importe del ticket) para que el total del pedido sea el real.
  const [sinCatalogo, setSinCatalogo] = useState(() =>
    (valoresIniciales.lineasSinCoincidencia ?? []).map((l) => ({
      descripcion: l.descripcion,
      precio: l.importe ?? "",
    }))
  );

  // Adición de domicilio: se elige de los municipios guardados. Su precio es el recargo
  // del municipio y se suma al precio del pedido.
  const municipios = valoresIniciales.municipios ?? [];
  const [idMunicipio, setIdMunicipio] = useState(valoresIniciales.adicion?.id_municipio ?? "");
  const municipioSeleccionado = municipios.find((m) => m.id_municipio === idMunicipio) ?? null;
  const recargo = municipioSeleccionado ? Number(municipioSeleccionado.recargo_domicilio) : 0;

  const PRECIO_MINIMO_SIN_CATALOGO = 1000;
  // El precio no se edita: lo suma el sistema desde los productos y sus costos.
  const sumaSinCatalogo = sinCatalogo.reduce((suma, item) => suma + (Number(item.precio) || 0), 0);
  const precioSinAdicion = sumaLineas(lineas) + sumaSinCatalogo;
  const [sinCatalogoError, setSinCatalogoError] = useState(null);

  function handleLineasChange(nuevasLineas) {
    setLineas(nuevasLineas);
    setLineasError(null);
  }

  function handleMunicipioChange(nuevoId) {
    setIdMunicipio(nuevoId);
  }

  function handleSinCatalogoChange(indice, valor) {
    setSinCatalogo(sinCatalogo.map((item, i) => (i === indice ? { ...item, precio: valor } : item)));
    setSinCatalogoError(null);
  }

  function onSubmit(values) {
    let valido = true;
    if (lineas.length === 0 && sinCatalogo.length === 0) {
      setLineasError("Elige al menos un producto");
      valido = false;
    }
    if (sinCatalogo.some((item) => !(Number(item.precio) >= PRECIO_MINIMO_SIN_CATALOGO))) {
      setSinCatalogoError(
        `El costo de cada producto sin catálogo debe ser de al menos $${PRECIO_MINIMO_SIN_CATALOGO.toLocaleString("es-CO")}`
      );
      valido = false;
    }
    if (!valido) return;

    onConfirmar({
      ...values,
      productos_lineas: lineas.map((l) => ({ id_producto: l.id_producto, cantidad: l.cantidad })),
      productos_sin_catalogo: sinCatalogo.map((item) => ({ descripcion: item.descripcion, precio: Number(item.precio) })),
      precio: precioSinAdicion + recargo,
      id_municipio: municipioSeleccionado?.id_municipio ?? null,
      recargo_domicilio: recargo,
      aprendizaje: {
        sinCoincidencia: valoresIniciales.lineasSinCoincidencia ?? [],
        productosElegidos: lineas.map((l) => ({ id_producto: l.id_producto, precio: l.precio_venta })),
        municipio: municipioSeleccionado ? { id_municipio: municipioSeleccionado.id_municipio, recargo: Number(municipioSeleccionado.recargo_domicilio) } : null,
      },
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      <p className="text-xs text-amber-600 dark:text-amber-400">
        La lectura automática puede fallar, sobre todo con el teléfono. Revisa cada campo antes
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
        {!/^3\d{9}$/.test(telefonoActual ?? "") && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            El teléfono leído parece incompleto (un celular tiene 10 dígitos y empieza en 3). Revísalo.
          </p>
        )}
        {clienteEncontrado && (
          <p className="mt-1 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <User size={12} />
            Cliente ya registrado: nombre, referencia y teléfono alterno autocompletados
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Phone size={14} />
          Segundo teléfono (opcional)
        </label>
        <input
          type="tel"
          placeholder="Quien recibe cuando el principal no está"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("telefono_alterno")}
        />
        <p className="mt-1 text-xs text-zinc-400">Comparte las mismas ubicaciones que el principal.</p>
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
        {errors.referencia && <p className="mt-1 text-xs text-red-500">{errors.referencia.message}</p>}
      </div>

      {sinCatalogo.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Productos de la comanda que no están en el catálogo. Ponles su costo para que el total sea real.
          </p>
          {sinCatalogo.map((item, indice) => (
            <div key={`${item.descripcion}-${indice}`} className="flex items-center gap-2">
              <span className="flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300">{item.descripcion}</span>
              <input
                type="number"
                min="1000"
                step="any"
                value={item.precio}
                onChange={(e) => handleSinCatalogoChange(indice, e.target.value)}
                aria-label={`Costo de ${item.descripcion}`}
                className="w-32 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
          ))}
          {sinCatalogoError && <p className="text-xs text-red-500">{sinCatalogoError}</p>}
        </div>
      )}
      {valoresIniciales.totalCuadra === false && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          El total de la comanda no coincide con la suma de los productos leídos. Revisa la lista de productos.
        </p>
      )}

      <SeleccionProductosPicker value={lineas} onChange={handleLineasChange} error={lineasError} />

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <MapPin size={14} />
          Adición de domicilio
        </label>
        <select
          value={idMunicipio}
          onChange={(e) => handleMunicipioChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="">Sin adición</option>
          {municipios.map((m) => (
            <option key={m.id_municipio} value={m.id_municipio}>
              {m.nombre} (+${Number(m.recargo_domicilio).toLocaleString("es-CO")})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Banknote size={14} />
          Precio sin adición
        </label>
        <p className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
          ${precioSinAdicion.toLocaleString("es-CO")}
        </p>
        {recargo > 0 && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Total con adición de domicilio: ${(precioSinAdicion + recargo).toLocaleString("es-CO")}
          </p>
        )}
      </div>

      <div className="mt-2 flex justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft size={14} />
          Atrás
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
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

  const telefonoAlterno = datos.telefono_alterno?.trim() || null;
  let cliente;
  const resCliente = await fetch(`/api/clientes/${datos.telefono}`);
  if (resCliente.ok) {
    cliente = await resCliente.json();
    if ((cliente.telefono_alterno ?? null) !== telefonoAlterno) {
      const resActualizar = await fetch(`/api/clientes/${cliente.telefono}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: cliente.nombre, telefono_alterno: telefonoAlterno }),
      });
      const dataActualizar = await resActualizar.json();
      if (!resActualizar.ok) throw new Error(dataActualizar.error ?? "No se pudo guardar el teléfono alterno");
      cliente = { ...cliente, ...dataActualizar };
    }
  } else {
    const resCrear = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefono: datos.telefono, nombre: datos.nombre, telefono_alterno: telefonoAlterno }),
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

  // Cliente sin ubicaciones guardadas: el pedido sale sin ubicación y la dirección se
  // define al entregar, en vez de crear una ubicación ahora que quedaría duplicada.
  if (!ubicacion && cliente.ubicaciones?.length > 0) {
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

// Aprende de lo que el domiciliario confirmó. Una línea que el OCR no reconoció se
// empareja con un producto elegido solo si tiene exactamente su mismo precio; un
// importe igual al recargo de un municipio aprende el municipio. Ante cualquier duda
// no se guarda nada.
function entradasDeAprendizaje(aprendizaje) {
  if (!aprendizaje) return [];
  const entradas = [];
  const usados = new Set();
  for (const linea of aprendizaje.sinCoincidencia ?? []) {
    const texto = clave(linea.descripcion);
    if (!texto) continue;
    const candidatos = (aprendizaje.productosElegidos ?? []).filter(
      (p) => p.precio != null && Number(p.precio) === Number(linea.importe) && !usados.has(p.id_producto)
    );
    if (candidatos.length === 1) {
      usados.add(candidatos[0].id_producto);
      entradas.push({ tipo: "producto", texto_clave: texto, id_referencia: candidatos[0].id_producto });
      continue;
    }
    const municipio = aprendizaje.municipio;
    if (municipio && municipio.recargo === Number(linea.importe)) {
      entradas.push({ tipo: "municipio", texto_clave: texto, id_referencia: municipio.id_municipio });
    }
  }
  return entradas;
}

function enviarAprendizaje(datos) {
  const entradas = entradasDeAprendizaje(datos.aprendizaje);
  if (entradas.length === 0) return;
  fetch("/api/ocr/aprendizaje", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entradas }),
  }).catch(() => {});
}

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
        id_ubicacion: clienteUbicacion.ubicacion?.id_ubicacion ?? null,
        ubicacion_recogida: ubicacionRecogida,
        productos_lineas: datosOCR.productos_lineas,
        productos_sin_catalogo: datosOCR.productos_sin_catalogo,
        precio: Number(datosOCR.precio),
        id_municipio: datosOCR.id_municipio,
        recargo_domicilio: datosOCR.recargo_domicilio,
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

    enviarAprendizaje(datosOCR);
    return data;
  }
}
