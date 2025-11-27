import { Migration } from '@mikro-orm/migrations';

export class Migration20251127104634 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "message_log" drop constraint if exists "message_log_status_check";`);

    this.addSql(`alter table "message_log" add constraint "message_log_status_check" check("status" in ('pending', 'success', 'failed'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "message_log" drop constraint if exists "message_log_status_check";`);

    this.addSql(`alter table "message_log" add constraint "message_log_status_check" check("status" in ('success', 'failed'));`);
  }

}
