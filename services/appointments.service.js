import { dataset } from "@/lib/mock/dataset";
import { respond, clone, delay, uid } from "./mockUtil";

function isUpcoming(a) {
  return a.status === "upcoming" && new Date(a.start) >= new Date(Date.now() - 60 * 60 * 1000);
}

export const appointmentsService = {
  async list({ scope = "upcoming" } = {}) {
    await delay(260);
    let rows = clone(dataset.appointments);
    if (scope === "upcoming") rows = rows.filter(isUpcoming).sort((a, b) => new Date(a.start) - new Date(b.start));
    else if (scope === "past") rows = rows.filter((a) => !isUpcoming(a)).sort((a, b) => new Date(b.start) - new Date(a.start));
    return rows;
  },

  async getById(id) {
    return respond(dataset.appointments.find((a) => a.id === id) || null, 180);
  },

  async create(payload) {
    await delay(320);
    const client = dataset.clients.find((c) => c.id === payload.clientId);
    const appointment = {
      id: uid("apt"),
      status: "upcoming",
      duration: 45,
      type: "video",
      notes: "",
      ...payload,
      clientName: client?.name || payload.clientName || "Client",
    };
    dataset.appointments.push(appointment);
    return clone(appointment);
  },

  async reschedule(id, start) {
    await delay(260);
    const apt = dataset.appointments.find((a) => a.id === id);
    if (apt) {
      apt.start = start;
      apt.status = "upcoming";
    }
    return clone(apt);
  },

  async cancel(id) {
    await delay(220);
    const apt = dataset.appointments.find((a) => a.id === id);
    if (apt) apt.status = "cancelled";
    return clone(apt);
  },

  async saveNotes(id, notes) {
    await delay(200);
    const apt = dataset.appointments.find((a) => a.id === id);
    if (apt) apt.notes = notes;
    return clone(apt);
  },
};
