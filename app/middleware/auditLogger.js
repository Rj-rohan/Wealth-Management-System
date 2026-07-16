import { db } from "../lib/db";

export function logAuditAction(actorId, action, entityType, entityId, oldValue, newValue) {
  const logEntry = {
    id: crypto.randomUUID(),
    actorId,
    action, // 'create' | 'update' | 'delete'
    entityType,
    entityId,
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
    timestamp: new Date().toISOString()
  };
  
  db.auditLogs.push(logEntry);
  console.log(`[AUDIT] ${action.toUpperCase()} on ${entityType} (${entityId}) by ${actorId}`);
  
  return logEntry;
}
