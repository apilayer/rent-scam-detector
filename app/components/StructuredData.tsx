import { FAQ_DATA } from "@/app/lib/faq";
import { SITE, SITE_URL } from "@/app/lib/site";

/**
 * One JSON-LD `@graph` rather than several loose blocks, so the entities can
 * reference each other by @id and a parser sees one connected description of
 * the page instead of four unrelated ones.
 */
export function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#app`,
        name: SITE.name,
        url: SITE_URL,
        description: SITE.description,
        applicationCategory: "SecurityApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@id": `${SITE.origin}/#org` },
        featureList: [
          "Reverse image search every photo in a rental listing",
          "Find every other page using the same photographs",
          "Compare asking price across duplicate listings",
          "Compare stated location across duplicate listings",
          "Browser extension for portals that block automated requests",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE.name,
        description: SITE.description,
        publisher: { "@id": `${SITE.origin}/#org` },
        inLanguage: "en",
      },
      {
        "@type": "Organization",
        "@id": `${SITE.origin}/#org`,
        name: "APILayer",
        url: "https://apilayer.com/",
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: FAQ_DATA.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
      {
        "@type": "HowTo",
        "@id": `${SITE_URL}/#howto`,
        name: "How to check whether a rental listing is a scam",
        description:
          "Check a rental listing's photographs against the rest of the web before paying a deposit.",
        totalTime: "PT1M",
        step: [
          {
            "@type": "HowToStep",
            name: "Paste the listing link",
            text: "Paste the URL of the rental advert. The tool reads the page and collects every photograph on it.",
          },
          {
            "@type": "HowToStep",
            name: "Let it search the photographs",
            text: "Each photo is reverse image searched, which finds every other page on the web using that same picture.",
          },
          {
            "@type": "HowToStep",
            name: "Read the differences, not the matches",
            text: "Matches alone mean nothing, because agents cross-post. Look at whether the price, the address or the contact details changed between postings.",
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
