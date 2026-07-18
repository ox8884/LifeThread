import type { Dictionary, Locale } from "@/i18n/locales";

type ChatGptSuggestionLinkProps = Readonly<{
  threadId: string;
  locale: Locale;
  dictionary: Dictionary;
}>;

export function ChatGptSuggestionLink({ threadId, locale, dictionary }: ChatGptSuggestionLinkProps) {
  const prompt = locale === "ko"
    ? `LifeThread에서 이 목표의 다음 제안을 만들어줘. thread_id=${threadId}. 현재 상태를 먼저 읽고, 인용 가능한 근거를 포함한 CandidateDelta만 제안해줘. 아무것도 자동 확정하지 마.`
    : `Help me improve this LifeThread goal. thread_id=${threadId}. Read the current state first, then propose only a cited CandidateDelta. Do not confirm or complete anything automatically.`;
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
