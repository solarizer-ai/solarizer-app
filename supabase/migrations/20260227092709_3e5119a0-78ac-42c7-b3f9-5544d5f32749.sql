-- Prevent two simultaneous active audits per user.
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_audit_per_user
  ON audit_orchestration(user_id)
  WHERE status IN ('queued', 'running');