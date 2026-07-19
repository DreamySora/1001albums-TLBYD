// Script to modify raw album data per user requirements

import { raw1 } from "../src/data/raw-1";
import { raw2 } from "../src/data/raw-2";
import { raw3 } from "../src/data/raw-3";
import { raw4 } from "../src/data/raw-4";
import { raw5 } from "../src/data/raw-5";
import { raw6 } from "../src/data/raw-6";
import { FEMALE_ARTISTS } from "../src/data/female-set";
import { writeFileSync } from "fs";
import { join } from "path";

const allRaw = [...raw1, ...raw2, ...raw3, ...raw4, ...raw5, ...raw6];

// Convert to objects for easier manipulation
type RawAlbum = {
  artist: string;
  title: string;
  year: number;
  genres: string[];
  duration: number;
  description: string;
  originalIndex: number;
  sourceFile: number;
};

const albums: RawAlbum[] = allRaw.map(([artist, title, year, genreStr, duration, description], i) => ({
  artist,
  title,
  year,
  genres: genreStr.split("|").map((g) => g.trim()),
  duration,
  description,
  originalIndex: i,
  sourceFile: 0,
}));

// Mark source files
let idx = 0;
for (const raw of [raw1, raw2, raw3, raw4, raw5, raw6]) {
  for (let i = 0; i < raw.length; i++) {
    albums[idx].sourceFile = [raw1, raw2, raw3, raw4, raw5, raw6].indexOf(raw) + 1;
    idx++;
  }
}

console.log("Total raw albums:", albums.length);

// ============================================================
// GENRE CATEGORIES
// ============================================================
const INDIE_ROCK = "Indie Rock";
const FUNK = "Funk";

const PUNK_SHOEGAZE = [
  "Punk",
  "Post-Punk",
  "Post-Hardcore",
  "Hardcore",
  "Emo",
  "Pop Punk",
  "Shoegaze",
  "Dream Pop",
  "Noise Pop",
  "Slowcore",
  "Dreampop",
];

const ELECTRONIC_AMBIENT = [
  "Electronic",
  "Ambient",
  "IDM",
  "Techno",
  "House",
  "Downtempo",
  "Trip Hop",
  "Dubstep",
  "Dub Techno",
  "Breakbeat",
  "Jungle",
  "Drum and Bass",
  "Liquid DnB",
  "UK Garage",
  "2-Step",
  "Electro",
  "Electroclash",
  "Synthpop",
  "Synthwave",
  "French House",
  "Disco",
  "Nu-Disco",
  "Balearic",
  "Chillwave",
  "Hypnagogic Pop",
  "Glitch",
  "Wonky",
  "LA Beat Scene",
  "Indietronic",
  "Folktronica",
  "Microhouse",
  "Dark Wave",
  "Cold Wave",
  "Minimal Wave",
  "Synthpunk",
  "Industrial",
  "Experimental",
  "Ambient House",
  "Melodic House",
  "Melodic Techno",
  "Acid House",
  "Acid",
  "Rave",
  "Hardcore",
  "Detroit Techno",
  "Minimal Techno",
  "Tech House",
  "Deep House",
  "Ambient Techno",
  "Post-Rock",
];

const LATINO = [
  "Latin",
  "Latin Pop",
  "Latin Rock",
  "Rock en Español",
  "Reggaeton",
  "Latin Trap",
  "Cumbia",
  "Salsa",
  "Tejano",
  "Ranchera",
  "Bolero",
  "Ballad",
  "MPB",
  "Brazilian",
  "Bossa Nova",
  "Samba",
  "Tropicália",
  "Afro-Brazilian",
  "Caribbean",
  "Afro-Cuban",
  "Cuban",
  "Puerto Rican",
  "Colombian",
  "Venezuelan",
  "Mexican",
  "Argentine",
  "Chilean",
  "Spanish",
  "Flamenco",
  "Rumba",
  "Neapolitan",
  "Italian",
  "Tango",
  "Electronic Tango",
  "Afro-Peruvian",
];

// ============================================================
// REMOVAL STRATEGY
// ============================================================
const SOUL_GOOD_GENRES = [
  "Soul",
  "R&B",
  "Neo-Soul",
  "Funk",
  "Disco",
  "Quiet Storm",
  "Smooth Soul",
  "Memphis Soul",
  "Southern Soul",
  "Philly Soul",
  "Chicago Soul",
  "Motown Soul",
  "Gospel Soul",
  "Psychedelic Soul",
  "Blue-Eyed Soul",
  "Northern Soul",
  "Deep Soul",
  "Jazz-Funk",
  "Jazz-Soul",
  "Folk Soul",
  "Alternative R&B",
  "Hip Hop Soul",
  "PBR&B",
];

function countGoodGenres(genres: string[]): number {
  return genres.filter((g) => SOUL_GOOD_GENRES.includes(g)).length;
}

const REMOVE_INDIE_ROCK = 20;
const REMOVE_FUNK = 15;
const REMOVE_PUNK_SHOE = 20;
const REMOVE_ELEC_AMB = 20;
const REMOVE_LATINO = 10;

const removedCount = {
  indieRock: 0,
  funk: 0,
  punkShoe: 0,
  elecAmb: 0,
  latino: 0,
};

// Sort albums by "good genre count" ascending (remove those with fewer good genres first)
albums.sort((a, b) => countGoodGenres(a.genres) - countGoodGenres(b.genres));

// Remove Indie Rock genres
for (const album of albums) {
  if (removedCount.indieRock >= REMOVE_INDIE_ROCK) break;
  if (album.genres.includes(INDIE_ROCK)) {
    album.genres = album.genres.filter((g) => g !== INDIE_ROCK);
    removedCount.indieRock++;
  }
}

// Remove Funk genres
for (const album of albums) {
  if (removedCount.funk >= REMOVE_FUNK) break;
  if (album.genres.includes(FUNK)) {
    album.genres = album.genres.filter((g) => g !== FUNK);
    removedCount.funk++;
  }
}

// Remove Punk/Shoegaze genres (one per album)
for (const album of albums) {
  if (removedCount.punkShoe >= REMOVE_PUNK_SHOE) break;
  const hasPunkShoe = album.genres.some((g) => PUNK_SHOEGAZE.includes(g));
  if (hasPunkShoe) {
    for (const g of PUNK_SHOEGAZE) {
      const idx = album.genres.indexOf(g);
      if (idx >= 0) {
        album.genres.splice(idx, 1);
        removedCount.punkShoe++;
        break;
      }
    }
  }
}

// Remove Electronic/Ambient genres
for (const album of albums) {
  if (removedCount.elecAmb >= REMOVE_ELEC_AMB) break;
  const hasElecAmb = album.genres.some((g) => ELECTRONIC_AMBIENT.includes(g));
  if (hasElecAmb) {
    for (const g of ELECTRONIC_AMBIENT) {
      const idx = album.genres.indexOf(g);
      if (idx >= 0) {
        album.genres.splice(idx, 1);
        removedCount.elecAmb++;
        break;
      }
    }
  }
}

// Remove Latino genres
for (const album of albums) {
  if (removedCount.latino >= REMOVE_LATINO) break;
  const hasLatino = album.genres.some((g) => LATINO.includes(g));
  if (hasLatino) {
    for (const g of LATINO) {
      const idx = album.genres.indexOf(g);
      if (idx >= 0) {
        album.genres.splice(idx, 1);
        removedCount.latino++;
        break;
      }
    }
  }
}

console.log("Removed:", removedCount);

// ============================================================
// ADD DECADE GENRES TO ALL ALBUMS
// ============================================================
function getDecade(year: number): string {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

for (const album of albums) {
  const decade = getDecade(album.year);
  if (!album.genres.includes(decade)) {
    album.genres.push(decade);
  }
}

// ============================================================
// ADD NEW SOUL/FEMALE VOCALIST ALBUMS TO REPLACE REMOVED
// ============================================================
const totalRemoved =
  REMOVE_INDIE_ROCK +
  REMOVE_FUNK +
  REMOVE_PUNK_SHOE +
  REMOVE_ELEC_AMB +
  REMOVE_LATINO;
console.log("Total genres removed:", totalRemoved);

// New soul/female vocalist albums to add
const newAlbums: RawAlbum[] = [
  // Female Vocalist Soul/R&B albums (at least 15)
  {
    artist: "Aretha Franklin",
    title: "Amazing Grace",
    year: 1972,
    genres: ["Gospel Soul", "Soul", "R&B", "Live Album", "Female Vocalist", "1970s"],
    duration: 55,
    description:
      "The best-selling gospel album of all time — Aretha at her most transcendent in a Baptist church.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Gladys Knight & the Pips",
    title: "Imagination",
    year: 1973,
    genres: ["Soul", "R&B", "Smooth Soul", "Female Vocalist", "1970s"],
    duration: 38,
    description:
      "Midnight Train to Georgia and a string of silky, story-driven soul classics.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Patti LaBelle",
    title: "I'm in Love Again",
    year: 1983,
    genres: ["R&B", "Soul", "Dance-Pop", "Female Vocalist", "1980s"],
    duration: 42,
    description: "A triumphant comeback — 'If Only You Knew' and powerhouse vocals.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Chaka Khan",
    title: "Naughty",
    year: 1980,
    genres: ["Funk", "R&B", "Soul", "Disco", "Female Vocalist", "1980s"],
    duration: 40,
    description:
      "Rufus frontwoman's solo debut — 'Clouds' and genre-blurring funk-soul.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Teena Marie",
    title: "Irons in the Fire",
    year: 1980,
    genres: ["R&B", "Soul", "Funk", "Female Vocalist", "1980s"],
    duration: 42,
    description:
      "Ivory's second album — self-produced, multi-instrumentalist blue-eyed soul.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Anita Baker",
    title: "Rapture",
    year: 1986,
    genres: ["R&B", "Quiet Storm", "Smooth Soul", "Jazz-Soul", "Soul", "Female Vocalist", "1980s"],
    duration: 41,
    description: "A warm, sophisticated quiet-storm landmark — 'Sweet Love'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Sade",
    title: "Love Deluxe",
    year: 1992,
    genres: ["Sophisti-Pop", "Smooth Soul", "R&B", "Pop", "Jazz-Pop", "Female Vocalist", "1990s"],
    duration: 55,
    description: "A lush, atmospheric record — 'No Ordinary Love' and 'Cherish the Day'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Whitney Houston",
    title: "The Bodyguard",
    year: 1992,
    genres: ["Pop", "R&B", "Soul", "Pop Soul", "Dance-Pop", "Female Vocalist", "Soundtrack", "1990s"],
    duration: 57,
    description:
      "The best-selling soundtrack ever — 'I Will Always Love You' and pure vocal power.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Mariah Carey",
    title: "Daydream",
    year: 1995,
    genres: ["Pop", "R&B", "Dance-Pop", "Soul", "Female Vocalist", "1990s"],
    duration: 46,
    description: "A glossy, hip-hop-inflected pivot — 'Fantasy' and 'One Sweet Day'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Lauryn Hill",
    title: "The Miseducation of Lauryn Hill",
    year: 1998,
    genres: ["Neo-Soul", "Hip Hop Soul", "R&B", "Soul", "Hip Hop", "Female Vocalist", "1990s"],
    duration: 77,
    description:
      "A landmark fusion of hip-hop, soul and confessional songwriting.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Erykah Badu",
    title: "Mama's Gun",
    year: 2000,
    genres: ["Neo-Soul", "Soul", "Jazz", "Funk", "R&B", "Female Vocalist", "2000s"],
    duration: 70,
    description:
      "A warm, sprawling, J Dilla-touched soul record — her most generous and political.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Jill Scott",
    title: "Who Is Jill Scott?",
    year: 2000,
    genres: ["Neo-Soul", "R&B", "Soul", "Spoken Word", "Hip Hop Soul", "Female Vocalist", "2000s"],
    duration: 70,
    description: "A warm, conversational Philly neo-soul debut — 'A Long Walk'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "India.Arie",
    title: "Acoustic Soul",
    year: 2001,
    genres: ["Neo-Soul", "Soul", "R&B", "Acoustic", "Folk Soul", "Female Vocalist", "2000s"],
    duration: 59,
    description: "A warm, guitar-led neo-soul debut — 'Video'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Alicia Keys",
    title: "Songs in A Minor",
    year: 2001,
    genres: ["Neo-Soul", "R&B", "Soul", "Pop", "Piano Soul", "Female Vocalist", "2000s"],
    duration: 62,
    description: "A classically-trained, piano-led debut — 'Fallin''.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Joss Stone",
    title: "The Soul Sessions",
    year: 2003,
    genres: ["Soul", "R&B", "British Soul", "Female Vocalist", "2000s"],
    duration: 47,
    description: "A teenager's staggering covers of soul classics — 'Super Duper Love'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Corinne Bailey Rae",
    title: "Corinne Bailey Rae",
    year: 2006,
    genres: ["Neo-Soul", "Soul", "Folk Pop", "Jazz-Pop", "Female Vocalist", "2000s"],
    duration: 44,
    description:
      "A bright, idiosyncratic, piano-led indie-soul debut — 'Put Your Records On'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Amy Winehouse",
    title: "Back to Black",
    year: 2006,
    genres: ["Soul", "R&B", "Neo-Soul", "Jazz-Soul", "Pop", "Female Vocalist", "2000s"],
    duration: 35,
    description:
      "A 60s-soul revival masterpiece — 'Rehab' and raw, devastated honesty.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Sharon Jones",
    title: "100 Days, 100 Nights",
    year: 2007,
    genres: ["Soul", "Funk", "Northern Soul", "Neo-Soul", "Deep Soul", "Female Vocalist", "2000s"],
    duration: 42,
    description: "The Dap-Kings-backed, gritty soul revival record.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Solange",
    title: "A Seat at the Table",
    year: 2016,
    genres: ["Neo-Soul", "R&B", "Art Pop", "Funk", "Soul", "Female Vocalist", "2010s"],
    duration: 52,
    description:
      "A serene, assertive record about black identity, exhaustion and empowerment.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "H.E.R.",
    title: "H.E.R.",
    year: 2017,
    genres: ["R&B", "Neo-Soul", "Alternative R&B", "Soul", "Pop", "Female Vocalist", "2010s"],
    duration: 51,
    description: "A confident, guitar-led, Grammy-winning compilation debut.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Jorja Smith",
    title: "Lost & Found",
    year: 2018,
    genres: ["R&B", "Neo-Soul", "Alternative R&B", "Soul", "UK", "Female Vocalist", "2010s"],
    duration: 48,
    description: "A warm, jazz-tinged UK R&B debut — 'Blue Lights'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Celeste",
    title: "Not Your Muse",
    year: 2021,
    genres: ["Soul", "R&B", "Neo-Soul", "Pop", "Female Vocalist", "2020s"],
    duration: 44,
    description: "A warm, sophisticated British soul debut — 'Stop This Flame'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Yola",
    title: "Walk Through Fire",
    year: 2019,
    genres: ["Soul", "Americana", "Country Soul", "Singer-Songwriter", "Folk Rock", "Female Vocalist", "2010s"],
    duration: 44,
    description:
      "A warm, Dan-Auerbach-produced British soul-Americana debut.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Brittany Howard",
    title: "Jaime",
    year: 2019,
    genres: ["Soul", "Rock", "Funk", "Americana", "Singer-Songwriter", "Female Vocalist", "2010s"],
    duration: 39,
    description: "The Alabama Shakes singer's solo debut — fierce and genre-melding.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Victoria Monét",
    title: "Jaguar II",
    year: 2023,
    genres: ["R&B", "Neo-Soul", "Funk", "Disco", "Pop", "Female Vocalist", "2020s"],
    duration: 35,
    description: "A fuller, more ambitious follow-up — 'On My Mama'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Muni Long",
    title: "Public Displays of Affection",
    year: 2022,
    genres: ["R&B", "Neo-Soul", "Soul", "Hip Hop Soul", "Pop", "Female Vocalist", "2020s"],
    duration: 35,
    description: "A sharp, TikTok-broken-through Florida soul debut — 'Hrs & Hrs'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Ari Lennox",
    title: "age/sex/location",
    year: 2022,
    genres: ["R&B", "Neo-Soul", "Soul", "Hip Hop Soul", "Alternative R&B", "Female Vocalist", "2020s"],
    duration: 42,
    description: "A warmer, more textured follow-up to Shea Butter Baby.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Snoh Aalegra",
    title: "FEELS",
    year: 2022,
    genres: ["R&B", "Neo-Soul", "Alternative R&B", "Soul", "Hip Hop Soul", "Female Vocalist", "2020s"],
    duration: 36,
    description: "A warm, sophisticated Swedish-Iranian soul record — 'Lost You'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Lianne La Havas",
    title: "Lianne La Havas",
    year: 2020,
    genres: ["Neo-Soul", "R&B", "Soul", "Folk", "Jazz-Pop", "Female Vocalist", "2020s"],
    duration: 41,
    description: "A warmer, self-produced, self-titled follow-up to Blood.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Cleo Sol",
    title: "Mother",
    year: 2023,
    genres: ["Neo-Soul", "R&B", "Soul", "Gospel", "Art Pop", "Female Vocalist", "2020s"],
    duration: 41,
    description: "A warm, maternal, luminous soul record — healing as sound.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Cleo Sol",
    title: "Gold",
    year: 2023,
    genres: ["Neo-Soul", "Soul", "R&B", "Gospel", "Art Pop", "Female Vocalist", "2020s"],
    duration: 40,
    description: "A warm, radiant, devotional soul record.",
    originalIndex: -1,
    sourceFile: 6,
  },
  // Additional soul/funk/R&B albums (non-female vocalist) to fill remaining slots
  {
    artist: "Curtis Mayfield",
    title: "Curtis",
    year: 1970,
    genres: ["Soul", "Funk", "Psychedelic Soul", "Chicago Soul", "R&B", "1970s"],
    duration: 40,
    description: "The Impressions leader's solo debut — gentle, revolutionary soul.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Isaac Hayes",
    title: "Hot Buttered Soul",
    year: 1969,
    genres: ["Soul", "Smooth Soul", "Funk", "Southern Soul", "Stax Soul", "1960s"],
    duration: 49,
    description:
      "A lavish, long-form soul record — the blueprint for album-oriented soul.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Barry White",
    title: "Can't Get Enough",
    year: 1974,
    genres: ["Soul", "Smooth Soul", "Funk", "Disco", "Quiet Storm", "1970s"],
    duration: 40,
    description:
      "The Love Unlimited Orchestra maestro — lush, deep-voiced seduction.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Marvin Gaye",
    title: "Let's Get It On",
    year: 1973,
    genres: ["Soul", "Smooth Soul", "Funk", "R&B", "Quiet Storm", "1970s"],
    duration: 40,
    description: "Marvin's sensual, lush turn — the bedroom-soul benchmark.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Al Green",
    title: "Call Me",
    year: 1973,
    genres: ["Soul", "Memphis Soul", "Smooth Soul", "R&B", "Gospel Soul", "1970s"],
    duration: 34,
    description:
      "Willie Mitchell's silken Hi Records production wrapping Green's sighing falsetto.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Ann Peebles",
    title: "I Can't Stand the Rain",
    year: 1974,
    genres: ["Soul", "Memphis Soul", "R&B", "Southern Soul", "Funk", "1970s"],
    duration: 35,
    description:
      "Hi Records grit and grace — the title track is a masterpiece of heartbreak.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Otis Redding",
    title: "Otis Blue",
    year: 1965,
    genres: ["Soul", "R&B", "Memphis Soul", "Southern Soul", "Blues Soul", "1960s"],
    duration: 33,
    description: "A raw, powerhouse Stax soul record — passion made permanent.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Sam Cooke",
    title: "Live at the Harlem Square Club",
    year: 1963,
    genres: ["Soul", "Rhythm and Blues", "Gospel Soul", "Live Album", "Southern Soul", "1960s"],
    duration: 34,
    description: "A raw, sweaty live soul set — Cooke as a full-throated shouter.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "The Staple Singers",
    title: "Be Altitude: Respect Yourself",
    year: 1972,
    genres: ["Soul", "Gospel Soul", "Funk", "R&B", "Message Music", "1970s"],
    duration: 38,
    description:
      "Stax gospel-soul family — 'I'll Take You There' and social consciousness.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "The O'Jays",
    title: "Back Stabbers",
    year: 1972,
    genres: ["Soul", "Philadelphia Soul", "R&B", "Smooth Soul", "Disco", "1970s"],
    duration: 36,
    description: "Philly soul with strings and social commentary — the Sound of Philadelphia.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Harold Melvin & the Blue Notes",
    title: "I Miss You",
    year: 1972,
    genres: ["Soul", "Philadelphia Soul", "R&B", "Smooth Soul", "Disco", "1970s"],
    duration: 38,
    description: "Teddy Pendergrass' arrival — lush, aching Philly soul.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Teddy Pendergrass",
    title: "TP",
    year: 1980,
    genres: ["Soul", "R&B", "Smooth Soul", "Philly Soul", "Quiet Storm", "1980s"],
    duration: 41,
    description: "The solo superstar's seductive, lush quiet-storm soul.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Luther Vandross",
    title: "Never Too Much",
    year: 1981,
    genres: ["R&B", "Soul", "Quiet Storm", "Smooth Soul", "Pop Soul", "1980s"],
    duration: 40,
    description: "The velvet-voiced arranger's solo debut — 'Never Too Much'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Alexander O'Neal",
    title: "Hearsay",
    year: 1987,
    genres: ["R&B", "Soul", "Minneapolis Sound", "Quiet Storm", "Dance-Pop", "1980s"],
    duration: 47,
    description: "Jimmy Jam & Terry Lewis production — 'Fake' and 'Criticize'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Loose Ends",
    title: "So Where Are You?",
    year: 1985,
    genres: ["R&B", "Soul", "British Soul", "Post-Disco", "Boogie", "1980s"],
    duration: 40,
    description: "A warm, sophisticated British soul debut — 'Hangin' on a String'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Soul II Soul",
    title: "Club Classics Vol. One",
    year: 1989,
    genres: ["R&B", "Soul", "British Soul", "House", "Dance-Pop", "1980s"],
    duration: 49,
    description: "Jazzie B's collective — 'Back to Life' and UK soul revolution.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Des'ree",
    title: "I Ain't Movin'",
    year: 1994,
    genres: ["R&B", "Soul", "Pop", "Acoustic Soul", "British", "1990s"],
    duration: 48,
    description: "A warm, guitar-led British soul record — 'You Gotta Be'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Omar",
    title: "There's Nothing Like This",
    year: 1991,
    genres: ["R&B", "Soul", "Acid Jazz", "British Soul", "Jazz-Funk", "1990s"],
    duration: 49,
    description:
      "A foundational British neo-soul record — 'There's Nothing Like This'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Maxwell",
    title: "Urban Hang Suite",
    year: 1996,
    genres: ["Neo-Soul", "R&B", "Smooth Soul", "Quiet Storm", "Soul", "1990s"],
    duration: 49,
    description: "A lush, concept-debut quiet-storm record — black velvet.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "D'Angelo",
    title: "Brown Sugar",
    year: 1995,
    genres: ["Neo-Soul", "R&B", "Soul", "Hip Hop Soul", "Jazz-Soul", "1990s"],
    duration: 51,
    description:
      "The debut that helped launch neo-soul — 'Brown Sugar' and 'Lady'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Raphael Saadiq",
    title: "The Way I See It",
    year: 2008,
    genres: ["Neo-Soul", "Soul", "R&B", "Motown Revival", "Pop Soul", "2000s"],
    duration: 41,
    description: "A note-perfect 60s-soul revival record — '100 Yard Dash'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Mayer Hawthorne",
    title: "A Strange Arrangement",
    year: 2009,
    genres: ["Neo-Soul", "Soul", "Blue-Eyed Soul", "Motown Revival", "Pop Soul", "2000s"],
    duration: 41,
    description: "A note-perfect, blue-eyed Motown-soul revival.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Leon Bridges",
    title: "Coming Home",
    year: 2015,
    genres: ["Soul", "R&B", "Retro Soul", "Gospel Soul", "2010s"],
    duration: 35,
    description: "A warm, faithful 60s-soul revival — 'Smooth Sailin'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Leon Bridges",
    title: "Good Thing",
    year: 2018,
    genres: ["Soul", "R&B", "Retro Soul", "Funk", "2010s"],
    duration: 38,
    description: "A brighter, more produced follow-up — 'Bad Bad News'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Durand Jones",
    title: "American Love Call",
    year: 2019,
    genres: ["Soul", "Neo-Soul", "Funk", "Deep Soul", "Indie Soul", "2010s"],
    duration: 46,
    description: "A warm, harmony-rich Indiana soul record — 'Morning in America'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Michael Kiwanuka",
    title: "Love & Hate",
    year: 2016,
    genres: ["Soul", "Folk Rock", "Psychedelic Soul", "Singer-Songwriter", "2010s"],
    duration: 46,
    description:
      "A sweeping, Danger-Mouse-produced soul record — 'Cold Little Heart'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Michael Kiwanuka",
    title: "Kiwanuka",
    year: 2019,
    genres: ["Soul", "Psychedelic Soul", "Folk Rock", "Singer-Songwriter", "2010s"],
    duration: 48,
    description: "A warmer, more self-assured follow-up — 'Hero'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Terrace Martin",
    title: "Velvet Portraits",
    year: 2016,
    genres: ["Neo-Soul", "Jazz-Funk", "Hip Hop Jazz", "Funk", "R&B", "2010s"],
    duration: 41,
    description: "A warm, virtuosic, L.A.-scene record — 'Triangle Ship'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Robert Glasper",
    title: "Black Radio",
    year: 2012,
    genres: ["Jazz", "Neo-Soul", "Hip Hop Jazz", "Jazz-Funk", "R&B", "2010s"],
    duration: 51,
    description:
      "A genre-fusing record bridging jazz, hip-hop and R&B with all-star guests.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Kamasi Washington",
    title: "The Epic",
    year: 2015,
    genres: ["Jazz", "Spiritual Jazz", "Jazz-Funk", "Post-Bop", "Gospel Jazz", "2010s"],
    duration: 172,
    description:
      "A three-hour spiritual jazz epic — choirs, strings and soaring tenor sax.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Mavis Staples",
    title: "You Are Not Alone",
    year: 2010,
    genres: ["Gospel Soul", "Soul", "Americana", "Folk Rock", "2010s"],
    duration: 42,
    description: "Jeff Tweedy-produced — warm, spiritual, late-career triumph.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Mavis Staples",
    title: "If All I Was Was Black",
    year: 2017,
    genres: ["Gospel Soul", "Soul", "Americana", "Protest", "2010s"],
    duration: 38,
    description: "A political, Jeff Tweedy-produced record — 'Little Bit'.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Charles Bradley",
    title: "No Time for Dreaming",
    year: 2011,
    genres: ["Soul", "Funk", "Deep Soul", "Northern Soul", "Neo-Soul", "2010s"],
    duration: 41,
    description:
      "A late-in-life, raw-voiced soul debut — the Screaming Eagle of Soul.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Charles Bradley",
    title: "Changes",
    year: 2016,
    genres: ["Soul", "Funk", "Deep Soul", "Northern Soul", "Neo-Soul", "2010s"],
    duration: 41,
    description:
      "A warmer, more vulnerable follow-up — the title track is a Black Sabbath cover.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Lee Fields",
    title: "Faithful Man",
    year: 2012,
    genres: ["Soul", "Funk", "Neo-Soul", "Northern Soul", "Deep Soul", "2010s"],
    duration: 42,
    description:
      "The veteran soul man's late-career, Truth-and-Soul-produced record.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Sharon Jones",
    title: "I Learned the Hard Way",
    year: 2010,
    genres: ["Soul", "Funk", "Northern Soul", "Neo-Soul", "Deep Soul", "2010s"],
    duration: 42,
    description: "The Dap-Kings-backed, gritty soul revival record.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "The Budos Band",
    title: "The Budos Band III",
    year: 2010,
    genres: ["Afro-Funk", "Instrumental", "Funk", "Soul", "Ethio-Jazz", "2010s"],
    duration: 40,
    description: "A tight, horn-driven Brooklyn Afro-funk record.",
    originalIndex: -1,
    sourceFile: 6,
  },
  {
    artist: "Sharon Jones & the Dap-Kings",
    title: "Give the People What They Want",
    year: 2014,
    genres: ["Soul", "Funk", "Northern Soul", "Neo-Soul", "Deep Soul", "2010s"],
    duration: 38,
    description: "Another Dap-Kings burner — 'Retreat!' and 'Stranger to My Happiness'.",
    originalIndex: -1,
    sourceFile: 6,
  },
];

// Add new albums to the list
for (const newAlbum of newAlbums) {
  albums.push(newAlbum);
}

console.log("Added", newAlbums.length, "new albums");
console.log("Total albums now:", albums.length);

// ============================================================
// WRITE BACK TO RAW FILES
// ============================================================
const albumsBySource: RawAlbum[][] = [[], [], [], [], [], []];
for (const album of albums) {
  if (album.sourceFile >= 1 && album.sourceFile <= 6) {
    albumsBySource[album.sourceFile - 1].push(album);
  } else {
    // New albums go to raw6
    albumsBySource[5].push(album);
  }
}

// Sort each by original index to maintain order (new albums at end)
for (let i = 0; i < 6; i++) {
  albumsBySource[i].sort((a, b) => a.originalIndex - b.originalIndex);
}

// Generate output
function formatAlbum(a: RawAlbum): string {
  const genreStr = a.genres.join("|");
  const desc = a.description.replace(/"/g, '\\"');
  return `  ["${a.artist}", "${a.title}", ${a.year}, "${genreStr}", ${a.duration}, "${desc}"]`;
}

for (let i = 0; i < 6; i++) {
  const fileNum = i + 1;
  const lines = albumsBySource[i].map(formatAlbum).join(",\n");
  const content = `// Compact album tuples: [artist, title, year, "g1|g2|g3|g4|g5", durationMin, "description"]
export const raw${fileNum}: [string, string, number, string, number, string][] = [
${lines}
];`;

  const outputPath = join(__dirname, "..", "src", "data", `raw-${fileNum}.ts`);
  writeFileSync(outputPath, content);
  console.log(`Written raw-${fileNum}.ts (${albumsBySource[i].length} albums)`);
}

console.log("\nDone!");