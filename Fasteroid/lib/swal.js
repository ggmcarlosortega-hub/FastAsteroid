"use client";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

// Punto único de configuración de SweetAlert2 para todo el proyecto — cualquier
// modal/alerta/confirm de la app debe importar el `MySwal` de acá en vez de crear
// el suyo propio con `withReactContent(Swal)`.
//
// `theme: "auto"` es la pieza clave: sin esto, el fondo del popup de SweetAlert2
// se queda BLANCO siempre, sin importar si el celular/PC está en modo oscuro. Eso
// hacía que las clases `dark:` de Tailwind puestas en el contenido (texto, bordes)
// quedaran "sueltas" — el texto sí cambiaba de color con `dark:text-...` pero el
// fondo detrás nunca se oscurecía, dando por ejemplo texto casi blanco sobre un
// fondo blanco. Con `theme: "auto"`, SweetAlert2 detecta el modo oscuro del
// sistema (prefers-color-scheme) igual que Tailwind, y sí oscurece el fondo del
// popup — ahí las clases `dark:` del contenido vuelven a tener sentido.
const MySwal = withReactContent(Swal.mixin({ theme: "auto" }));

export default MySwal;
