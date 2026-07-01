import { mergeAttributes, Node } from "@tiptap/core";

export type CinescopeImageAlign = "left" | "center" | "right" | "full";
export type CinescopeImageSize = "small" | "medium" | "large" | "full";
export type CinescopeCaptionSize = "small" | "normal" | "large";

export type CinescopeImageAttrs = {
  src: string;
  alt: string;
  caption: string;
  align: CinescopeImageAlign;
  size: CinescopeImageSize;
  captionColor: string;
  captionSize: CinescopeCaptionSize;
  captionBold: boolean;
  captionItalic: boolean;
};

const sizeClass: Record<CinescopeImageSize, string> = {
  small: "cinescope-image-size-small",
  medium: "cinescope-image-size-medium",
  large: "cinescope-image-size-large",
  full: "cinescope-image-size-full",
};

const alignClass: Record<CinescopeImageAlign, string> = {
  left: "cinescope-image-align-left",
  center: "cinescope-image-align-center",
  right: "cinescope-image-align-right",
  full: "cinescope-image-align-full",
};

const captionSizeClass: Record<CinescopeCaptionSize, string> = {
  small: "cinescope-caption-small",
  normal: "cinescope-caption-normal",
  large: "cinescope-caption-large",
};

function boolAttribute(value: unknown) {
  return value === true || value === "true";
}

export const CinescopeImage = Node.create({
  name: "cinescopeImage",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element) => element.querySelector("img")?.getAttribute("src") ?? element.getAttribute("src") ?? "",
      },
      alt: {
        default: "",
        parseHTML: (element) => element.querySelector("img")?.getAttribute("alt") ?? element.getAttribute("alt") ?? "",
      },
      caption: {
        default: "",
        parseHTML: (element) => element.querySelector("figcaption")?.textContent ?? "",
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") ?? "center",
      },
      size: {
        default: "large",
        parseHTML: (element) => element.getAttribute("data-size") ?? "large",
      },
      captionColor: {
        default: "#6b7280",
        parseHTML: (element) => element.getAttribute("data-caption-color") ?? "#6b7280",
      },
      captionSize: {
        default: "normal",
        parseHTML: (element) => element.getAttribute("data-caption-size") ?? "normal",
      },
      captionBold: {
        default: false,
        parseHTML: (element) => boolAttribute(element.getAttribute("data-caption-bold")),
      },
      captionItalic: {
        default: false,
        parseHTML: (element) => boolAttribute(element.getAttribute("data-caption-italic")),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-cinescope-image]",
      },
      {
        tag: "img[src]",
        getAttrs: (element) => ({
          src: (element as HTMLElement).getAttribute("src"),
          alt: (element as HTMLElement).getAttribute("alt") ?? "",
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = HTMLAttributes as CinescopeImageAttrs;
    const captionStyle = [
      `color: ${attrs.captionColor || "#6b7280"}`,
      attrs.captionBold ? "font-weight: 700" : "",
      attrs.captionItalic ? "font-style: italic" : "",
    ]
      .filter(Boolean)
      .join("; ");

    return [
      "figure",
      mergeAttributes({
        "data-cinescope-image": "true",
        "data-align": attrs.align,
        "data-size": attrs.size,
        "data-caption-color": attrs.captionColor,
        "data-caption-size": attrs.captionSize,
        "data-caption-bold": String(Boolean(attrs.captionBold)),
        "data-caption-italic": String(Boolean(attrs.captionItalic)),
        class: [
          "cinescope-image",
          alignClass[attrs.align] ?? alignClass.center,
          sizeClass[attrs.size] ?? sizeClass.large,
        ].join(" "),
      }),
      [
        "img",
        {
          src: attrs.src,
          alt: attrs.alt,
        },
      ],
      attrs.caption
        ? [
            "figcaption",
            {
              class: ["cinescope-caption", captionSizeClass[attrs.captionSize] ?? captionSizeClass.normal].join(" "),
              style: captionStyle,
            },
            attrs.caption,
          ]
        : ["figcaption", { class: "cinescope-caption cinescope-caption-empty" }, ""],
    ];
  },
});
