/*
  Warnings:

  - You are about to drop the `Terms` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `Terms`;

-- CreateTable
CREATE TABLE `Term` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Term_title_key`(`title`),
    UNIQUE INDEX `Term_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserTerm` (
    `user_id` VARCHAR(191) NOT NULL,
    `term_id` VARCHAR(191) NOT NULL,
    `accepted` BOOLEAN NULL,
    `acceptedAt` DATETIME(3) NULL,

    PRIMARY KEY (`user_id`, `term_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserTerm` ADD CONSTRAINT `UserTerm_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserTerm` ADD CONSTRAINT `UserTerm_term_id_fkey` FOREIGN KEY (`term_id`) REFERENCES `Term`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
