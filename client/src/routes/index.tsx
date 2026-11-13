import { createFileRoute } from "@tanstack/react-router";
import { TodayContainer } from "@/components/today-layout";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jōtai · Personal Operating System" },
      {
        name: "description",
        content: "A focused, gamified productivity dashboard for turning attention into momentum.",
      },
      { property: "og:title", content: "Jōtai · Personal Operating System" },
      {
        property: "og:description",
        content: "A focused, gamified productivity dashboard for turning attention into momentum.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TodayContainer,
});
