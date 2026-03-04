-- AlterTable
ALTER TABLE `material_quizzes` ADD COLUMN `creatorId` VARCHAR(191) NULL,
    MODIFY `materialId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `material_quizzes_creatorId_idx` ON `material_quizzes`(`creatorId`);

-- AddForeignKey
ALTER TABLE `material_quizzes` ADD CONSTRAINT `material_quizzes_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
