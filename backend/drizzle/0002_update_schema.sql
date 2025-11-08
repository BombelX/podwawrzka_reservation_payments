CREATE TABLE `mock_p24_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` text NOT NULL,
	`status` integer NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` text NOT NULL,
	`status` text NOT NULL,
	`reservations_id` integer NOT NULL,
	`user_id` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_payments`("id", "token", "status", "reservations_id", "user_id") SELECT "id", "token", "status", "reservations_id", "user_id" FROM `payments`;--> statement-breakpoint
DROP TABLE `payments`;--> statement-breakpoint
ALTER TABLE `__new_payments` RENAME TO `payments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;