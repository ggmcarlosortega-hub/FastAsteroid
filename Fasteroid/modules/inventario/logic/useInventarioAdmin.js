"use client";

import { useEffect, useState, useCallback } from "react";
import Swal from "../../../lib/swal";
import { useRealtime } from "../../../lib/useRealtime";
import { openProductoFormModal } from "../components/ProductoFormModal";
import { openProductosBulkFormModal } from "../components/ProductosBulkFormModal";
import { openProveedorFormModal } from "../components/ProveedorFormModal";
import { openCategoriaFormModal } from "../components/CategoriaFormModal";
import { openLoteFormModal } from "../components/LoteFormModal";

async function toastGuardado(titulo) {
  await Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: titulo,
    timer: 1200,
    showConfirmButton: false,
  });
}

export function useInventarioAdmin() {
  const [tab, setTab] = useState("productos");
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [productosRes, proveedoresRes, categoriasRes, lotesRes, inventarioRes] = await Promise.all([
      fetch("/api/productos"),
      fetch("/api/proveedores"),
      fetch("/api/categorias"),
      fetch("/api/lotes"),
      fetch("/api/inventario"),
    ]);
    setProductos(await productosRes.json());
    setProveedores(await proveedoresRes.json());
    setCategorias(await categoriasRes.json());
    setLotes(await lotesRes.json());
    setInventario(await inventarioRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Un solo cargar() ya reobtiene los 5 recursos de esta pantalla en
  // paralelo, así que una sola suscripción cubre todo Inventario.
  useRealtime(
    ["productos:changed", "categorias:changed", "proveedores:changed", "lotes:changed", "domicilios:changed"],
    cargar
  );

  async function handleNuevoProducto() {
    const creado = await openProductoFormModal(null, categorias);
    if (!creado) return;
    await toastGuardado("Producto creado");
    cargar();
  }

  async function handleEditarProducto(producto) {
    const actualizado = await openProductoFormModal(producto, categorias);
    if (!actualizado) return;
    await toastGuardado("Producto actualizado");
    cargar();
  }

  async function handleNuevosProductosMasivo() {
    const creados = await openProductosBulkFormModal(categorias);
    if (!creados) return;
    await toastGuardado(`${creados.length} producto(s) creados`);
    cargar();
  }

  async function handleNuevoProveedor() {
    const creado = await openProveedorFormModal();
    if (!creado) return;
    await toastGuardado("Proveedor creado");
    cargar();
  }

  async function handleEditarProveedor(proveedor) {
    const actualizado = await openProveedorFormModal(proveedor);
    if (!actualizado) return;
    await toastGuardado("Proveedor actualizado");
    cargar();
  }

  async function handleEliminarProveedor(proveedor) {
    const result = await Swal.fire({
      icon: "warning",
      title: `¿Eliminar a ${proveedor.nombre}?`,
      text: "Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;

    const res = await fetch(`/api/proveedores/${proveedor.id_proveedor}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      await Swal.fire({ icon: "error", title: "No se pudo eliminar", text: data.error });
      return;
    }
    await toastGuardado("Proveedor eliminado");
    cargar();
  }

  async function handleNuevaCategoria() {
    const creada = await openCategoriaFormModal();
    if (!creada) return;
    await toastGuardado("Categoría creada");
    cargar();
  }

  async function handleEditarCategoria(categoria) {
    const actualizada = await openCategoriaFormModal(categoria);
    if (!actualizada) return;
    await toastGuardado("Categoría actualizada");
    cargar();
  }

  async function handleEliminarCategoria(categoria) {
    const result = await Swal.fire({
      icon: "warning",
      title: `¿Eliminar "${categoria.nombre}"?`,
      text: "Los productos de esta categoría quedarán sin categoría — no se borran.",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;

    const res = await fetch(`/api/categorias/${categoria.id_categoria}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      await Swal.fire({ icon: "error", title: "No se pudo eliminar", text: data.error });
      return;
    }
    await toastGuardado("Categoría eliminada");
    cargar();
  }

  async function handleNuevoLote() {
    if (productos.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Primero crea un producto",
        text: "Necesitas al menos un producto en el catálogo para registrar una compra.",
      });
      return;
    }
    if (proveedores.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Primero crea un proveedor",
        text: "Necesitas al menos un proveedor registrado para registrar una compra.",
      });
      return;
    }
    const creado = await openLoteFormModal(productos, proveedores);
    if (!creado) return;
    await toastGuardado("Compra registrada");
    cargar();
  }

  return {
    tab,
    setTab,
    productos,
    proveedores,
    categorias,
    lotes,
    inventario,
    loading,
    handleNuevoProducto,
    handleEditarProducto,
    handleNuevosProductosMasivo,
    handleNuevoProveedor,
    handleEditarProveedor,
    handleEliminarProveedor,
    handleNuevaCategoria,
    handleEditarCategoria,
    handleEliminarCategoria,
    handleNuevoLote,
  };
}
