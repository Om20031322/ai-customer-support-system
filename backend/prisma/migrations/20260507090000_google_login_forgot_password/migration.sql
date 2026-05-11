CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');

ALTER TABLE "User"
ADD COLUMN "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN "googleId" TEXT,
ADD COLUMN "resetPasswordToken" TEXT,
ADD COLUMN "resetPasswordExpires" TIMESTAMP(3),
ALTER COLUMN "passwordHash" DROP NOT NULL;

CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
CREATE UNIQUE INDEX "User_resetPasswordToken_key" ON "User"("resetPasswordToken");
