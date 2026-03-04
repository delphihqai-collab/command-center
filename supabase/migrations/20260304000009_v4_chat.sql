-- V4: Chat conversations and messages
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) not null,
  title text,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.chat_conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'agent')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_conversations_agent_id
  on public.chat_conversations(agent_id) where archived_at is null;
create index if not exists idx_chat_messages_conversation_id
  on public.chat_messages(conversation_id);
create index if not exists idx_chat_messages_created_at
  on public.chat_messages(created_at desc);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

create policy "authenticated users can manage chat_conversations"
  on public.chat_conversations for all to authenticated using (true) with check (true);
create policy "authenticated users can manage chat_messages"
  on public.chat_messages for all to authenticated using (true) with check (true);
