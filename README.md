# Rental Scam Detector

Paste a rental listing URL. The tool reads the advert, reverse image searches
every photograph with [Zenserp](https://zenserp.com), and tells you where else
those exact pictures already appear.

Rental fraud almost always starts the same way: someone lifts the photographs
from a genuine advert and reposts the property cheaper. Finding those photos on
another site is the clearest signal available — and the same check catches the
honest case too, where a real property was listed elsewhere first and has
probably already gone.

Built with **Zenserp**, an [APILayer](https://apilayer.com/) product.

## How it grades

Finding the same photographs on another site is **not** evidence of anything on
its own. Letting agents cross-post the same property to every portal going. What
the tool actually weighs is whether the details on those other pages agree.

| Signal | Weight | Why |
| --- | --- | --- |
| Same photos, price differs by 35%+ | up to 50 | Two adverts for the same rooms at very different rents. One of them is lying |
| Same photos, different location | up to 50 | The same rooms advertised somewhere else entirely |
| Payment demanded before viewing | 20 | Defining move of advance-fee fraud |
| Untraceable payment method | 18 | Wire transfer, crypto, gift cards |
| Landlord claims to be abroad | 16 | Explains away the missing viewing |
| Viewing refused | 16 | No legitimate landlord refuses |
| Keys to be posted | 14 | Follows the "abroad" story |
| Free email as contact | 8 | Agencies use their own domain |
| Manufactured urgency | 6 | Pressure to pay before thinking |

When the photos turn up elsewhere but the price and place agree, that is
reported as a normal cross-post and scores nothing. It still answers the other
question this tool is for: the property is advertised widely and may already be
gone.

Every finding is listed with the evidence behind it and what it contributed, and
each matching page carries its own reasons, so the verdict can be argued with
rather than taken on faith.

A hit on the listing's **own** domain is expected and ignored. Only matches on
other hosts count.

### Comparing rents honestly

Weekly and monthly adverts are both common, so every figure is converted to a
monthly equivalent before anything is compared. `£340/wk` against `£1,400 pcm`
is a 5% difference, not a 75% one.

Where a period is missing the comparison is refused rather than guessed. A bare
`£325` next to `£340/wk` is almost certainly also weekly; treating it as monthly
would manufacture a 78% discount and invent exactly the red flag this tool is
supposed to find honestly.

## Running it

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example`:

```bash
ZENSERP_API_KEY=        # https://app.zenserp.com/register
ZENSERP_TIMEOUT_MS=     # optional, default 90000
```

## Things worth knowing

- **A reverse image lookup takes ~30–60 seconds.** Zenserp drives a real search
  engine behind the scenes. Measured latency on the same image varied between 28s
  and 53s. Searches run concurrently, so the whole analysis is roughly as slow as
  the slowest single photo rather than the sum — but it is still a slow request,
  and the UI narrates the wait instead of hiding it.
- **`maxDuration` is set to 120s** on the route. Hosts that honour it (Vercel)
  will allow the full analysis; a 10-second serverless ceiling will cut it off.
- **Only the first four photographs are searched.** One Zenserp call per photo
  is the expensive part, galleries repeat the same rooms, and a scammer who
  lifted one picture lifted the set. Images are ranked before selection —
  structured data and Open Graph first, then page markup — so the four searched
  are the actual listing photos, not interface furniture.
- **Some portals block automated requests.** A 403 is reported plainly rather
  than being passed off as a clean result.
- **A clean result is not a guarantee.** It means nothing surfaced, not that the
  listing is safe. Always view a property in person before paying anything.
