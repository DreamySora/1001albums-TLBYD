import { Suspense } from "react";
import PageContent from "./page-content";
import { getAlbumOfTheDay, getTimeUntilNextChange } from "@/lib/album-of-the-day";
import { SkeletonGrid } from "@/app/page-helpers";

async function getAlbumsData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/albums`, {
    cache: "no-store",
  });
  return res.json();
}

export default async function Page() {
  const albumsData = await getAlbumsData();
  const albumOfTheDay = getAlbumOfTheDay();
  const timeUntilChange = getTimeUntilNextChange();

  return (
    <Suspense fallback={<SkeletonGrid />}>
      <PageContent
        initialAlbums={albumsData.albums}
        initialGenres={albumsData.genres}
        initialArtists={albumsData.artists}
        albumOfTheDay={albumOfTheDay}
        timeUntilChange={timeUntilChange}
      />
    </Suspense>
  );
}