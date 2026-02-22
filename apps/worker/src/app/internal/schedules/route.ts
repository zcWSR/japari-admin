/**
 * GET /internal/schedules - Node 拉取全量定时列表。
 */
import ScheduleService from '@/services/schedule-service.js';

export async function GET() {
  const list = await ScheduleService.getAllSchedules();
  return Response.json(
    list.map((r: { group_id: string; rule: string; text: string }) => ({
      group_id: r.group_id,
      rule: r.rule,
      text: r.text
    }))
  );
}
