/**
 * Cron Process Schedules API
 * 處理到期的 WebhookSchedule 並發送訊息
 *
 * 此端點設計為由 Vercel Cron Jobs 或其他排程服務呼叫
 * 建議每分鐘執行一次
 *
 * @route GET /api/cron/process-schedules
 */
import { NextResponse } from "next/server";
import { getORM } from "../../../../db";
import { processSchedules } from "../../../../services/scheduleTriggerService";

/**
 * GET /api/cron/process-schedules
 * 處理所有到期的排程
 *
 * @returns 處理結果摘要
 */
export async function GET() {
  try {
    const orm = await getORM();
    const em = orm.em.fork();

    // 處理所有到期的排程
    const results = await processSchedules(em);

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("處理排程時發生錯誤:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知錯誤",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
