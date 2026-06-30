insert into public.categories (id, label, href, description, sort_order, visible)
values
  ('news', '영화 뉴스', '/news', '산업 이슈, 캐스팅, 제작 소식, 박스오피스 흐름을 빠르게 전합니다.', 1, true),
  ('reviews', '리뷰', '/reviews', '신작과 화제작을 장면, 연기, 연출, 사운드 관점에서 분석합니다.', 2, true),
  ('guide', '관람 가이드', '/guide', '영화를 더 깊게 즐기기 위한 입문 가이드와 해설을 제공합니다.', 3, true),
  ('recommendations', '추천', '/recommendations', '기분, 장르, 시즌에 맞춘 영화 큐레이션을 소개합니다.', 4, true),
  ('upcoming', '개봉예정', '/upcoming', '극장 개봉과 영화제 상영 예정작을 미리 살펴봅니다.', 5, true),
  ('ott', 'OTT', '/ott', '넷플릭스, 디즈니+, 웨이브, 티빙 등 스트리밍 신작을 정리합니다.', 6, true)
on conflict (id) do update set
  label = excluded.label,
  href = excluded.href,
  description = excluded.description,
  sort_order = excluded.sort_order,
  visible = excluded.visible;

insert into public.posts (
  slug,
  title,
  excerpt,
  body,
  category_id,
  author,
  published_at,
  read_time,
  thumbnail_url,
  image_alt,
  tags,
  status,
  featured,
  seo_title,
  meta_description
)
values
  (
    'summer-box-office-trend',
    '여름 극장가, 대작보다 입소문 영화가 강해진 이유',
    '프랜차이즈 대작 중심이던 성수기 시장에서 관객 반응과 재관람 지표가 흥행을 좌우하고 있습니다.',
    '올여름 극장가는 대규모 마케팅보다 관객의 실제 반응이 더 강하게 작동하고 있습니다. 개봉 첫 주보다 둘째 주 좌석 점유율과 온라인 리뷰 확산 속도가 흥행의 핵심 지표로 떠올랐습니다.',
    'news',
    '편집부',
    '2026-06-28',
    '4분',
    'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=1200&q=80',
    '영화관에서 영화를 보는 관객',
    array['박스오피스','산업','극장'],
    'published',
    true,
    '여름 극장가 흥행 트렌드',
    '입소문 영화가 극장 흥행을 이끄는 이유를 분석합니다.'
  ),
  (
    'noir-review-night-city',
    '리뷰: 밤의 도시가 품은 누아르의 새 얼굴',
    '빛과 그림자를 극단적으로 밀어붙인 촬영, 절제된 대사, 느린 호흡이 장르의 긴장을 되살립니다.',
    '이 영화는 도시의 밤을 단순한 배경이 아니라 인물의 심리로 사용합니다. 붉은 간판과 푸른 그림자가 충돌하는 장면마다 주인공의 선택은 조금씩 더 위험한 곳으로 향합니다.',
    'reviews',
    '한지윤',
    '2026-06-27',
    '6분',
    'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=1200&q=80',
    '어두운 극장 조명',
    array['누아르','리뷰','촬영'],
    'published',
    true,
    '밤의 도시 누아르 리뷰',
    '촬영과 연출로 장르의 긴장을 되살린 누아르 리뷰입니다.'
  )
on conflict (category_id, slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  body = excluded.body,
  author = excluded.author,
  published_at = excluded.published_at,
  read_time = excluded.read_time,
  thumbnail_url = excluded.thumbnail_url,
  image_alt = excluded.image_alt,
  tags = excluded.tags,
  status = excluded.status,
  featured = excluded.featured,
  seo_title = excluded.seo_title,
  meta_description = excluded.meta_description;
