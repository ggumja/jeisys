export interface ParsedOption {
  label: string;
  variants: {
    groupId?: string;
    groupName: string;
    valueId?: string;
    valueName: string;
    additionalPrice: number;
  }[];
}

/**
 * cart_items의 option_name 필드에서 JSON 구조를 안전하게 파싱합니다.
 * 만약 JSON 파싱에 실패하거나 규격이 다른 경우 (기존 plain string), label로 처리합니다.
 */
export function parseCartOption(optionName: string | null | undefined): ParsedOption {
  if (!optionName) return { label: '', variants: [] };
  
  const trimmed = optionName.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        return {
          label: parsed.label || '',
          variants: Array.isArray(parsed.variants) ? parsed.variants.map((v: any) => ({
            groupId: v.groupId,
            groupName: v.groupName || '',
            valueId: v.valueId,
            valueName: v.valueName || '',
            additionalPrice: Number(v.additionalPrice) || 0
          })) : []
        };
      }
    } catch (e) {
      // JSON parsing failure, fallback to plain string
    }
  }
  
  return { label: optionName, variants: [] };
}
