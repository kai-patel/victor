-- CreateTable
CREATE TABLE "SavedTable" (
    "userId" TEXT NOT NULL,
    "items" TEXT[],
    "odds" TEXT[],
    "stakes" DOUBLE PRECISION[]
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedTable_userId_key" ON "SavedTable"("userId");

-- AddForeignKey
ALTER TABLE "SavedTable" ADD CONSTRAINT "SavedTable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
