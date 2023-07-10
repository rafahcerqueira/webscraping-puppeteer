-- CreateTable
CREATE TABLE "Merchant" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phones" TEXT[],
    "address" TEXT,
    "imagesUrl" TEXT[],
    "merchantUrl" TEXT,
    "scrappingUrl" TEXT NOT NULL,
    "metadata" JSONB,
    "openingHours" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);
