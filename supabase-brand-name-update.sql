-- Update saved site branding to "시네마틱 유니버스".
-- Run this in Supabase SQL Editor if the deployed site still shows the old name
-- because site_settings values can override the code defaults.

insert into public.site_settings (key, value, updated_at)
select
  'appearance_settings',
  jsonb_build_object(
    'logoText', '시네마틱 유니버스',
    'footerText', '시네마틱 유니버스는 영화를 좋아하는 독자를 위한 뉴스, 리뷰, 추천 중심의 매거진입니다.'
  ),
  now()
where not exists (
  select 1 from public.site_settings where key = 'appearance_settings'
);

update public.site_settings
set
  value = jsonb_set(
    jsonb_set(
      coalesce(value, '{}'::jsonb),
      '{logoText}',
      to_jsonb('시네마틱 유니버스'::text),
      true
    ),
    '{footerText}',
    to_jsonb('시네마틱 유니버스는 영화를 좋아하는 독자를 위한 뉴스, 리뷰, 추천 중심의 매거진입니다.'::text),
    true
  ),
  updated_at = now()
where key = 'appearance_settings';

update public.site_settings
set
  value = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            coalesce(value, '{}'::jsonb),
            '{name}',
            to_jsonb('시네마틱 유니버스'::text),
            true
          ),
          '{logoText}',
          to_jsonb('시네마틱 유니버스'::text),
          true
        ),
        '{appearance,logoText}',
        to_jsonb('시네마틱 유니버스'::text),
        true
      ),
      '{appearance,footerText}',
      to_jsonb('시네마틱 유니버스는 영화를 좋아하는 독자를 위한 뉴스, 리뷰, 추천 중심의 매거진입니다.'::text),
      true
    ),
    '{footer,copyright}',
    to_jsonb('© 2026 시네마틱 유니버스. All rights reserved.'::text),
    true
  ),
  updated_at = now()
where key = 'site_config';
