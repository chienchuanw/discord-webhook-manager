import { Migration } from '@mikro-orm/migrations';

export class Migration20251127043127 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "webhook" ("id" uuid not null, "name" varchar(255) not null, "url" varchar(500) not null, "is_active" boolean not null default true, "success_count" int not null default 0, "fail_count" int not null default 0, "last_used" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "webhook_pkey" primary key ("id"));`);
  }

}
