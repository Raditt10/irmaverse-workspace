/*
  Warnings:

  - You are about to drop the column `academicYear` on the `materials` table. All the data in the column will be lost.
  - Added the required column `category` to the `materials` table without a default value. This is not possible if the table is not empty.

*/

-- AlterTable
ALTER TABLE `materials` ADD COLUMN `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    DROP COLUMN `academicYear`,
    ADD COLUMN `category` ENUM('Wajib', 'Extra', 'NextLevel', 'Susulan') NOT NULL,
    ADD COLUMN `participants` VARCHAR(191) NULL,
    ADD COLUMN `startedAt` VARCHAR(191) NULL;