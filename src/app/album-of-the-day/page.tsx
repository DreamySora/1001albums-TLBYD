import { Suspense } from "react";
import PageContent from "./page-content";
import { getAlbumOfTheDay, getAlbumOfTheDayHistory, getTimeUntilNextChange } from "@/lib/album-of-the-day";
import { SkeletonGrid } from "@/app/page-helpers";

export default async function Page() {
  const todayAlbum = getAlbumOfTheDay();
  const timeUntilChange = getTimeUntilNextChange();
  const history = getAlbumOfTheDayHistory(200);

  return (
    <Suspense fallback={<SkeletonGrid />}>
      <PageContent
        todayAlbum={todayAlbum}
        timeUntilChange={timeUntilChange}
        history={history}
      />
    </Suspense>
  );
}
