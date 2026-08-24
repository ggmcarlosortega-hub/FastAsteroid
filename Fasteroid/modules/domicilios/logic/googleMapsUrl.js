// Enlace directo a Google Maps a partir de una coordenada guardada — sin API de
// Google, solo la URL pública de búsqueda (sección 10 del documento unificado).
export function googleMapsUrl(latitud, longitud) {
  return `https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`;
}
