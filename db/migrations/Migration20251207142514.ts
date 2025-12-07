import { Migration } from '@mikro-orm/migrations';

export class Migration20251207142514 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "message_log" add column "image_url" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "message_log" drop column "image_url";`);
  }

}
