-- CreateTable
CREATE TABLE "CodeRequestType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "code_request_type_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "validatedIn" DATETIME,
    "expiresIn" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserCode_code_request_type_id_fkey" FOREIGN KEY ("code_request_type_id") REFERENCES "CodeRequestType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserCode_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CodeRequestType_slug_key" ON "CodeRequestType"("slug");
