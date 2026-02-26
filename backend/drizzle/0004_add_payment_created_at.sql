ALTER TABLE `payments` ADD `created_at` text;--> statement-breakpoint

UPDATE `payments` SET `created_at` = datetime('now') WHERE `created_at` IS NULL;--> statement-breakpoint
