CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` integer NOT NULL,
	`status` text NOT NULL,
	`reservations_id` integer NOT NULL,
	`user_id` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	`arrivalTime` text
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `special_prices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`price` integer NOT NULL
);
