import { apiClient } from "./apiClient";

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export const calendarService = {
  /** Return calendar events overlapping a date range. */
  async events({ start, end } = {}) {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    return apiClient.get(`/api/calendar/events?${params.toString()}`);
  },

  async eventsForDay(date) {
    const d = new Date(date);
    const all = await this.events({
      start: new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString(),
      end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59).toISOString(),
    });
    return (all || []).filter((e) => sameDay(new Date(e.start), d));
  },
};
