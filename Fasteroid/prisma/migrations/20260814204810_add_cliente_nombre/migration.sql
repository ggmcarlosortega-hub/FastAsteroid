/*
  Warnings:

  - Added the required column `nombre` to the `cliente` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cliente" (
    "telefono" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "fecha_primer_registro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_cliente" ("fecha_primer_registro", "telefono") SELECT "fecha_primer_registro", "telefono" FROM "cliente";
DROP TABLE "cliente";
ALTER TABLE "new_cliente" RENAME TO "cliente";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
