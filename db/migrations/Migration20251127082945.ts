import { Migration } from '@mikro-orm/migrations';

export class Migration20251127082945 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "message_log" ("id" uuid not null, "webhook_id" uuid not null, "content" text not null, "status" text check ("status" in ('success', 'failed')) not null, "status_code" int null, "error_message" text null, "sent_at" timestamptz not null, constraint "message_log_pkey" primary key ("id"));`);

    this.addSql(`alter table "message_log" add constraint "message_log_webhook_id_foreign" foreign key ("webhook_id") references "webhook" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "message_log" cascade;`);
  }

}
