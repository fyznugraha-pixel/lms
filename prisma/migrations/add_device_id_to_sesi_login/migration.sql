-- AlterTable
ALTER TABLE "SesiLogin" ADD COLUMN "deviceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SesiLogin_userId_deviceId_key" ON "SesiLogin"("userId", "deviceId");