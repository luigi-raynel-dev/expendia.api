-- DropForeignKey
ALTER TABLE `NotificationToken` DROP FOREIGN KEY `NotificationToken_user_id_fkey`;

-- AddForeignKey
ALTER TABLE `NotificationToken` ADD CONSTRAINT `NotificationToken_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
