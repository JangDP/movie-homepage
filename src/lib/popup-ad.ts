export const POPUP_AD_SETTINGS_KEY = "popup_ad_settings";

export type PopupAdSettings = {
  id: string;
  enabled: boolean;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  linkUrl: string;
  buttonText: string;
  showOncePerDay: boolean;
  updatedAt: string;
};

export const defaultPopupAdSettings: PopupAdSettings = {
  id: "main-popup",
  enabled: false,
  title: "시사회 이벤트",
  description: "지금 응모하고 특별 상영 기회를 확인해보세요.",
  imageUrl: "",
  imageAlt: "이벤트 팝업 이미지",
  linkUrl: "/",
  buttonText: "자세히 보기",
  showOncePerDay: true,
  updatedAt: "",
};

export function normalizePopupAdSettings(value?: Partial<PopupAdSettings> | null): PopupAdSettings {
  return {
    ...defaultPopupAdSettings,
    ...(value ?? {}),
    id: value?.id || defaultPopupAdSettings.id,
  };
}
