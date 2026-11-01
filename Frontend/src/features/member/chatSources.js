/**
 * Normalizes backend AI chat responses to a uniform { text, sources } structure.
 * Supports legacy plain-text string responses as well as structured RAG citation objects.
 */
export function normalizeChatResponse(data) {
  if (data === null || data === undefined) {
    return { text: '', sources: [] };
  }

  if (typeof data === 'string') {
    return { text: data, sources: [] };
  }

  if (typeof data === 'object') {
    const text = typeof data.text === 'string' ? data.text : String(data.text || '');
    const sources = Array.isArray(data.sources)
      ? data.sources.map((s, idx) => ({
          index: typeof s.index === 'number' ? s.index : idx + 1,
          title: typeof s.title === 'string' ? s.title : 'Tài liệu tham khảo',
          category: typeof s.category === 'string' ? s.category : 'GENERAL'
        }))
      : [];

    return { text, sources };
  }

  return { text: String(data), sources: [] };
}
