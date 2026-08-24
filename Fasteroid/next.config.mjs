/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
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
