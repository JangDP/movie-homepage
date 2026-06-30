export type NavItem = {
  id?: string;
  label: string;
  href: string;
  order?: number;
  active?: boolean;
};

export type Category = {
  id: ContentCategory;
  label: string;
  href: string;
  description: string;
  order?: number;
  visible?: boolean;
};

export type SocialLink = {
  label: string;
  href: string;
};

export type HeroBanner = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: NavItem;
  secondaryCta: NavItem;
  image: string;
  imageAlt: string;
};

export type FooterInfo = {
  description: string;
  copyright: string;
  links: NavItem[];
};

export type SiteAppearance = {
  logoText: string;
  heroImage: string;
  backgroundImage: string;
  accentColor: string;
  cardStyle: "compact" | "poster" | "editorial";
  visibleSections: {
    featured: boolean;
    movies: boolean;
    latest: boolean;
    categories: boolean;
  };
  footerText: string;
};

export type SiteConfig = {
  name: string;
  logoText: string;
  url: string;
  description: string;
  menus: NavItem[];
  categories: Category[];
  hero: HeroBanner;
  appearance: SiteAppearance;
  socialLinks: SocialLink[];
  footer: FooterInfo;
};

export type BuiltInCategory =
  | "news"
  | "reviews"
  | "guide"
  | "recommendations"
  | "upcoming"
  | "ott";

export type ContentCategory = BuiltInCategory | (string & {});

export type PostStatus = "draft" | "published" | "deleted";

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: ContentCategory;
  author: string;
  publishedAt: string;
  readTime: string;
  image: string;
  imageAlt: string;
  tags: string[];
  status: PostStatus;
  featured?: boolean;
  viewCount?: number;
};

export type Article = Post;

export type EditorBlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "youtube"
  | "quote"
  | "ad"
  | "button";

export type EditorBlock = {
  id: string;
  type: EditorBlockType;
  label: string;
  placeholder: string;
};

export type Movie = {
  id: string;
  title: string;
  originalTitle: string;
  genre: string[];
  rating: number;
  releaseLabel: string;
  poster: string;
  posterAlt: string;
  summary: string;
  source: "theater" | "ott" | "festival";
};

export type AdminStat = {
  label: string;
  value: string;
  helper: string;
};
