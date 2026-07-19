import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatGptSuggestionLink } from "@/components/threads/chatgpt-suggestion-link";
import { getDictionary } from "@/i18n/locales";

describe("ChatGptSuggestionLink", () => {
  it("builds a LifeThread-routed proposal prompt for the exact thread", () => {
    render(
      <ChatGptSuggestionLink
        threadId="thread_aa01b77cb22f3376"
        locale="en"
        dictionary={getDictionary("en")}
      />,
    );

    const link = screen.getByRole("link", { name: "Get suggestions with ChatGPT" });
    const href = link.getAttribute("href");
    expect(href).toContain("https://chatgpt.com/?prompt=");
    expect(decodeURIComponent(href ?? "")).toContain("@LifeThread");
    expect(decodeURIComponent(href ?? "")).toContain("get_lifethread");
    expect(decodeURIComponent(href ?? "")).toContain("propose_lifethread_update");
    expect(decodeURIComponent(href ?? "")).toContain("thread_aa01b77cb22f3376");
  });
});
