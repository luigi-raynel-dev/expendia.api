-- DropForeignKey
ALTER TABLE `Expense` DROP FOREIGN KEY `Expense_group_id_fkey`;

-- DropForeignKey
ALTER TABLE `Member` DROP FOREIGN KEY `Member_group_id_fkey`;

-- DropForeignKey
ALTER TABLE `Paying` DROP FOREIGN KEY `Paying_expense_id_fkey`;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Paying` ADD CONSTRAINT `Paying_expense_id_fkey` FOREIGN KEY (`expense_id`) REFERENCES `Expense`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
