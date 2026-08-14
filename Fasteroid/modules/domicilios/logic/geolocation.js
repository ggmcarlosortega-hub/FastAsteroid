// Captura puntual de la ubicación GPS actual (no tracking continuo), usada al
// presionar "Entregado". Se degrada a null si no hay soporte o el usuario niega
// el permiso, en vez de bloquear la entrega (mismo criterio que el tracking).
export function getCurrentPositionAsync() {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitud: pos.coords.latitude, longitud: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });
}
