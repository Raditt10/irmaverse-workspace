/*
  Warnings:

  - Added the required column `userId` to the `MaterialInvite` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `material_invites` ADD COLUMN `userId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `MaterialInvite_userId_idx` ON `material_invites`(`userId`);

-- AddForeignKey
ALTER TABLE `material_invites` ADD CONSTRAINT `MaterialInvite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
