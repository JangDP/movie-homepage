export type SpellCheckField = "title" | "body" | "excerpt" | "seoTitle" | "metaDescription";

export type SpellCheckIssueType = "spelling" | "spacing";

export type SpellCheckIssue = {
  id: string;
  field: SpellCheckField;
  type: SpellCheckIssueType;
  original: string;
  suggestion: string;
  message: string;
  context: string;
};

export type SpellCheckInput = Record<SpellCheckField, string>;

export type SpellCheckResult = {
  issues: SpellCheckIssue[];
  spellingCount: number;
  spacingCount: number;
  totalCount: number;
};

type SpellRule = {
  type: SpellCheckIssueType;
  original: string;
  replacement: string;
  message: string;
};

export type CustomSpellCheckRule = {
  type: SpellCheckIssueType;
  wrongText: string;
  suggestion: string;
  message?: string | null;
};

const localRules: SpellRule[] = [
  { type: "spacing", original: "할수", replacement: "할 수", message: "'할 수'는 띄어 씁니다." },
  { type: "spacing", original: "볼수", replacement: "볼 수", message: "'볼 수'는 띄어 씁니다." },
  { type: "spacing", original: "될수", replacement: "될 수", message: "'될 수'는 띄어 씁니다." },
  { type: "spacing", original: "알수", replacement: "알 수", message: "'알 수'는 띄어 씁니다." },
  { type: "spacing", original: "있는것", replacement: "있는 것", message: "'것'은 앞말과 띄어 씁니다." },
  { type: "spacing", original: "없는것", replacement: "없는 것", message: "'것'은 앞말과 띄어 씁니다." },
  { type: "spacing", original: "하는것", replacement: "하는 것", message: "'것'은 앞말과 띄어 씁니다." },
  { type: "spacing", original: "것같", replacement: "것 같", message: "'것 같다'는 띄어 씁니다." },
  { type: "spelling", original: "되요", replacement: "돼요", message: "'되요'는 '돼요'로 쓰는 것이 자연스럽습니다." },
  { type: "spelling", original: "됬", replacement: "됐", message: "'됬'은 '됐'으로 씁니다." },
  { type: "spelling", original: "왠만", replacement: "웬만", message: "'왠만'은 '웬만'으로 씁니다." },
  { type: "spelling", original: "몇일", replacement: "며칠", message: "'몇일'은 '며칠'로 씁니다." },
  { type: "spelling", original: "오랫만", replacement: "오랜만", message: "'오랫만'은 '오랜만'으로 씁니다." },
  { type: "spelling", original: "어의", replacement: "어이", message: "'어의없다'는 '어이없다'로 씁니다." },
  { type: "spelling", original: "어딧", replacement: "어디 있", message: "'어딧'은 '어디 있'으로 쓰는 것이 자연스럽습니다." },
  { type: "spelling", original: "어딨", replacement: "어디 있", message: "'어딨'은 '어디 있'으로 풀어 쓰는 것이 자연스럽습니다." },
  { type: "spelling", original: "는쥐", replacement: "는지", message: "'는쥐'는 '는지'로 씁니다." },
  { type: "spelling", original: "은쥐", replacement: "은지", message: "'은쥐'는 '은지'로 씁니다." },
  { type: "spelling", original: "한쥐", replacement: "한지", message: "'한쥐'는 '한지'로 씁니다." },
  { type: "spacing", original: "  ", replacement: " ", message: "연속된 공백을 하나로 줄입니다." },
];

const fieldLabels: Record<SpellCheckField, string> = {
  title: "제목",
  body: "본문",
  excerpt: "요약",
  seoTitle: "SEO 제목",
  metaDescription: "메타 설명",
};

function createContext(value: string, index: number, original: string) {
  const start = Math.max(0, index - 18);
  const end = Math.min(value.length, index + original.length + 18);

  return `${start > 0 ? "..." : ""}${value.slice(start, end)}${end < value.length ? "..." : ""}`;
}

function findAllIndexes(value: string, search: string) {
  const indexes: number[] = [];
  let index = value.indexOf(search);

  while (index >= 0) {
    indexes.push(index);
    index = value.indexOf(search, index + search.length);
  }

  return indexes;
}

export class SpellCheckService {
  async check(input: SpellCheckInput, customRules: CustomSpellCheckRule[] = []): Promise<SpellCheckResult> {
    const issues: SpellCheckIssue[] = [];
    const rules = [
      ...localRules,
      ...customRules
        .filter((rule) => rule.wrongText.trim() && rule.suggestion.trim())
        .map((rule) => ({
          type: rule.type,
          original: rule.wrongText,
          replacement: rule.suggestion,
          message: rule.message || `'${rule.wrongText}'은 '${rule.suggestion}'으로 수정할 수 있습니다.`,
        })),
    ];

    Object.entries(input).forEach(([fieldName, value]) => {
      const field = fieldName as SpellCheckField;

      rules.forEach((rule) => {
        findAllIndexes(value, rule.original).forEach((index) => {
          issues.push({
            id: `${field}:${rule.original}:${rule.replacement}:${index}`,
            field,
            type: rule.type,
            original: rule.original,
            suggestion: rule.replacement,
            message: `${fieldLabels[field]}: ${rule.message}`,
            context: createContext(value, index, rule.original),
          });
        });
      });
    });

    const spellingCount = issues.filter((issue) => issue.type === "spelling").length;
    const spacingCount = issues.filter((issue) => issue.type === "spacing").length;

    return {
      issues,
      spellingCount,
      spacingCount,
      totalCount: issues.length,
    };
  }
}

export const spellCheckService = new SpellCheckService();
