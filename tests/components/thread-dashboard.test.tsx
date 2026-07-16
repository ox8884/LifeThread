import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThreadDashboard } from "@/components/threads/thread-dashboard";
import type { ThreadSummary } from "@/application/threads/thread-repository";
import { getDictionary } from "@/i18n/locales";

const dictionary = getDictionary("en");

function summary(id: string, title: string): ThreadSummary {
  return {
    id,
    title,
    goal_text: title,
    version: 1,
    updated_at: "2026-07-16T06:00:00.000Z",
    review_count: 2,
  };
}

describe("ThreadDashboard", () => {
  afterEach(() => cleanup());

  it("renders an empty dashboard with one clear create action", () => {
    const createAction = vi.fn(async () => undefined);

    render(
      <ThreadDashboard
        locale="en"
        dictionary={dictionary}
        summaries={[]}
        actionError={false}
        createAction={createAction}
      />,
    );

    expect(screen.getByRole("heading", { name: "Your living goals" })).toBeVisible();
    expect(screen.getByText("No living threads yet.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Create living thread" })).toBeVisible();
  });

  it("renders each owner-scoped goal as an independently addressable card", () => {
    const createAction = vi.fn(async () => undefined);

    render(
      <ThreadDashboard
        locale="ko"
        dictionary={getDictionary("ko")}
        summaries={[
          summary("thread-a", "Prepare the launch"),
          summary("thread-b", "Learn conversational Korean"),
        ]}
        actionError={false}
        createAction={createAction}
      />,
    );

    expect(screen.getByRole("link", { name: "Prepare the launch" })).toHaveAttribute(
      "href",
      "/ko/threads/thread-a",
    );
    expect(screen.getByRole("link", { name: "Learn conversational Korean" })).toHaveAttribute(
      "href",
      "/ko/threads/thread-b",
    );
    expect(screen.getAllByTestId("thread-card")).toHaveLength(2);
  });

  it("keeps recoverable action errors visible without hiding the dashboard", () => {
    const createAction = vi.fn(async () => undefined);

    render(
      <ThreadDashboard
        locale="en"
        dictionary={dictionary}
        summaries={[]}
        actionError={true}
        createAction={createAction}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(dictionary.actionError);
    expect(screen.getByRole("heading", { name: "Your living goals" })).toBeVisible();
  });

  it("keeps Korean counts grammatical and accessible", () => {
    const createAction = vi.fn(async () => undefined);

    render(
      <ThreadDashboard
        locale="ko"
        dictionary={getDictionary("ko")}
        summaries={[summary("thread-a", "집중적인 창작 작업을 위한 주간 계획")]}
        actionError={false}
        createAction={createAction}
      />,
    );

    expect(screen.getByLabelText("1개의 목표")).toBeVisible();
    expect(screen.getByText("검토할 항목 2건")).toBeVisible();
  });
});
