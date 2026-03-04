-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('basic', 'invitation') NOT NULL DEFAULT 'basic',
    `status` ENUM('unread', 'read', 'accepted', 'rejected', 'expired') NOT NULL DEFAULT 'unread',
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `icon` VARCHAR(191) NULL,
    `resourceType` VARCHAR(191) NULL,
    `resourceId` VARCHAR(191) NULL,
    `actionUrl` VARCHAR(191) NULL,
    `inviteToken` VARCHAR(191) NULL,
    `senderId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `notifications_inviteToken_key`(`inviteToken`),
    INDEX `notifications_userId_status_idx`(`userId`, `status`),
    INDEX `notifications_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `notifications_inviteToken_idx`(`inviteToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `Notification_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
