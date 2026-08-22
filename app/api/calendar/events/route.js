import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

const HOLIDAYS = [
  { month: 0, day: 1, label: "New Year's Day" },
  { month: 0, day: 26, label: "Republic Day" },
  { month: 7, day: 15, label: "Independence Day" },
  { month: 9, day: 2, label: "Gandhi Jayanti" },
  { month: 11, day: 25, label: "Christmas Day" },
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const from = start ? new Date(start) : new Date();
  const to = end ? new Date(end) : new Date(Date.now() + 31 * 86400000);

  const appointments = await db.findMany("appointments");

  const meetings = appointments
    .filter((a) => a.status !== "cancelled")
    .filter((a) => {
      const d = new Date(a.start);
      return d >= from && d <= to;
    })
    .map((a) => ({
      id: a.id,
      type: "meeting",
      meetingType: a.type,
      title: a.title,
      clientName: a.client_name || a.clientName,
      clientId: a.client_id || a.clientId,
      start: a.start,
      duration: a.duration,
      status: a.status,
    }));

  const blocked = [];
  for (let i = 0; i < 21; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    if (d.getDay() === 3) {
      d.setHours(12, 0, 0, 0);
      blocked.push({
        id: `blk_${i}`,
        type: "blocked",
        title: "Focus / Admin Block",
        start: d.toISOString(),
        duration: 120,
      });
    }
  }

  const holidays = [];
  for (let i = 0; i <= 31; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    const match = HOLIDAYS.find((hol) => d.getMonth() === hol.month && d.getDate() === hol.day);
    if (match) {
      holidays.push({
        id: `hol_${i}`,
        type: "holiday",
        title: match.label,
        start: d.toISOString(),
        allDay: true,
      });
    }
  }

  return ok([...meetings, ...blocked, ...holidays]);
}
