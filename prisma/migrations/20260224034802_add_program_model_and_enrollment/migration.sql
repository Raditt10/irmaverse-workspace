-- AlterTable
ALTER TABLE `materials` ADD COLUMN `programId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `programs` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `grade` ENUM('X', 'XI', 'XII') NOT NULL,
    `category` ENUM('Wajib', 'Extra', 'NextLevel', 'Susulan') NOT NULL,
    `thumbnailUrl` VARCHAR(191) NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `duration` VARCHAR(191) NULL,
    `syllabus` JSON NULL,
    `requirements` JSON NULL,
    `benefits` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `programs_instructorId_idx`(`instructorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `program_enrollments` (
    `id` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `program_enrollments_programId_idx`(`programId`),
    INDEX `program_enrollments_userId_idx`(`userId`),
    UNIQUE INDEX `program_enrollments_programId_userId_key`(`programId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Material_programId_fkey` ON `materials`(`programId`);

-- AddForeignKey
ALTER TABLE `programs` ADD CONSTRAINT `programs_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program_enrollments` ADD CONSTRAINT `program_enrollments_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program_enrollments` ADD CONSTRAINT `program_enrollments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `Material_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
