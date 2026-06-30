import type { CmsEditorBlock } from "@/types/cms";

export const editorBlocks: CmsEditorBlock[] = [
  {
    id: "block-paragraph",
    type: "paragraph",
    label: "문단",
    description: "본문 문단을 추가합니다.",
  },
  {
    id: "block-heading",
    type: "heading",
    label: "소제목",
    description: "섹션 제목을 추가합니다.",
  },
  {
    id: "block-image",
    type: "image",
    label: "이미지",
    description: "미디어 라이브러리 이미지를 본문에 추가합니다.",
  },
  {
    id: "block-youtube",
    type: "youtube",
    label: "유튜브",
    description: "YouTube 영상 URL을 추가합니다.",
  },
  {
    id: "block-quote",
    type: "quote",
    label: "인용문",
    description: "강조할 문장을 인용 블록으로 추가합니다.",
  },
  {
    id: "block-ad",
    type: "ad",
    label: "광고 블록",
    description: "본문 중간 AdSense 영역을 추가합니다.",
  },
  {
    id: "block-button",
    type: "button",
    label: "버튼",
    description: "외부 링크 또는 CTA 버튼을 추가합니다.",
  },
  {
    id: "block-table",
    type: "table",
    label: "표",
    description: "영화 정보, 평점, 비교표를 추가합니다.",
  },
  {
    id: "block-gallery",
    type: "gallery",
    label: "갤러리",
    description: "여러 이미지를 묶어 갤러리로 추가합니다.",
  },
];
