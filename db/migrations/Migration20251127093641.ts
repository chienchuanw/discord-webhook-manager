import { Migration } from '@mikro-orm/migrations';

export class Migration20251127093641 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "message_log" add column "scheduled_at" timestamptz null, add column "scheduled_status" text check ("scheduled_status" in ('pending', 'sent', 'cancelled')) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "message_log" drop column "scheduled_at", drop column "scheduled_status";`);
  }

}
