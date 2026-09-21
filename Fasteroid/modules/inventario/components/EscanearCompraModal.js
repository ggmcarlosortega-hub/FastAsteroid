"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Camera,
  ImageUp,
  Truck,
  Hash,
  CalendarClock,
  Save,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Package,
  Boxes,
  DollarSign,
} from "lucide-react";
import { parseCompraText } from "../logic/compraParser";
import { leerTextoParaCompra } from "../../../lib/ocr";
import { comprimirImagen } from "../../domicilios/logic/imagenUtil";
import MySwal from "../../../lib/swal";

const VOLVER = Symbol("volver");

// Mismo patrón que EscanearComandaModal.js: pasos encadenados con SweetAlert2,
// cada uno su propio Swal.fire — pero mucho más corto, no hay que resolver
// cliente/ubicación ni espacio de baúl acá, solo proveedor + líneas de compra.

// --- Paso 1: capturar la foto de la factura y leerla ---

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
      // maxDim más alto que en comandas (1600): una factura de compra suele
      // traer una tabla con letra mucho más chica que el recibo de una
      // impresora térmica — de-comprimir de más ahí le cuesta caracteres al
      // OCR que sí hacen falta (verificado contra una factura real).
      const dataUrl = await comprimirImagen(reader.result, { maxDim: 2400 });
      // Si el OCR falla por completo, se sigue sin líneas candidatas — el Admin
      // arma todo a mano desde "+ Agregar línea" en el paso de revisión, con la
      // foto a la vista para transcribir (ver RevisionCompraStepContent).
      const { lineasCandidatas } = await leerTextoParaCompra(dataUrl)
        .then(parseCompraText)
        .catch(() => ({ lineasCandidatas: [] }));
      onListo({ lineasCandidatas, foto: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  if (leyendo) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 size={28} className="animate-spin text-orange-500" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Leyendo la factura...</p>
      </div>
    );
  }

  return (
    <div className="text-left">
      <p className="mb-3 flex items-start gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <Camera size={16} className="mt-0.5 shrink-0" />
        Toma la foto lo más cerca, derecha y con buena luz posible, o busca una ya tomada. El
        sistema va a proponer líneas de producto a partir del texto — siempre vas a poder
        revisarlas, corregirlas o borrarlas antes de guardar.
      </p>

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
      title: "Escanear factura",
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

// --- Paso 2: revisar/completar proveedor y líneas ---

let contadorLinea = 0;
function lineaDesdeCandidata(candidata) {
  return {
    id: `linea-${contadorLinea++}`,
    texto_detectado: candidata?.texto ?? "",
    id_producto: "",
    cantidad_comprada: "1",
    costo_unitario: candidata?.montoDetectado ? String(candidata.montoDetectado) : "",
  };
}

function RevisionCompraStepContent({ productos, proveedores, lineasCandidatas, foto, onBack, onConfirmar }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { id_proveedor: "", numero_lote: "", fecha_caducidad: "" },
  });

  // Cada línea candidata detectada por el OCR arranca como una fila editable, sin
  // producto asignado (el OCR nunca elige el producto por sí solo — ver
  // compraParser.js). Si no detectó ninguna, arranca con una fila vacía para que
  // siempre haya algo que completar.
  const [lineas, setLineas] = useState(() =>
    lineasCandidatas.length > 0 ? lineasCandidatas.map(lineaDesdeCandidata) : [lineaDesdeCandidata()]
  );
  const [lineasError, setLineasError] = useState(null);

  function actualizarLinea(id, cambios) {
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, ...cambios } : l)));
    setLineasError(null);
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, lineaDesdeCandidata()]);
  }

  function quitarLinea(id) {
    setLineas((prev) => prev.filter((l) => l.id !== id));
  }

  const total = lineas.reduce(
    (suma, l) => suma + (Number(l.cantidad_comprada) || 0) * (Number(l.costo_unitario) || 0),
    0
  );

  function onSubmit(values) {
    if (lineas.length === 0) {
      setLineasError("Agrega al menos una línea");
      return;
    }
    for (const [i, l] of lineas.entries()) {
      if (!l.id_producto) {
        setLineasError(`Línea ${i + 1}: elige el producto`);
        return;
      }
      if (!Number.isFinite(Number(l.cantidad_comprada)) || Number(l.cantidad_comprada) <= 0) {
        setLineasError(`Línea ${i + 1}: la cantidad debe ser mayor a 0`);
        return;
      }
      if (!Number.isFinite(Number(l.costo_unitario)) || Number(l.costo_unitario) <= 0) {
        setLineasError(`Línea ${i + 1}: el costo debe ser mayor a 0`);
        return;
      }
    }

    onConfirmar({
      id_proveedor: values.id_proveedor,
      numero_lote: values.numero_lote,
      fecha_caducidad: values.fecha_caducidad || null,
      lineas: lineas.map((l) => ({
        id_producto: l.id_producto,
        cantidad_comprada: Number(l.cantidad_comprada),
        costo_unitario: Number(l.costo_unitario),
      })),
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      <p className="text-xs text-amber-600 dark:text-amber-400">
        La lectura automática puede fallar o mezclar líneas que no son productos — revisa cada
        una antes de guardar. La foto queda aquí abajo para transcribir a mano lo que el sistema
        no haya leído bien.
      </p>

      {foto && (
        <img
          src={foto}
          alt="Foto de la factura"
          className="max-h-56 w-full rounded-lg border border-zinc-200 object-contain dark:border-zinc-700"
        />
      )}

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Truck size={14} />
          Proveedor
        </label>
        <select
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("id_proveedor", { required: "Obligatorio" })}
        >
          <option value="">Selecciona un proveedor</option>
          {proveedores.map((p) => (
            <option key={p.id_proveedor} value={p.id_proveedor}>
              {p.nombre}
            </option>
          ))}
        </select>
        {errors.id_proveedor && (
          <p className="mt-1 text-xs text-red-500">{errors.id_proveedor.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <Hash size={14} />
            N.º de lote (opcional)
          </label>
          <input
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
            {...register("numero_lote")}
          />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <CalendarClock size={14} />
            Vence (opcional)
          </label>
          <input
            type="date"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
            {...register("fecha_caducidad")}
          />
        </div>
      </div>

      {/* Líneas de producto — cada una arranca desde lo que el OCR creyó ver
          (texto_detectado, solo de referencia) pero SIEMPRE hay que elegir el
          producto real del catálogo a mano; nunca se auto-asigna. */}
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Package size={14} />
          Productos de la factura
        </label>
        <div className="flex flex-col gap-2">
          {lineas.map((l) => (
            <div key={l.id} className="rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-700">
              {l.texto_detectado && (
                <p className="mb-1.5 truncate text-xs text-zinc-400" title={l.texto_detectado}>
                  Detectado: &quot;{l.texto_detectado}&quot;
                </p>
              )}
              <div className="flex items-center gap-2">
                <select
                  value={l.id_producto}
                  onChange={(e) => actualizarLinea(l.id, { id_producto: e.target.value })}
                  className="min-w-0 flex-[2] rounded-lg border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <option value="">Producto...</option>
                  {productos.map((p) => (
                    <option key={p.id_producto} value={p.id_producto}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Boxes size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Cant."
                    value={l.cantidad_comprada}
                    onChange={(e) => actualizarLinea(l.id, { cantidad_comprada: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 py-1.5 pl-6 pr-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
                <div className="relative flex-1">
                  <DollarSign size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="Costo c/u"
                    value={l.costo_unitario}
                    onChange={(e) => actualizarLinea(l.id, { costo_unitario: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 py-1.5 pl-6 pr-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => quitarLinea(l.id)}
                  className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  title="Quitar línea"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={agregarLinea}
          className="mt-2 flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
        >
          <Plus size={15} />
          Agregar línea
        </button>
        {lineasError && <p className="mt-1 text-xs text-red-500">{lineasError}</p>}
      </div>

      <p className="text-right text-sm text-zinc-500 dark:text-zinc-400">
        Total de la factura: <span className="font-semibold text-zinc-900 dark:text-zinc-50">${total.toLocaleString("es-CO")}</span>
      </p>

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
          Registrar compras
        </button>
      </div>
    </form>
  );
}

function openRevisionCompraStep(productos, proveedores, lineasCandidatas, foto) {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Revisar factura",
      html: (
        <RevisionCompraStepContent
          productos={productos}
          proveedores={proveedores}
          lineasCandidatas={lineasCandidatas}
          foto={foto}
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
      width: 520,
      didClose: () => {
        if (!resolved) resolve(null);
      },
    });
  });
}

// --- Orquestador ---

export async function openEscanearCompraModal(productos, proveedores) {
  let lineasCandidatas = [];
  let foto = null;
  let paso = "captura";

  while (true) {
    if (paso === "captura") {
      const resultado = await openCapturaStep();
      if (!resultado) return null;
      lineasCandidatas = resultado.lineasCandidatas;
      foto = resultado.foto;
      paso = "revision";
      continue;
    }

    // paso === "revision"
    const resultado = await openRevisionCompraStep(productos, proveedores, lineasCandidatas, foto);
    if (resultado === VOLVER) {
      paso = "captura";
      continue;
    }
    if (!resultado) return null;

    const res = await fetch("/api/lotes/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resultado),
    });
    const data = await res.json();

    if (!res.ok) {
      await MySwal.fire({ icon: "error", title: "No se pudieron registrar las compras", text: data.error });
      continue;
    }

    return data;
  }
}
