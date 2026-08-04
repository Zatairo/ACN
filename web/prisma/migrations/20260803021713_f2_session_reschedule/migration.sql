-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "enrollmentId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "fechaHora" DATETIME NOT NULL,
    "duracionMin" INTEGER NOT NULL DEFAULT 45,
    "estado" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "enlaceVideo" TEXT,
    "tema" TEXT,
    "notasClase" TEXT,
    "asistio" BOOLEAN,
    "creadaPor" TEXT NOT NULL DEFAULT 'PROFESORA',
    "reprogramacionSolicitada" BOOLEAN NOT NULL DEFAULT false,
    "reprogramacionFechaHora" DATETIME,
    "reprogramacionNota" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Session" ("asistio", "creadaPor", "createdAt", "duracionMin", "enlaceVideo", "enrollmentId", "estado", "fechaHora", "id", "notasClase", "teacherId", "tema", "updatedAt") SELECT "asistio", "creadaPor", "createdAt", "duracionMin", "enlaceVideo", "enrollmentId", "estado", "fechaHora", "id", "notasClase", "teacherId", "tema", "updatedAt" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE INDEX "Session_fechaHora_idx" ON "Session"("fechaHora");
CREATE INDEX "Session_enrollmentId_idx" ON "Session"("enrollmentId");
CREATE INDEX "Session_estado_idx" ON "Session"("estado");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
