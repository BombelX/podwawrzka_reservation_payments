ALTER TABLE `reservations` ADD `user_id` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `reservations` ADD `how_many_people` integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE `reservations` ADD `nights` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `reservations` ADD `price` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `surname` text NOT NULL;