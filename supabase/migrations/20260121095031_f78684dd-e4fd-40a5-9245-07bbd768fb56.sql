-- Allow invitees to decline (delete) their own pending invitations
CREATE POLICY "Invitees can decline their own invitations"
ON team_invitations
FOR DELETE
USING (
  email = (SELECT profiles.email FROM profiles WHERE profiles.id = auth.uid())
  AND accepted_at IS NULL
  AND expires_at > now()
);