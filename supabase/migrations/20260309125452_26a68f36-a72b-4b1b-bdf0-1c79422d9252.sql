CREATE OR REPLACE FUNCTION public.delete_orphan_orchestration()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  DELETE FROM audit_orchestration WHERE session_id = OLD.id::text;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_cleanup_orchestration
  BEFORE DELETE ON audits
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_orphan_orchestration();