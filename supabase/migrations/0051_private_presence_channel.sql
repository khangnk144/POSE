-- The team presence channel is private: only team members may listen to it or track on it.
-- Without these policies any holder of the public anon key could join the channel, read who is
-- online and inject fake teammates. Policies are scoped to the presence topic so the same rules
-- do not accidentally authorize other channels.

create policy team_presence_read on realtime.messages
  for select to authenticated
  using (
    realtime.messages.extension = 'presence'
    and (select realtime.topic()) = 'team-presence'
    and (select public.is_member())
  );

create policy team_presence_write on realtime.messages
  for insert to authenticated
  with check (
    realtime.messages.extension = 'presence'
    and (select realtime.topic()) = 'team-presence'
    and (select public.is_member())
  );
