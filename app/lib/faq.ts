export interface IFaqItem {
  id: string;
  question: string;
  answer: string;
}

/**
 * Shared by the FAQ section and the structured data, so what a reader sees and
 * what an answer engine quotes cannot drift apart.
 */
export const FAQ_DATA: IFaqItem[] = [
  {
    id: "faq-1",
    question: "How do I know if a rental listing is a scam?",
    answer:
      "The strongest signal is the photographs. Scammers rarely take their own, so they lift them from a real advert somewhere else. This tool reverse image searches every photo on the listing and shows you every other page using those same pictures. Finding the property elsewhere is not proof of anything on its own, because agents cross-post constantly. What matters is whether the price, the address or the contact details changed between postings.",
  },
  {
    id: "faq-2",
    question: "Is cross-posting the same as a scam?",
    answer:
      "No, and treating it that way is the most common mistake. Letting agents list the same property on several portals at once, which is normal and expected. A listing appearing in five places is unremarkable. The same rooms advertised at half the price, in a different city, or by a different person is what a scam looks like.",
  },
  {
    id: "faq-3",
    question: "What does the tool actually check?",
    answer:
      "It reads the advert, extracts the photographs, and reverse image searches each one through Zenserp, which is driven by Google Lens. For every other page using those images it compares the asking price, the stated location and the listing date against the one you gave it. You get the reasons alongside the links, so you can judge the evidence yourself rather than trusting a score.",
  },
  {
    id: "faq-4",
    question: "Why does a cheaper price mean something is wrong?",
    answer:
      "A deposit scam works by making the property irresistible. If the same rooms are advertised elsewhere at the market rate and the listing in front of you is far below it, the cheap one is usually the fake. The tool only compares prices that are genuinely comparable, so a weekly rate is never measured against a monthly one.",
  },
  {
    id: "faq-5",
    question: "The site blocked the tool. What now?",
    answer:
      "Some portals refuse automated requests outright and return a 403. When that happens you have two options: upload the photographs directly along with the page they came from, or install the browser extension, which reads the listing you are already looking at so the portal sees an ordinary visit.",
  },
  {
    id: "faq-6",
    question: "What is Zenserp?",
    answer:
      "Zenserp is a search engine results API from APILayer. It returns Google, Bing and Google Lens results as structured JSON, including reverse image search, which is what this tool uses to find every other page carrying a listing's photographs.",
  },
  {
    id: "faq-7",
    question: "Does this guarantee a listing is safe?",
    answer:
      "No. It finds a specific and very common kind of fraud, the kind that reuses photographs from a genuine advert. A listing with original photographs and no matches elsewhere can still be a scam. Never pay a deposit for a property you have not seen, never send money by bank transfer to someone you have not met, and treat pressure to pay quickly as the warning it is.",
  },
];
