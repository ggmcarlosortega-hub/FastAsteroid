/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // Por defecto, el dev server de Next.js solo confía en peticiones que lleguen
  // como localhost (protección CSRF contra el propio dev server). Al entrar desde
  // el celular por la IP de la LAN o por un túnel (localtunnel/ngrok), el origen no
  // es localhost y Next.js responde 403 a varias peticiones internas — eso rompe la
  // hidratación de React y hace que, por ejemplo, el formulario de login caiga al
  // envío nativo del navegador (GET con la contraseña en la URL) en vez de llamar a
  // la API. Hay que declarar explícitamente qué orígenes están permitidos.
  allowedDevOrigins: [
    "localhost",
    "192.168.1.58",
    "*.loca.lt",
  ],
  // Next.js pasó a ser solo frontend: todo /api/** se reenvía al servidor Express
  // (server/), que es ahora el único dueño de la base de datos y de la sesión. El
  // navegador ve todo como un solo origen (localhost:3000), así que las cookies de
  // sesión funcionan sin configurar CORS.
  //
  // Tiene que ir en `beforeFiles`: la forma simple (array plano) de rewrites() solo
  // gana contra rutas dinámicas (`[id]`), pero pierde contra un archivo de ruta
  // exacto que ya exista (ej. app/api/domicilios/route.js) — mientras esos archivos
  // viejos no se borren, sin `beforeFiles` la mitad de las llamadas seguían
  // resolviendo silenciosamente contra el Next.js/Prisma/SQLite viejo en vez de
  // Express. `beforeFiles` fuerza a que el rewrite gane siempre, sin ambigüedad.
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${process.env.API_URL ?? "http://localhost:4000"}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
