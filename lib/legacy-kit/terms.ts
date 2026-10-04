// ---------------------------------------------------------------------------
// The Legacy Kit's draft legal disclaimers, 1–11, copied word for word from
// the owner's WGI Legacy Kit Launch Plan (4 October 2026).
//
// DRAFT FOR ATTORNEY REVIEW. A licensed Georgia attorney must review and
// finalize these before any real sale. Edit here only with the attorney's
// wording; the Terms of Sale page renders exactly this text.
//
// One change from the plan, by the owner's decision of 4 October 2026: of
// the two refund options in disclaimer 11, "all sales are final" was chosen,
// so the alternative is not shown.
// ---------------------------------------------------------------------------

export interface Disclaimer {
  readonly n: number
  readonly title: string
  readonly paras: readonly string[]
}

export const KIT_DISCLAIMERS: readonly Disclaimer[] = [
  {
    n: 1,
    title: "Educational purpose only",
    paras: [
      "The Wiser Generations International Legacy Kit (\"the Kit\") is for general education and family planning only. It is not legal, tax, financial, investment, insurance, medical or mental health advice, and it does not replace advice from licensed professionals who know your situation. Buying or using the Kit does not create an attorney-client, accountant-client, adviser-client or any other professional relationship."
    ],
  },
  {
    n: 2,
    title: "Consult licensed professionals",
    paras: [
      "Before you sign a trust, will, constitution, operating agreement or any other legal document, form a business, buy property or insurance, invest, or open a care service, consult a licensed attorney, CPA, insurance agent or financial professional in your state. The sample constitution, covenant, policies and forms in the Kit are templates only and may not be valid or enforceable as written where you live."
    ],
  },
  {
    n: 3,
    title: "Georgia information; check your state and local rules",
    paras: [
      "State-specific details in the Kit (for example, child care licensing, homeschool rules, personal care homes, Pre-K, police encounters, tax rates and agency phone numbers) reflect Georgia law and resources as of October 2026. Laws, fees, programs and contacts change. If you live outside Georgia or outside the United States, these details may not apply to you. Follow the laws of your own country, state or province, and local government.",
      "Wherever you live, check with your city and county government before acting on anything that involves zoning, building permits, accessory dwellings, home-based businesses, business licenses, home child care or elder care, farming or livestock on your property, short-term rentals, or property taxes. Local rules can be stricter than state law."
    ],
  },
  {
    n: 4,
    title: "No guarantee of results",
    paras: [
      "The Kit describes goals and practices; it does not promise any financial, legal, educational, family or spiritual result. Investments can lose value. Past results and examples, including any dollar amounts, are illustrations only."
    ],
  },
  {
    n: 5,
    title: "Faith content",
    paras: [
      "The Kit is grounded in the Bible and Christian faith. Scripture quotations are from the King James Version. Families are free to use the Kit in a way consistent with their own beliefs; nothing in the Kit requires anyone to adopt a religious practice."
    ],
  },
  {
    n: 6,
    title: "Safety and reporting",
    paras: [
      "Nothing in the Kit, including any rule about privacy or \"moving in silence,\" asks anyone to keep harm secret or delay getting help. In an emergency, call 911. Report suspected child abuse in Georgia to DFCS at 1-855-422-4453, and suspected abuse of an elder or disabled adult to Adult Protective Services at 1-866-552-4464 (option 3). Outside Georgia, contact your state's child and adult protective services. Outside the United States, call your local emergency number or your country's child or elder protection agency. Some professionals are legally required to report abuse."
    ],
  },
  {
    n: 7,
    title: "Resources are not endorsements",
    paras: [
      "Organizations, programs and websites listed in the Kit are provided for convenience. Listing does not mean endorsement, and Wiser Generations International is not responsible for their services, eligibility rules or changes."
    ],
  },
  {
    n: 8,
    title: "Privacy",
    paras: [
      "The Kit includes forms that may hold sensitive information (Social Security numbers, health, finances). Families are responsible for storing their completed forms securely. Wiser Generations International collects only the information needed to process your purchase and deliver the Kit, as described in our Privacy Policy, and does not receive the contents of your completed forms."
    ],
  },
  {
    n: 9,
    title: "License and copyright",
    paras: [
      "© 2026 Wiser Generations International. All rights reserved. Your purchase gives one family a personal, non-transferable license to print and use the Kit for its own household. You may not resell, share, post, or distribute the Kit or its contents. Organizations wishing to distribute the Kit must sign a separate partner license. \"Wiser Generations International\" and \"WGI Legacy Kit\" are trademarks of Wiser Generations International."
    ],
  },
  {
    n: 10,
    title: "Limitation of liability and governing law",
    paras: [
      "To the fullest extent allowed by law, Wiser Generations International and its owners, partners and contributors are not liable for any loss or damage arising from use of the Kit. Our total liability for any claim will not exceed the price you paid for the Kit. These terms are governed by the laws of the State of Georgia."
    ],
  },
  {
    n: 11,
    title: "Refund policy",
    paras: [
      "Because the Kit is a digital download delivered immediately, all sales are final."
    ],
  },
]
