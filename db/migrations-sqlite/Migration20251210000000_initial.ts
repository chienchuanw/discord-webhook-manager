import { Migration } from "@mikro-orm/migrations";

/**
 * SQLite 初始 Migration
 * 建立所有必要的資料表
 */
export class Migration20251210000000_initial extends Migration {
  override async up(): Promise<void> {
    // 建立 webhook 資料表
    this.addSql(`
      create table if not exists "webhook" (
        "id" text primary key not null,
        "name" text not null,
        "url" text not null,
        "is_active" integer not null default 1,
        "success_count" integer not null default 0,
        "fail_count" integer not null default 0,
        "last_used" text null,
        "created_at" text not null,
        "updated_at" text not null
      );
    `);

    // 建立 message_log 資料表
    this.addSql(`
      create table if not exists "message_log" (
        "id" text primary key not null,
        "webhook_id" text not null,
        "content" text not null,
        "status" text not null,
        "status_code" integer null,
        "error_message" text null,
        "sent_at" text not null,
        "scheduled_at" text null,
        "scheduled_status" text null,
        "image_url" text null,
        constraint "message_log_webhook_id_foreign" foreign key ("webhook_id") references "webhook" ("id") on update cascade
      );
    `);

    // 建立 template 資料表
    this.addSql(`
      create table if not exists "template" (
        "id" text primary key not null,
        "name" text not null,
        "description" text null,
        "message_content" text null,
        "embed_data" text null,
        "image_url" text null,
        "schedule_type" text not null default 'daily',
        "interval_minutes" integer null,
        "schedule_time" text null,
        "schedule_days" text null,
        "created_at" text not null,
        "updated_at" text not null
      );
    `);

    // 建立 webhook_schedule 資料表
    this.addSql(`
      create table if not exists "webhook_schedule" (
        "id" text primary key not null,
        "webhook_id" text not null,
        "name" text not null,
        "message_content" text null,
        "embed_data" text null,
        "image_url" text null,
        "schedule_type" text not null default 'daily',
        "interval_minutes" integer null,
        "schedule_time" text null,
        "schedule_days" text null,
        "is_active" integer not null default 1,
        "last_triggered_at" text null,
        "next_trigger_at" text null,
        "created_at" text not null,
        "updated_at" text not null,
        constraint "webhook_schedule_webhook_id_foreign" foreign key ("webhook_id") references "webhook" ("id") on update cascade
      );
    `);

    // 建立索引以提升查詢效能
    this.addSql(`create index if not exists "message_log_webhook_id_index" on "message_log" ("webhook_id");`);
    this.addSql(`create index if not exists "message_log_scheduled_status_index" on "message_log" ("scheduled_status");`);
    this.addSql(`create index if not exists "webhook_schedule_webhook_id_index" on "webhook_schedule" ("webhook_id");`);
    this.addSql(`create index if not exists "webhook_schedule_next_trigger_at_index" on "webhook_schedule" ("next_trigger_at");`);
  }

  override async down(): Promise<void> {
    // 刪除資料表（反向順序，避免外鍵約束問題）
    this.addSql(`drop table if exists "webhook_schedule";`);
    this.addSql(`drop table if exists "message_log";`);
    this.addSql(`drop table if exists "template";`);
    this.addSql(`drop table if exists "webhook";`);
  }
}

