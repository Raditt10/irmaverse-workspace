-- DropForeignKey
ALTER TABLE `notifications` DROP FOREIGN KEY `Notification_senderId_fkey`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `class` ENUM('X', 'XI', 'XII') NOT NULL DEFAULT 'X';

-- CreateTable
CREATE TABLE `leaderboard` (
    `id` VARCHAR(191) NOT NULL,
    `uid` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL DEFAULT 0,
    `rank` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `leaderboard_uid_idx`(`uid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `friendships` (
    `id` VARCHAR(191) NOT NULL,
    `requesterId` VARCHAR(191) NOT NULL,
    `addresseeId` VARCHAR(191) NOT NULL,
    `status` ENUM('Pending', 'Friend', 'Rejected', 'Blocked') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `friendships_requesterId_idx`(`requesterId`),
    INDEX `friendships_addresseeId_idx`(`addresseeId`),
    INDEX `friendships_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `leaderboard` ADD CONSTRAINT `leaderboard_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friendships` ADD CONSTRAINT `fk_friendship_requester` FOREIGN KEY (`requesterId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friendships` ADD CONSTRAINT `fk_friendship_addressee` FOREIGN KEY (`addresseeId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
