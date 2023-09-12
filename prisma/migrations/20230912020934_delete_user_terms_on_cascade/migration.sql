-- DropForeignKey
ALTER TABLE `UserTerm` DROP FOREIGN KEY `UserTerm_term_id_fkey`;

-- DropForeignKey
ALTER TABLE `UserTerm` DROP FOREIGN KEY `UserTerm_user_id_fkey`;

-- AddForeignKey
ALTER TABLE `UserTerm` ADD CONSTRAINT `UserTerm_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserTerm` ADD CONSTRAINT `UserTerm_term_id_fkey` FOREIGN KEY (`term_id`) REFERENCES `Term`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
