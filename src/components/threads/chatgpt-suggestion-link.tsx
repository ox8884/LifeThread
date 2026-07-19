import type { Dictionary, Locale } from "@/i18n/locales";

type ChatGptSuggestionLinkProps = Readonly<{
  threadId: string;
  locale: Locale;
  dictionary: Dictionary;
}>;

export function ChatGptSuggestionLink({ threadId, locale, dictionary }: ChatGptSuggestionLinkProps) {
  const prompt = locale === "ko"
    ? `@LifeThread 연결된 LifeThread 앱만 사용해줘. OpenCrab이나 다른 앱은 사용하지 마. 먼저 get_lifethread 도구로 정확한 thread_id=${threadId}의 현재 상태를 읽어줘. 그 다음 propose_lifethread_update 도구로 인용 가능한 CandidateDelta만 제안해줘. 자동 확정, 수락, 완료는 하지 마. LifeThread 앱을 사용할 수 없다면 다른 앱으로 대체하지 말고 + 메뉴 → More → LifeThread를 선택하라고 알려줘.`
    : `@LifeThread Use only the connected LifeThread app. Do not use OpenCrab or any other app. First call the get_lifethread tool for the exact thread_id=${threadId}. Then call propose_lifethread_update to leave only a cited CandidateDelta proposal. Do not confirm, accept, or complete anything automatically. If LifeThread is unavailable, do not substitute another app; tell me to select + menu → More → LifeThread.`;
  const href = `https://chatgpt.com/?prompt=${encodeURIComponent(prompt)}`;

  return (
    <aside className="chatgpt-suggestion-link" aria-labelledby="chatgpt-suggestion-title">
      <div>
        <p className="section-kicker">{dictionary.chatgptEyebrow}</p>
        <h2 id="chatgpt-suggestion-title">{dictionary.chatgptTitle}</h2>
        <p>{dictionary.chatgptBody}</p>
      </div>
      <a className="button secondary" href={href} target="_blank" rel="noreferrer">
        {dictionary.chatgptAction}
      </a>
    </aside>
  );
}
