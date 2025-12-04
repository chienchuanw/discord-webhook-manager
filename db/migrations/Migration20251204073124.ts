import { Migration } from "@mikro-orm/migrations";

export class Migration20251204073124 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "template" ("id" uuid not null, "name" varchar(255) not null, "description" text null, "message_content" text null, "embed_data" jsonb null, "image_url" varchar(500) null, "schedule_type" text check ("schedule_type" in ('interval', 'daily', 'weekly')) not null default 'daily', "interval_minutes" int null, "schedule_time" varchar(5) null, "schedule_days" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "template_pkey" primary key ("id"));`
    );

    this.addSql(
      `create table "webhook_schedule" ("id" uuid not null, "webhook_id" uuid not null, "name" varchar(255) not null, "message_content" text null, "embed_data" jsonb null, "image_url" varchar(500) null, "schedule_type" text check ("schedule_type" in ('interval', 'daily', 'weekly')) not null default 'daily', "interval_minutes" int null, "schedule_time" varchar(5) null, "schedule_days" jsonb null, "is_active" boolean not null default true, "last_triggered_at" timestamptz null, "next_trigger_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "webhook_schedule_pkey" primary key ("id"));`
    );

    this.addSql(
      `alter table "webhook_schedule" add constraint "webhook_schedule_webhook_id_foreign" foreign key ("webhook_id") references "webhook" ("id") on update cascade;`
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "template" cascade;`);

    this.addSql(`drop table if exists "webhook_schedule" cascade;`);
  }
}
