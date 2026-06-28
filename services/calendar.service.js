import { dataset } from "@/lib/mock/dataset";
import { clone, delay } from "./mockUtil";

// A few fixed demo holidays + blocked time so the calendar feels populated.
const HOLIDAYS = [
  { month: 0, day: 1, label: "New Year's Day" },
  { month: 6, day: 4, label: "Independence Day" },
  { month: 11, day: 25, label: "Christmas Day" },
];

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export const calendarService = {
  /** Return calendar events overlapping a date range. */
  async events({ start, end } = {}) {
    await delay(240);
    const from = start ? new Date(start) : new Date();
    const to = end ? new Date(end) : new Date(Date.now() + 31 * 86400000);

    const meetings = dataset.appointments
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
        clientName: a.clientName,
        clientId: a.clientId,
        start: a.start,
        duration: a.duration,
        status: a.status,
      }));

    // Blocked time: a recurring focus block on the next few weekdays.
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
      if (match) holidays.push({ id: `hol_${i}`, type: "holiday", title: match.label, start: d.toISOString(), allDay: true });
    }

    return clone([...meetings, ...blocked, ...holidays]);
  },

  async eventsForDay(date) {
    const d = new Date(date);
    const all = await this.events({
      start: new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString(),
      end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59).toISOString(),
    });
    return all.filter((e) => sameDay(new Date(e.start), d));
  },
};
