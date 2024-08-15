/*
  Warnings:

  - A unique constraint covering the columns `[notificationId]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Notification_notificationId_key` ON `Notification`(`notificationId`);
