alter table public.posts
add column if not exists content_blocks jsonb;

create index if not exists posts_content_blocks_gin_idx
on public.posts
using gin (content_blocks);
