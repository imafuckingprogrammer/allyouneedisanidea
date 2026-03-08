-- Add allowed_actions to sites table
-- These control which DOM tools the agent is permitted to use

alter table public.sites
  add column if not exists allowed_actions text[] not null default array['navigate','click','fill','scroll','extract'];

-- Update existing rows to have all actions enabled
update public.sites
  set allowed_actions = array['navigate','click','fill','scroll','extract']
  where allowed_actions is null or array_length(allowed_actions, 1) = 0;
