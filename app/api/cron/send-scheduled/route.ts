/**
 * Cron Job API - 發送預約訊息
 * GET /api/cron/send-scheduled - 檢查並發送到期的預約訊息
 *
 * 此 API 由 Vercel Cron Jobs 定期呼叫（每分鐘一次）
 * 也可以在本機開發時手動觸發
 */
import { NextResponse } from "next/server";
import { getORM } from "@/db";
import { sendScheduledMessages } from "@/services/scheduleService";

/**
 * GET /api/cron/send-scheduled
 * 發送所有到期的預約訊息
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: Request) {
  try {
    // 取得 ORM 實例
    const orm = await getORM();
    const em = orm.em.fork();

    // 發送所有到期的預約訊息
    const results = await sendScheduledMessages(em);

    return NextResponse.json({
      success: true,
      processed: results.length,
      results: results.map((result) => ({
        messageLogId: result.messageLogId,
        success: result.success,
        error: result.error,
      })),
    });
  } catch (error) {
    console.error("Cron Job 執行失敗:", error);
    return NextResponse.json(
      {
        success: false,
        error: "伺服器錯誤",
      },
      { status: 500 }
    );
  }
}
