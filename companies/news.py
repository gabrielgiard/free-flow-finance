"""Recent developments shown on each company's Thesis tab.

From a source-checked news review covering 1 August to 30 October 2026,
including the Q3 2026 earnings season (Model update 3).
Each item: d = date, h = one-line summary in our words, u = source.
Refresh by re-running the review; keep at most four items a company.
"""

NEWS_ASOF = "2026-10-30"

NEWS = {
 "NVDA": [
  {
   "d": "2026-09-14",
   "h": "Nvidia fell about 3% as chip stocks sold off after Anthropic CEO Dario Amodei's essay calling for AI development to be paced",
   "u": "https://www.forbes.com/sites/rahuldogra/2026/09/18/the-ai-pacing-debate-goes-mainstream-after-amodei-altman-and-musk-all-agree-to-slow-down/"
  },
  {
   "d": "2026-08-26",
   "h": "Q2 FY27 revenue $96.2bn, up 106%; data-centre revenue $89.0bn, up 117%; 75.0% gross margin; Q3 guided to $108bn at 74% gross margin",
   "u": "https://www.sec.gov/Archives/edgar/data/0001045810/000104581026000073/q2fy27pr.htm"
  }
 ],
 "TSM": [
  {
   "d": "2026-10-15",
   "h": "Q3 revenue US$46.7bn, up 41% in dollars; net income up 69%; 66.4% gross margin; Q4 guided to US$52.3-54.3bn",
   "u": "https://www.sec.gov/Archives/edgar/data/0001046179/000104617926000726/a3q26e_withguidancexfinal.htm"
  },
  {
   "d": "2026-10-05",
   "h": "Musk said TSMC is in early discussions to join his Terafab chip venture in Texas; TSM rose about 2.5% while Intel fell",
   "u": "https://finance.yahoo.com/markets/stocks/articles/intel-drops-musk-signals-tsmc-151956208.html"
  },
  {
   "d": "2026-09-10",
   "h": "August 2026 revenue NT$514.8bn, up 10.1% month on month and 53.3% year on year; January-August revenue up 39.3%",
   "u": "https://pr.tsmc.com/english/news/3340"
  }
 ],
 "AVGO": [
  {
   "d": "2026-09-02",
   "h": "8-K: Q3 FY26 non-GAAP EPS $3.32, free cash flow $13.7bn; infrastructure software revenue $8.8bn, up 29%",
   "u": "https://www.sec.gov/Archives/edgar/data/0001730168/000173016826000076/avgo-08022026x8kxex99.htm"
  },
  {
   "d": "2026-09-02",
   "h": "Fiscal Q3 revenue $29.6bn (est. $29.43bn), up 86%; AI semiconductor revenue $16.7bn, up 221%; Q4 AI revenue guided to $21.7bn",
   "u": "https://www.constellationr.com/insights/news/broadcom-reports-strong-q3-sees-ai-chip-revenue-accelerating-q4"
  }
 ],
 "AMD": [
  {
   "d": "2026-10-02",
   "h": "AMD shares rose 30% in September on AI-agent CPU demand after Meta's Muse launch, the World Labs deal and analyst upgrades",
   "u": "https://www.fool.com/investing/2026/10/02/why-amd-stock-jumped-30-in-september/"
  },
  {
   "d": "2026-09-29",
   "h": "AMD agreed to acquire World Labs, the 3D world-model start-up co-founded by Fei-Fei Li, for $8.2bn in stock",
   "u": "https://247wallst.com/investing/2026/09/29/amd-pays-8-2-billion-in-stock-for-non-chipmaking-startup-as-ceo-bets-on-physical-ai/"
  },
  {
   "d": "2026-08-04",
   "h": "Q2 2026 revenue $11.5bn, up 50%; data-centre revenue $6.7bn, up 107%; Anthropic to deploy up to 2GW of MI450",
   "u": "https://www.sec.gov/Archives/edgar/data/0000002488/000000248826000121/q22026991.htm"
  }
 ],
 "MU": [
  {
   "d": "2026-09-30",
   "h": "8-K: FY2026 revenue $133.19bn; Q4 non-GAAP EPS $33.42; Q1 FY27 guide 86.25% gross margin and $38.15 EPS",
   "u": "https://www.sec.gov/Archives/edgar/data/0000723125/000072312526000018/a2026q4ex991-pressrelease.htm"
  }
 ],
 "INTC": [
  {
   "d": "2026-10-29",
   "h": "Q3 revenue $16.5bn, up 21%; data-centre and AI revenue $7.3bn, up 78%; Intel Foundry $6.7bn, up 58%; Q4 guided to $15-16bn",
   "u": "https://www.verdict.co.uk/intel-q3-2026-results/"
  },
  {
   "d": "2026-10-05",
   "h": "Intel fell about 2% after Musk said TSMC is in talks to join Terafab, where Intel's 14A was the only named process",
   "u": "https://finance.yahoo.com/markets/stocks/articles/intel-drops-musk-signals-tsmc-151956208.html"
  },
  {
   "d": "2026-09-14",
   "h": "Intel dropped about 7% to $96 in the chip selloff after Anthropic's Amodei called for pacing frontier AI",
   "u": "https://www.forbes.com/sites/rahuldogra/2026/09/18/the-ai-pacing-debate-goes-mainstream-after-amodei-altman-and-musk-all-agree-to-slow-down/"
  },
  {
   "d": "2026-09-02",
   "h": "CFO Zinsner said external 14A customer engagements have significantly increased; no deal announced; risk production 2027, volume 2028",
   "u": "https://bits-chips.com/article/intel-signals-external-customer-wins-for-14a-foundry-process/"
  }
 ],
 "ASML": [
  {
   "d": "2026-10-14",
   "h": "Record Q3 net sales of €11.7bn at a 57.5% gross margin; 2026 guided to €44-45bn and supply for 2027-28 said to fall short of demand",
   "u": "https://www.sec.gov/Archives/edgar/data/0000937966/000162828026065813/pressreleasefinancialresul.htm"
  },
  {
   "d": "2026-09-20",
   "h": "Reuters: TSMC plans High-NA EUV in high-volume production from 2030; ASML targets larger-mask pilot line in 2031 for ~40% productivity gain",
   "u": "https://finance.yahoo.com/technology/ai/articles/asml-asml-chip-giants-tsmc-214129428.html"
  },
  {
   "d": "2026-09-14",
   "h": "ASML fell 5% to $1,606.66 as equipment stocks sold off after Anthropic's call to pace frontier AI",
   "u": "https://247wallst.com/investing/2026/09/14/chip-equipment-stocks-slide-as-ai-pacing-call-reaches-fab-spending"
  },
  {
   "d": "2026-09-13",
   "h": "Reuters: ASML extends chipmaking dominance as customers embrace High NA",
   "u": "https://www.reuters.com/world/asia-pacific/asml-extends-chipmaking-dominance-customers-embrace-high-na-2026-09-14/"
  }
 ],
 "AMAT": [
  {
   "d": "2026-09-28",
   "h": "Morgan Stanley cut its Applied Materials price target by $79 while raising 2027 revenue and EPS forecasts",
   "u": "https://seekingalpha.com/news/4647542-morgan-stanley-cuts-applied-materials-price-target-by-79"
  },
  {
   "d": "2026-09-14",
   "h": "Applied fell 6% to $429.71 after Anthropic's pacing call, having already dropped 22% over the prior month",
   "u": "https://247wallst.com/investing/2026/09/14/chip-equipment-stocks-slide-as-ai-pacing-call-reaches-fab-spending"
  },
  {
   "d": "2026-08-13",
   "h": "Applied reported record non-GAAP EPS of $3.50, up 41%, and record operating cash flow of $3.04bn",
   "u": "https://ir.appliedmaterials.com/news-releases/news-release-details/applied-materials-announces-third-quarter-2026-results"
  },
  {
   "d": "2026-08-13",
   "h": "Fiscal Q3 revenue $9.12bn (est. $9.02bn), up 25%; Q4 guided to $10.25bn midpoint vs $9.62bn consensus; DRAM revenue up 52%",
   "u": "https://futurumgroup.com/insights/applied-materials-q3-fy-2026-advanced-packaging-and-dram-accelerate-growth/"
  }
 ],
 "LRCX": [
  {
   "d": "2026-10-21",
   "h": "September-quarter revenue $8.22bn, up about 54% year on year; 52.3% gross margin; December quarter guided to $8.6bn",
   "u": "https://www.sec.gov/Archives/edgar/data/0000707549/000070754926000052/lrcx_exhibitx991xq1x2027.htm"
  },
  {
   "d": "2026-09-18",
   "h": "Lam rose nearly 7% to $288.11, reversing some of the mid-September equipment selloff",
   "u": "https://seekingalpha.com/news/4644525-lam-research-advances-7-reversing-some-recent-losses"
  },
  {
   "d": "2026-09-14",
   "h": "Lam fell 6% to $279.18 as equipment stocks slid after Anthropic's call to pace frontier AI",
   "u": "https://247wallst.com/investing/2026/09/14/chip-equipment-stocks-slide-as-ai-pacing-call-reaches-fab-spending"
  }
 ],
 "ARM": [
  {
   "d": "2026-09-28",
   "h": "Arm fell 9% to $282.46, about twice peers' decline, with the SoftBank margin-loan link cited as extra pressure",
   "u": "https://247wallst.com/investing/2026/09/28/arm-sinks-9-as-chip-selloff-deepens-qualcomm-drops-6-marvell-slides-5/"
  },
  {
   "d": "2026-09-17",
   "h": "SoftBank raised its Arm-backed margin loan to $25bn from $20bn, pledging 769m Arm shares, to fund AI investments",
   "u": "https://finance.yahoo.com/technology/ai/articles/softbank-raises-arm-margin-loan-054546224.html"
  }
 ],
 "TXN": [
  {
   "d": "2026-10-21",
   "h": "Q3 revenue $6.06bn, up 28%; analog up 32%; gross margin 64.2%; Q4 guided to $5.8-6.3bn",
   "u": "https://stockhub.kr/en/insights/20261022-txn-cy26q3"
  },
  {
   "d": "2026-08-01",
   "h": "Julie Knecht became CFO, succeeding Rafael Lizardi, who stayed as adviser through August",
   "u": "https://www.nasdaq.com/articles/texas-instruments-appoints-julie-knecht-succeed-rafael-lizardi-cfo"
  }
 ],
 "QCOM": [
  {
   "d": "2026-10-05",
   "h": "Qualcomm signed a multi-year patent cross-licence with Huawei covering 5G, AI and computing",
   "u": "https://www.marketscreener.com/news/qualcomm-huawei-sign-multi-year-patent-licensing-agreement-ce785ddbde8ef120"
  },
  {
   "d": "2026-09-28",
   "h": "Qualcomm fell 6% to $189.14 in a broader chip selloff driven by oil-led inflation worries and profit-taking",
   "u": "https://247wallst.com/investing/2026/09/28/arm-sinks-9-as-chip-selloff-deepens-qualcomm-drops-6-marvell-slides-5/"
  },
  {
   "d": "2026-09-24",
   "h": "Qualcomm extended its global patent licence with Apple from 1 April 2027; term not disclosed and unrelated to modem supply",
   "u": "https://9to5mac.com/2026/09/24/apple-and-qualcomm-renew-global-patent-licensing-agreement/"
  },
  {
   "d": "2026-09-08",
   "h": "Qualcomm announced a multi-generational collaboration with AWS on custom AI data-centre silicon and optical connectivity",
   "u": "https://finance.yahoo.com/technology/ai/articles/qualcomm-announces-multi-generational-product-130000757.html"
  }
 ],
 "KLAC": [
  {
   "d": "2026-10-28",
   "h": "September-quarter revenue $4.14bn, up about 29%; December quarter guided to $4.7bn ± $0.2bn",
   "u": "https://finviz.com/news/410498/kla-corporation-reports-fiscal-2027-first-quarter-results"
  }
 ],
 "MSFT": [
  {
   "d": "2026-10-28",
   "h": "Fiscal Q1 revenue $92.3bn, up 19%; Azure up 48% to $33.2bn; capital spending $39.4bn, about double a year earlier",
   "u": "https://www.aichatdaily.com/ai-business/microsoft-revenue-rises-19-92-3b-azure-grows"
  },
  {
   "d": "2026-10-05",
   "h": "Melius Research upgraded Microsoft to buy, arguing AI-safety fears make it the trusted enterprise vendor",
   "u": "https://www.msn.com/en-us/technology/artificial-intelligence/microsoft-is-the-adult-in-charge-on-fears-over-ai-security-stock-gets-upgraded-to-buy/ar-AA2dBJYk"
  },
  {
   "d": "2026-09-30",
   "h": "Barron's: Microsoft shares up about 39% in the July-September quarter, one of their best quarters in decades",
   "u": "https://www.msn.com/en-us/news/other/microsoft-stock-is-having-its-best-quarter-since-1991/ar-AA2di1ox"
  },
  {
   "d": "2026-09-25",
   "h": "Microsoft rose about 4% to $516.17 after revamping Copilot with coding tools and a persistent AI agent",
   "u": "https://www.fool.com/coverage/stock-market-today/2026/09/25/stock-market-today-sept-25-microsoft-stock-jumps-4-after-revamping-copilot-with-code-generation-and-agentic-ai-tools/"
  }
 ],
 "GOOGL": [
  {
   "d": "2026-10-28",
   "h": "Q3 revenue $127.6bn, up 25%; Google Cloud up 103% to $30.7bn; capex $51.4bn; shares fell about 8% after hours on an EPS miss and negative free cash flow",
   "u": "https://www.xtb.com/en/market-analysis/alphabet-disappoints-wall-street-despite-record-results-shares-plunge-over-8-and-test-300"
  },
  {
   "d": "2026-09-16",
   "h": "Judge Brinkema rejected an ad-tech breakup, ordering six years of auction-rule changes and a compliance monitor; Google to appeal liability",
   "u": "https://www.thestar.com.my/tech/tech-news/2026/09/17/google-should-relax-ad-tech-rules-appoint-antitrust-monitor-us-judge-finds"
  },
  {
   "d": "2026-08-14",
   "h": "Alphabet closed a $25bn ten-tranche bond sale maturing 2028-2066; 2026 capex guided at $195-205bn",
   "u": "https://www.fool.com/investing/2026/08/14/alphabet-just-borrowed-25-billion-and-25-billion-o/"
  },
  {
   "d": "2026-08-05",
   "h": "Shares fell 5.4% as Jeff Dean left to found Discovery Loop and Demis Hassabis stepped back from running DeepMind day to day",
   "u": "https://finance.yahoo.com/technology/ai/articles/alphabet-shares-fall-5-ai-164713908.html"
  }
 ],
 "AMZN": [
  {
   "d": "2026-10-29",
   "h": "Q3 net sales $201.9bn, up 12%; AWS up 39% to $46.0bn with a $578bn backlog; Q4 guided to $240-247bn; 2026 capex about $220bn",
   "u": "https://www.datastudios.org/post/amazon-q3-2026-results-aws-39-percent-growth-46-billion-220-billion-capex"
  },
  {
   "d": "2026-09-26",
   "h": "Anthropic reported to be preparing an IPO as soon as October 2026; Amazon's stake was carried at $190.4bn by June 2026",
   "u": "https://finance.yahoo.com/technology/ai/articles/anthropics-ipo-300-billion-test-014700775.html"
  },
  {
   "d": "2026-09-25",
   "h": "Amazon shares slipped after Anthropic signed a seven-year, $11.6bn cloud infrastructure agreement with Akamai rather than AWS",
   "u": "https://finance.yahoo.com/markets/stocks/articles/amazon-stocks-move-lower-anthropic-181534479.html"
  },
  {
   "d": "2026-08-31",
   "h": "FTC and 22 states sued Amazon, alleging it inflated ad auction prices for over 1.2 million advertisers, generating more than $20bn since 2018",
   "u": "https://www.axios.com/2026/08/31/ftc-amazon-deceptive-advertising-lawsuit"
  }
 ],
 "META": [
  {
   "d": "2026-10-21",
   "h": "Q3 revenue $64.6bn, up 26%; a $9.9bn charge for an agreement with state attorneys general; 2026 capex now $135-145bn; Q4 guided to $73-76bn",
   "u": "https://www.hl.co.uk/shares/share-research/meta-q3-results-strong-quarter-spending-still-a-question"
  },
  {
   "d": "2026-09-30",
   "h": "Meta shares rose nearly 25% in September 2026, lifting the forward P/E from about 18 to about 23",
   "u": "https://www.fool.com/investing/2026/09/30/meta-platforms-is-up-nearly-25-in-september-does-i/"
  },
  {
   "d": "2026-09-10",
   "h": "JPMorgan upgraded Meta to overweight from neutral and raised its December 2027 target to $820 from $640, citing Muse traction",
   "u": "https://api.advisorperspectives.com/articles/2026/09/10/meta-upgraded-jpmorgan-muse-highlights-ai"
  },
  {
   "d": "2026-09-09",
   "h": "Meta launched Muse, a personal AI agent in the US across apps and WhatsApp, with free, $20 and $100 monthly tiers",
   "u": "https://www.techrepublic.com/article/news-meta-muse-ai-agent-us-launch/"
  }
 ],
 "ORCL": [
  {
   "d": "2026-09-11",
   "h": "Oracle shares rose about 7% after hours as adjusted EPS of $1.92 beat the $1.74 consensus and RPO hit a record $664bn",
   "u": "https://cryptobriefing.com/oracle-shares-climb-strong-quarterly-results/"
  },
  {
   "d": "2026-09-10",
   "h": "Q1 FY27 revenue rose 30% to $19.35bn, cloud infrastructure up 121% to $7.4bn; FY27 guidance raised to at least $90bn",
   "u": "https://www.verdict.co.uk/oracle-q1-fy27-results/?.tsrc=rss"
  }
 ],
 "CRM": [
  {
   "d": "2026-09-10",
   "h": "Salesforce completed its acquisition of Fin (formerly Intercom), an AI customer-service agent used by over 30,000 companies",
   "u": "https://www.stocktitan.net/news/CRM/salesforce-completes-acquisition-of-i2z0rp51ivor.html"
  },
  {
   "d": "2026-09-08",
   "h": "Salesforce shares rose about 40% in August 2026 after the Q2 beat and a guidance raise",
   "u": "https://www.fool.com/investing/2026/09/08/why-salesforce-stock-skyrocketed-40-last-month/"
  },
  {
   "d": "2026-08-26",
   "h": "Q2 FY27 revenue $11.3bn, up 11%; non-GAAP EPS $5.90 vs $3.27 expected; FY27 revenue guidance raised to $46.1-46.4bn",
   "u": "https://investor.salesforce.com/news/news-details/2026/Salesforce-Delivers-Record-Second-Quarter-Fiscal-2027-Results/"
  },
  {
   "d": "2026-08-26",
   "h": "Salesforce and Anthropic announced Claudeforce, bringing Claude into Salesforce with prebuilt sales skills",
   "u": "https://www.stocktitan.net/news/CRM/salesforce-and-anthropic-announce-claudeforce-the-1-ai-meets-the-1-7qvd44i1rf5f.html"
  }
 ],
 "NOW": [
  {
   "d": "2026-10-28",
   "h": "Q3 subscription revenue $3.99bn, up 21%; cRPO up 20.5%; full-year subscription guidance raised, though shares fell after hours",
   "u": "https://www.tradingkey.com/news/earnings/262248853-tradingkey"
  },
  {
   "d": "2026-09-03",
   "h": "ServiceNow rallied about 28% in a month on a sector-wide software re-rating rather than company-specific news",
   "u": "https://247wallst.com/investing/2026/09/03/servicenow-just-rallied-28-in-a-month-take-profits-or-buy-more/"
  },
  {
   "d": "2026-08-25",
   "h": "Shares closed at $127.23 after a 29% monthly gain; Q3 guidance implies about 20.5% subscription growth versus 24% in Q2",
   "u": "https://247wallst.com/investing/2026/08/25/servicenow-just-ripped-29-in-a-month-what-would-it-take-to-get-now-stock-up-to-150/"
  }
 ],
 "PLTR": [
  {
   "d": "2026-09-01",
   "h": "Palantir to deliver eight TITAN systems to the US Army",
   "u": "https://www.stocktitan.net/news/PLTR/palantir-to-deliver-eight-titan-systems-to-the-u-s-dak2l8pmoile.html"
  },
  {
   "d": "2026-08-03",
   "h": "Q2 2026 revenue $1.935bn, up 93%; US commercial up 149%; FY26 revenue guidance raised to $8.150-8.158bn",
   "u": "https://www.stocktitan.net/news/PLTR/palantir-reports-q2-2026-u-s-comm-revenue-growth-of-149-y-y-and-c8762wptyyap.html"
  }
 ],
 "SAP": [
  {
   "d": "2026-10-21",
   "h": "First €10bn quarter: Q3 revenue €10.27bn, up 13%; cloud revenue up 26% to €6.67bn; current cloud backlog €24.1bn, up 28%",
   "u": "https://finviz.com/news/405805/sap-quarterly-statement-q3-2026"
  }
 ],
 "NFLX": [
  {
   "d": "2026-10-20",
   "h": "Q3 revenue $12.9bn, up 12%; 34.6% operating margin; 2026 ad revenue outlook cut to about $2.7bn from $3bn",
   "u": "https://www.sec.gov/Archives/edgar/data/0001065280/000106528026000290/ex991_q326.htm"
  },
  {
   "d": "2026-09-14",
   "h": "Netflix will report Q3 2026 results on 20 October 2026",
   "u": "https://www.stocktitan.net/news/NFLX/netflix-to-announce-third-quarter-2026-financial-0fe0cycgv379.html"
  }
 ],
 "ADBE": [
  {
   "d": "2026-09-10",
   "h": "Q3 FY26 revenue a record $6.76bn, up 13%; AI-first ARR up over 150%; full-year revenue and EPS targets raised",
   "u": "https://www.stocktitan.net/news/ADBE/adobe-reports-record-q3-eqfptdv2yclp.html"
  },
  {
   "d": "2026-09-03",
   "h": "Adobe named Anil Chakravarthy president and CEO from 1 December 2026; Shantanu Narayen becomes executive chair",
   "u": "https://www.stocktitan.net/news/ADBE/adobe-announces-anil-chakravarthy-to-become-president-and-ceo-and-1ltssoek0r57.html"
  }
 ],
 "UBER": [
  {
   "d": "2026-09-16",
   "h": "Costco expanded Uber Eats delivery nationwide to 47 states, up from 17, covering nearly 600 warehouses",
   "u": "https://www.stocktitan.net/news/UBER/costco-expands-nationwide-delivery-on-uber-f8b03h7bx1fq.html"
  },
  {
   "d": "2026-08-27",
   "h": "Uber published its offer document for Delivery Hero at €41.50 a share in cash; acceptance period runs to 5 November 2026",
   "u": "https://www.stocktitan.net/news/UBER/uber-publishes-offer-document-for-its-takeover-offer-for-delivery-f3cvah7wqte6.html"
  },
  {
   "d": "2026-08-19",
   "h": "Uber launched autonomous rides in Zagreb, its first in Europe, using Pony.ai robotaxis",
   "u": "https://www.stocktitan.net/news/PONY/uber-launches-autonomous-rides-in-7xu3wxrsoi78.html"
  },
  {
   "d": "2026-08-05",
   "h": "Q2 2026 gross bookings $58.0bn, up 24%; free cash flow $2.8bn; Q3 bookings guided to $58.25-60.25bn",
   "u": "https://www.stocktitan.net/news/UBER/uber-announces-results-for-second-quarter-nyhc6z8uh8yu.html"
  }
 ],
 "SHOP": [
  {
   "d": "2026-08-05",
   "h": "Q2 2026 revenue $3.58bn, up 34%; GMV $115.6bn, up 32%; free cash flow margin 18%; Q3 revenue growth guided to low thirties",
   "u": "https://www.stocktitan.net/news/SHOP/shopify-delivers-big-30-growth-across-gmv-revenue-gross-profit-and-dqmmv16ho9oq.html"
  }
 ],
 "CRWD": [
  {
   "d": "2026-09-02",
   "h": "CrowdStrike and OpenAI expanded their partnership; Falcon also added to the Anthropic Claude marketplace",
   "u": "https://ir.crowdstrike.com/news-releases/news-release-details/crowdstrike-and-openai-expand-partnership-secure-agentic-era"
  },
  {
   "d": "2026-08-26",
   "h": "Q2 FY27 revenue $1.47bn, up 26%; record net new ARR $333m; ending ARR $5.84bn, up 25%; FY27 guidance raised",
   "u": "https://ir.crowdstrike.com/news-releases/news-release-details/crowdstrike-reports-second-quarter-fiscal-year-2027-financial"
  }
 ],
 "LLY": [
  {
   "d": "2026-10-29",
   "h": "Q3 revenue up 39% to $24.4bn as Mounjaro reaches $10.7bn and Zepbound $5.4bn; 2026 revenue guide raised to $91bn-$92bn",
   "u": "https://www.stocktitan.net/articles/eli-lilly-q3-2026-earnings-mounjaro-zepbound"
  },
  {
   "d": "2026-09-29",
   "h": "Phase 3 TRIUMPH-2: retatrutide produced up to 20.8% weight loss at 80 weeks in type 2 diabetes; US filing planned Q1 2027",
   "u": "https://www.stocktitan.net/news/LLY/lilly-s-triple-agonist-retatrutide-delivered-substantial-weight-loss-ib5k8uwks8bp.html"
  },
  {
   "d": "2026-09-11",
   "h": "Lilly completed its acquisition of AtaiBeckley, adding rapid-acting treatments for treatment-resistant depression",
   "u": "https://www.stocktitan.net/news/LLY/lilly-completes-acquisition-of-atai-beckley-to-advance-therapies-for-lx81n7cm9p3s.html"
  },
  {
   "d": "2026-08-31",
   "h": "Lilly agreed to acquire Merida Biosciences for up to $2.875bn in cash, including milestones",
   "u": "https://www.stocktitan.net/news/LLY/lilly-to-acquire-merida-biosciences-to-advance-treatments-for-uzrhnbx0jyuh.html"
  }
 ],
 "JNJ": [
  {
   "d": "2026-10-13",
   "h": "Q3 sales up 5.9% to $25.4bn on MedTech growth; 2026 guidance raised to $101.0bn-$101.4bn of sales and $11.05-$11.15 adjusted EPS",
   "u": "https://finviz.com/news/401782/johnson-johnson-beats-third-quarter-earnings-estimates-and-raises-2026-revenue-and-profit-outlook"
  },
  {
   "d": "2026-09-25",
   "h": "Five-year data showed a single Carvykti infusion gave treatment-free remission in 50% of early-line relapsed myeloma patients",
   "u": "https://www.jnj.com/media-center/press-releases/single-infusion-of-carvykti-ciltacabtagene-autoleucel-delivered-five-year-treatment-free-remissions-in-50-of-patients-in-early-line-relapsed-refractory-multiple-myeloma"
  },
  {
   "d": "2026-09-21",
   "h": "Caplyta showed significant improvement in bipolar mania in a pivotal Phase 3 study",
   "u": "https://www.jnj.com/media-center/press-releases/caplyta-lumateperone-shows-significant-and-rapid-improvement-in-bipolar-mania-in-pivotal-phase-3-study"
  }
 ],
 "NVO": [
  {
   "d": "2026-09-29",
   "h": "Novo licensed Hengrui's oral GLP-1/GIP candidate HRS-1596 in a deal worth up to $2.6bn",
   "u": "https://www.stocktitan.net/news/NVO/novo-and-hengrui-pharma-enter-exclusive-license-agreement-for-once-c0i2mswchmis.html"
  },
  {
   "d": "2026-09-21",
   "h": "Capital Markets Day set 2026-2030 revenue growth in line with peers; shares closed 7.91% lower",
   "u": "https://www.stocktitan.net/news/NVO/highlights-to-be-presented-at-novo-s-capital-markets-day-04fh69xai2ck.html"
  },
  {
   "d": "2026-09-21",
   "h": "CagriSema beat tirzepatide 5 mg in REIMAGINE 5, 12.4% vs 9.1% weight loss at 60 weeks; FDA decision expected Q4 2026",
   "u": "https://www.stocktitan.net/news/NVO/novo-s-cagri-sema-delivers-superior-weight-loss-versus-tirzepatide-luzc9kpilblh.html"
  },
  {
   "d": "2026-09-14",
   "h": "Novo Nordisk rebranded to operate day to day as 'Novo'; legal entity name unchanged",
   "u": "https://www.stocktitan.net/news/NVO/novo-nordisk-enters-next-chapter-to-bring-better-health-to-more-pd5b0i246k59.html"
  }
 ],
 "UNH": [
  {
   "d": "2026-10-13",
   "h": "Q3 adjusted EPS of $4.69 beats as the medical care ratio improves to 88.4%; 2026 adjusted EPS outlook raised to at least $20.50",
   "u": "https://www.xtb.com/en/market-analysis/unitedhealth-group-shares-gain-3-after-stronger-than-expected-earnings-and-guidance"
  },
  {
   "d": "2026-10-01",
   "h": "UnitedHealthcare and Aetna said their 2027 Medicare Advantage plans will offer more limited provider networks.",
   "u": "https://www.msn.com/en-us/news/other/unitedhealthcare-aetna-say-2027-medicare-advantage-plans-to-offer-more-limited-provider-networks/ar-AA2dliN9"
  },
  {
   "d": "2026-09-28",
   "h": "HHS inspector general estimated $24.4M of 2020-21 Medicare Advantage overpayments at UnitedHealthcare's Texas plan; company called the methodology flawed.",
   "u": "https://www.beckerspayer.com/payer/medicare-advantage/unitedhealthcare-received-24m-in-medicare-advantage-overpayments-in-texas-oig/"
  },
  {
   "d": "2026-09-17",
   "h": "Inspector-general audit found $46.9M of 2020-21 overpayments at UnitedHealthcare's Wisconsin Medicare Advantage business, citing unsupported diagnosis codes.",
   "u": "https://www.yahoo.com/news/politics/articles/federal-watchdog-accuses-humana-unitedhealthcare-090149664.html"
  }
 ],
 "ABBV": [
  {
   "d": "2026-10-30",
   "h": "Q3 revenue up 10.3% to $17.4bn as Skyrizi ($5.78bn) and Rinvoq ($2.71bn) each grow over 22%; 2026 adjusted EPS guide raised to $13.95-$13.99",
   "u": "https://www.stocktitan.net/articles/abbvie-q3-2026-earnings-skyrizi-rinvoq-outgrow-humira"
  },
  {
   "d": "2026-09-28",
   "h": "FDA approved Juvmo (tavapadon), the first selective D1/D5 agonist for Parkinson's disease, as monotherapy or with levodopa; US availability expected October 2026.",
   "u": "https://news.abbvie.com/2026-09-28-U-S-FDA-Approves-AbbVies-JUVMO-TM-tavapadon-for-Parkinsons-Disease"
  },
  {
   "d": "2026-09-03",
   "h": "AbbVie completed its $10.9B acquisition of Apogee Therapeutics at $135.11 per share in cash, adding the late-stage IL-13 antibody zumilokibart.",
   "u": "https://www.rttnews.com/3688302/abbvie-completes-10-9-bln-acquisition-of-apogee-therapeutics.aspx"
  }
 ],
 "MRK": [
  {
   "d": "2026-10-29",
   "h": "Q3 sales up 5% to $18.1bn; Keytruda IV sales slip 5% to $7.8bn as patients move to subcutaneous Keytruda Qlex at $830m",
   "u": "https://www.sec.gov/Archives/edgar/data/0000310158/000110465926119825/tm2628203d1_ex99-2.htm"
  },
  {
   "d": "2026-08-19",
   "h": "Phase 3 INTerpath-001: intismeran autogene plus Keytruda met recurrence-free and distant-metastasis-free survival endpoints in resected melanoma; shares jumped about 12%.",
   "u": "https://www.merck.com/news/merck-and-moderna-announce-phase-3-interpath-001-trial-of-intismeran-autogene-plus-keytruda-met-endpoints-of-recurrence-free-survival-rfs-and-distant-metastasis-free-survival-dmfs-in-patient/"
  },
  {
   "d": "2026-08-04",
   "h": "Q2 sales $16.6B, up 5%; Keytruda $8.4B incl. $463M Keytruda Qlex; 2026 sales guide raised to $66.3-67.3B, non-GAAP EPS cut to $2.66-2.76 on Terns charge.",
   "u": "https://www.merck.com/wp-content/uploads/sites/124/2026/08/Merck-News-Release-08-04-26-Merck-Co.-Inc.-Rahway-N.J.-USA-Announces-Second-Quarter-2026-Financial-Results.pdf"
  }
 ],
 "AZN": [
  {
   "d": "2026-09-29",
   "h": "AstraZeneca agreed a $2B preferred equity investment in Summit Therapeutics at $18.36/share (about 12% stake) plus an ivonescimab trial collaboration; completed 5 October.",
   "u": "https://www.ig.com/uk/news-and-trade-ideas/astrazeneca-shares-hit-two-month-high-as--2bn-summit-deal-streng-260929"
  },
  {
   "d": "2026-09-01",
   "h": "Tagrisso plus Orpathys met its PFS endpoint in Phase 3 SANOVO; EU approved Enhertu plus pertuzumab for first-line HER2-positive metastatic breast cancer.",
   "u": "https://www.benzinga.com/markets/biotech/26/09/61543700/astrazeneca-shares-dual-oncology-clinical-and-regulatory-victories"
  },
  {
   "d": "2026-08-18",
   "h": "AstraZeneca discontinued Phase 3 eVOLVE-Lung02 of volrustomig plus chemotherapy in first-line metastatic NSCLC as unlikely to meet PFS or OS endpoints.",
   "u": "https://www.empr.com/news/astrazeneca-halts-volrustomig-nsclc-trial/"
  }
 ],
 "NVS": [
  {
   "d": "2026-10-28",
   "h": "Q3 net sales up 4% to $14.5bn and core EPS up 9% to $2.46; full-year core operating income guidance raised",
   "u": "https://www.indianpharmapost.com/news/novartis-raises-2026-profit-outlook-as-q3-sales-rise-4-22263"
  },
  {
   "d": "2026-09-11",
   "h": "Major shareholder Artisan Partners said the board 'failed to properly scrutinize deals' after trial setbacks undermined the $12B Avidity acquisition.",
   "u": "https://www.biospace.com/business/novartis-board-faces-investor-scrutiny-after-m-a-misfires-and-r-d-flops"
  },
  {
   "d": "2026-09-08",
   "h": "Phase 3 HARBOR of del-desiran, from the Avidity deal, missed its primary endpoint in myotonic dystrophy; NVS ADR closed down 14% at $137.63.",
   "u": "https://www.statnews.com/2026/09/08/novartis-del-desiran-myotonic-dystrophy-harbor-trial-failure-neuromuscular/"
  },
  {
   "d": "2026-09-07",
   "h": "Pelacarsen lowered Lp(a) but failed to reduce cardiovascular events in the 8,000-patient Phase 3 Lp(a)HORIZON trial.",
   "u": "https://pharmaphorum.com/news/novartis-hit-lpa-drug-fails-cardio-outcomes-trial"
  }
 ],
 "ISRG": [
  {
   "d": "2026-10-20",
   "h": "Q3 revenue up 22% to $3.05bn as da Vinci procedures grow about 14% and 546 systems are placed; GAAP EPS hit by a $450m antitrust settlement",
   "u": "https://www.biospace.com/press-releases/intuitive-announces-third-quarter-2026-earnings"
  }
 ],
 "VRTX": [
  {
   "d": "2026-09-08",
   "h": "Goldman Sachs added Vertex to its conviction list.",
   "u": "https://www.msn.com/en-us/news/other/goldman-sachs-just-added-vertex-pharmaceuticals-to-its-conviction-list-here-s-the-bull-case-for-the-big-biotech-stock/ar-AA2bPJn7"
  },
  {
   "d": "2026-09-01",
   "h": "Vertex completed its Crinetics acquisition (about $10B equity value, $8.8B net of cash), adding acromegaly drug Palsonify and atumelnant.",
   "u": "https://www.americanpharmaceuticalreview.com/1315-News/627846-Vertex-Completes-10-Billion-Crinetics-Acquisition-Reshapes-Leadership-Team/"
  },
  {
   "d": "2026-08-04",
   "h": "Q2 revenue $3.33B, up 12%, non-GAAP EPS $4.73; 2026 revenue guidance raised to $13.1-13.2B from $12.95-13.1B; Journavx $49.6M, Casgevy $76.4M.",
   "u": "https://www.sec.gov/Archives/edgar/data/0000875320/000087532026000256/ex-991_q22026.htm"
  }
 ],
 "AMGN": [
  {
   "d": "2026-09-08",
   "h": "Shares fell 10% to $394.38 as Novartis's pelacarsen failure clouded the Lp(a) class, overshadowing a Phase 3 overall-survival win for Imdelltra in small cell lung cancer.",
   "u": "https://247wallst.com/investing/2026/09/08/amgen-falls-10-as-novartis-trial-failure-clouds-a-cholesterol-drug-class-nvs-stock-drops-14/"
  },
  {
   "d": "2026-08-04",
   "h": "Q2 revenue up 10% to $10.1B, non-GAAP EPS $6.29; 2026 guidance raised to $38.2-39.4B revenue and $22.30-23.50 non-GAAP EPS.",
   "u": "https://www.sec.gov/Archives/edgar/data/0000318154/000031815426000124/amgn-20260630earningsrelea.htm"
  }
 ],
 "REGN": [
  {
   "d": "2026-10-30",
   "h": "Q3 revenue up 36% to $5.1bn with record Dupixent, EYLEA HD up 62% and Libtayo; non-GAAP EPS up 70% to $20.07",
   "u": "https://www.quiverquant.com/news/Regeneron+Reports+Third+Quarter+2026+Results,+Raises+Full-Year+Guidance+and+Expands+Sanofi+Collaboration"
  },
  {
   "d": "2026-10-01",
   "h": "Expanded Sanofi alliance: $1B upfront and up to $7B milestones for four long-acting antibodies, split 50:50; Dupixent terms unchanged; shares fell 2.9%.",
   "u": "https://finance.yahoo.com/markets/stocks/articles/why-regeneron-regn-stock-trading-220507553.html"
  },
  {
   "d": "2026-08-19",
   "h": "FDA approved Pasatru (garetosmab) for fibrodysplasia ossificans progressiva, an ultra-rare disease of abnormal bone growth.",
   "u": "https://www.statnews.com/2026/08/19/regeneron-fop-garetosmab-fda-approval-pasatru/"
  }
 ],
 "BRK.B": [
  {
   "d": "2026-08-09",
   "h": "Q2 operating earnings $12.98B vs $11.16B; about $4.5B of buybacks and over $21B of stock purchases, incl. $10B in Alphabet, cut cash to $365.5B; Geico underwriting profit fell 45%.",
   "u": "https://www.businessday.co.za/world/international-companies/2026-08-09-greg-abel-finally-spends-a-chunk-of-berkshire-hathaways-huge-cashpile/"
  }
 ],
 "JPM": [
  {
   "d": "2026-10-13",
   "h": "Q3 net income $15.3bn on revenue of $50.9bn, up 8%; net interest income up 13%; investment banking fees up 14% and equities trading up 49%",
   "u": "https://pulse2.com/jpmorgan-chase-q3-2026-results"
  },
  {
   "d": "2026-09-15",
   "h": "Co-president Doug Petno guided third-quarter investment banking fees and markets revenue up by a mid-to-high-teens percentage year on year.",
   "u": "https://pulse2.com/jpmorgan-expects-q3-investment-banking-fees-and-markets-revenue-to-rise-mid-to-high-teens/"
  }
 ],
 "V": [
  {
   "d": "2026-10-27",
   "h": "Fiscal Q4 net revenue $12.1bn, up 13%; fiscal 2026 revenue $45.9bn, up 15%; dividend raised 16% and $4bn of shares bought back in the quarter",
   "u": "https://www.heygotrade.com/en/news/visa-fiscal-q4-2026-earnings-results/"
  },
  {
   "d": "2026-09-19",
   "h": "Nearly 978 merchants and trade groups asked a Brooklyn federal judge to withhold final approval of the Visa-Mastercard interchange settlement.",
   "u": "https://www.crowdfundinsider.com/2026/09/310317-visa-mastercard-settlement-faces-merchant-pushback-in-court/"
  }
 ],
 "MA": [
  {
   "d": "2026-10-29",
   "h": "Q3 net revenue $9.8bn, up 14%; adjusted EPS $5.31, up 21%; value-added services up 19%",
   "u": "https://www.stocktitan.net/articles/mastercard-q3-2026-earnings-us-credit-cards-travel"
  },
  {
   "d": "2026-09-30",
   "h": "A consortium backed by Mastercard, Visa and Stripe entered the US dollar stablecoin market.",
   "u": "https://www.msn.com/en-us/news/other/mastercard-visa-stripe-backed-consortium-enters-usd-stablecoin-market/ar-AA2diyuP"
  },
  {
   "d": "2026-09-19",
   "h": "Nearly 978 merchants and trade groups asked a Brooklyn federal judge to withhold final approval of the Visa-Mastercard interchange settlement.",
   "u": "https://www.crowdfundinsider.com/2026/09/310317-visa-mastercard-settlement-faces-merchant-pushback-in-court/"
  }
 ],
 "BAC": [
  {
   "d": "2026-10-14",
   "h": "Q3 revenue $30bn, up 3%, and net interest income up 8%, but net income fell 17% to $6.9bn after a $1.2bn regulatory settlement charge",
   "u": "https://vestedfinance.com/blog/us-stocks/bank-of-america-q3-earnings-2026/"
  },
  {
   "d": "2026-09-14",
   "h": "Moynihan said third-quarter investment banking fees would fall at least 10% year on year; shares fell 5.1% to $59.47.",
   "u": "https://www.fool.com/coverage/stock-market-today/2026/09/14/stock-market-today-sept-14-bank-of-america-slides-on-investment-banking-fee-surprise/"
  }
 ],
 "GS": [
  {
   "d": "2026-10-13",
   "h": "Q3 net revenues $18.7bn, up 23%; earnings $5.3bn, up 29%; investment banking fees up 21%",
   "u": "https://www.sec.gov/Archives/edgar/data/0000886982/000088698226000529/a3q26gsearningsresults.htm"
  },
  {
   "d": "2026-09-16",
   "h": "Goldman said fixed income, currencies and commodities revenue would be slightly softer in the third quarter, with higher costs; shares fell about 4%.",
   "u": "https://www.msn.com/en-ca/news/other/goldman-sachs-sees-slightly-softer-fixed-income-currencies-commodities-business-higher-costs/ar-AA2cnl3p"
  },
  {
   "d": "2026-09-15",
   "h": "Solomon projected a softer third quarter for fixed income while equities and asset management performed well.",
   "u": "https://www.wsj.com/livecoverage/fed-meeting-warsh-interest-rate-09-16-2026/card/goldman-sachs-projects-softer-quarter-for-fixed-income-XtEsyJmo9qbtI5MARXEV"
  }
 ],
 "MS": [
  {
   "d": "2026-10-14",
   "h": "Q3 revenue $20.3bn, up about 12%; net income $4.9bn, EPS $3.03 against $2.91 expected; equities trading revenue up 41% to $5.8bn",
   "u": "https://www.kaohooninternational.com/?p=592720"
  },
  {
   "d": "2026-09-29",
   "h": "Morgan Stanley set up a Digital Asset Lab to test stablecoins, tokenisation and DeFi applications, extending its crypto push through E*TRADE and ETFs",
   "u": "https://finance.yahoo.com/markets/crypto/articles/breaking-morgan-stanley-expands-deeper-123152711.html"
  }
 ],
 "AXP": [
  {
   "d": "2026-10-23",
   "h": "Record Q3 revenue of $20.1bn, up about 9%; adjusted EPS $4.68; full-year EPS guidance raised to $17.60-17.90",
   "u": "https://247wallst.com/cards/american-express-q3-2026-earnings-axp-01m5m6zq01vcns9g97a051hrxm"
  }
 ],
 "BLK": [
  {
   "d": "2026-10-14",
   "h": "Q3 revenue $7.75bn, up 19%; record AUM of about $15.5tn after $205bn of net inflows",
   "u": "https://pulse2.com/blackrock-q3-2026-results"
  }
 ],
 "HSBC": [
  {
   "d": "2026-10-27",
   "h": "Q3 pre-tax profit up 32% to $9.63bn and a new buyback of up to $1bn, but shares fell 5.5% as revenue and wealth income missed estimates",
   "u": "https://finews.com/news/english-news/74169-hsbc-reports-significantly-higher-third-quarter-earnings-share-buyback-stock-falls-5-5-percent"
  },
  {
   "d": "2026-09-29",
   "h": "HSBC completed its $1 billion buyback launched on 5 August, repurchasing 48.657 million shares in London and Hong Kong",
   "u": "https://www.thestandard.com.hk/finance/article/344095/HSBC-completes-US1-billion-share-buyback-program"
  },
  {
   "d": "2026-08-04",
   "h": "Q2 2026 reported pre-tax profit rose 63% to $10.1 billion, RoTE 19.5%; 2026 banking NII guidance raised to at least $46 billion; new $1 billion buyback",
   "u": "https://www.itiger.com/news/1106894023"
  }
 ],
 "RY": [
  {
   "d": "2026-08-27",
   "h": "Q3 FY2026 net income rose 11% to C$6.02 billion; adjusted EPS C$4.28 beat C$4.07 estimate; wealth management earnings up 32%",
   "u": "https://www.canadianmortgagetrends.com/mortgage-wire/2026/08/27/rbc-posts-record-profit-on-wealth-markets-strength"
  },
  {
   "d": "2026-08-27",
   "h": "Provisions for credit losses rose 14% year on year to about C$1 billion; CET1 ratio held at 13.5%",
   "u": "https://www.canadianmortgagetrends.com/mortgage-wire/2026/08/27/rbc-posts-record-profit-on-wealth-markets-strength"
  }
 ],
 "AAPL": [
  {
   "d": "2026-09-09",
   "h": "Apple launched the iPhone 18 Pro from $1,199 and its first foldable, iPhone Duo, from $1,999; Duo pre-orders 16 October, launch 23 October",
   "u": "https://www.macstories.net/news/iphone-18-pro-and-iphone-duo-the-macstories-overview/"
  },
  {
   "d": "2026-08-03",
   "h": "September-quarter guidance of 9-11% revenue growth and 47-48% gross margin disappointed; management warned memory costs keep rising beyond September",
   "u": "https://www.trefis.com/stock/aapl/articles/609846/apples-record-quarter-ran-into-a-memory-bill/2026-08-03"
  },
  {
   "d": "2026-08-01",
   "h": "Shares fell 7.4% after Q3 FY26 results despite revenue of $109.4 billion, up 16%, and EPS of $2.02 beating estimates",
   "u": "https://www.fool.com/investing/2026/08/01/apple-gets-kicked-out-of-the-5-trillion-club-after/"
  }
 ],
 "WMT": [
  {
   "d": "2026-08-20",
   "h": "Q2 FY27 revenue $187.9 billion, up 5.9%; adjusted EPS $0.81; US comp sales up 2.6%, advertising up 38%, e-commerce up 23%",
   "u": "https://corporate.walmart.com/content/dam/corporate/documents/newsroom/2026/08/20/walmart-releases-q2-fy27-earnings/q2-fy27-earnings-release.pdf"
  },
  {
   "d": "2026-08-20",
   "h": "Raised FY27 guidance to 4-5% constant-currency sales growth and adjusted EPS of $2.80-2.87, from $2.75-2.85",
   "u": "https://corporate.walmart.com/content/dam/corporate/documents/newsroom/2026/08/20/walmart-releases-q2-fy27-earnings/q2-fy27-earnings-release.pdf"
  },
  {
   "d": "2026-08-20",
   "h": "Management flagged more than $2 billion of incremental fuel-related costs this year beyond original guidance",
   "u": "https://corporate.walmart.com/content/dam/corporate/documents/newsroom/2026/08/20/walmart-releases-q2-fy27-earnings/q2-fy27-earnings-call-transcript.pdf"
  }
 ],
 "COST": [
  {
   "d": "2026-09-24",
   "h": "Q4 FY26 net sales $93.9 billion, up 11.2%; EPS $6.75 including $0.15 tariff-refund benefit; comps ex gas and FX up 6.7%",
   "u": "https://s201.q4cdn.com/287523651/files/doc_news/Costco-Wholesale-Corporation-Reports-Fourth-Quarter-and-Fiscal-Year-2026-Operating-Results-2026.pdf"
  },
  {
   "d": "2026-09-24",
   "h": "FY26 net sales rose 10.1% to $297.2 billion; membership fee income $5.9 billion; 939 warehouses at year end",
   "u": "https://s201.q4cdn.com/287523651/files/doc_news/Costco-Wholesale-Corporation-Reports-Fourth-Quarter-and-Fiscal-Year-2026-Operating-Results-2026.pdf"
  }
 ],
 "PG": [
  {
   "d": "2026-10-22",
   "h": "Fiscal Q1 organic sales up 4% led by 2.4 points of volume; core EPS up 1% to $2.00 as the commodity headwind rises to about $1.4bn",
   "u": "https://www.globalbrandsmagazine.com/pg-q1-fy2027-results-brand-breakdown"
  },
  {
   "d": "2026-10-01",
   "h": "Completes the $3.9bn all-cash acquisition of supplements brand Thorne, folded into Personal Health Care",
   "u": "https://www.globalbrandsmagazine.com/pg-q1-fy2027-results-brand-breakdown"
  },
  {
   "d": "2026-09-24",
   "h": "P&G will report first-quarter fiscal 2026/27 results on 22 October",
   "u": "https://www.pginvestor.com/news/news-details/2026/PG-to-Webcast-Discussion-of-First-Quarter-2627-Earnings-Results-on-October-22/default.aspx"
  },
  {
   "d": "2026-08-01",
   "h": "CEO Shailesh Jejurikar became chairman as executive chairman Jon Moeller retired from the board (announced 29 July)",
   "u": "https://www.pginvestor.com/news/news-details/2026/Shailesh-Jejurikar-Appointed-Chairman-of-PG-Board-of-Directors/default.aspx"
  }
 ],
 "KO": [
  {
   "d": "2026-10-27",
   "h": "Q3 organic revenue up 7% with volume up 5%; full-year EPS growth guidance raised to 11%",
   "u": "https://finance.biggo.com/news/US_KO_2026-10-27"
  },
  {
   "d": "2026-10-27",
   "h": "Flags an 8-point revenue headwind in 2027 from refranchising Coca-Cola Beverages Africa",
   "u": "https://finance.biggo.com/news/US_KO_2026-10-27"
  },
  {
   "d": "2026-09-29",
   "h": "Coca-Cola will release third-quarter 2026 results on 27 October",
   "u": "https://investors.coca-colacompany.com/news-events/press-releases/detail/1173/the-coca-cola-company-announces-timing-of-third-quarter-2026-earnings-release"
  },
  {
   "d": "2026-09-25",
   "h": "CEO Henrique Braun named Rob Gehring, ex-Monster Energy, president of the North America unit from 1 December 2026",
   "u": "https://investors.coca-colacompany.com/news-events/press-releases/detail/1172/the-coca-cola-company-names-rob-gehring-president-of-north-america-operating-unit"
  }
 ],
 "MCD": [
  {
   "d": "2026-09-23",
   "h": "McDonald's NEXT strategy targets low-to-mid 50% operating margin and share gains in chicken and beverages by 2030, with $8.5 billion franchisee support through 2036",
   "u": "https://corporate.mcdonalds.com/corpmcd/our-stories/article/NEXT-growth-strategy-advances.html"
  },
  {
   "d": "2026-08-04",
   "h": "Q2 2026 global comps up 1.3%, US up 0.8% on higher check but lower guest counts; adjusted EPS $3.38, up 6%",
   "u": "https://corporate.mcdonalds.com/content/dam/sites/corp/nfl/pdf/MCD%20Q226%20Earnings%20Release%20-%20Exhibit%2099.1.pdf"
  }
 ],
 "HD": [
  {
   "d": "2026-08-18",
   "h": "Q2 FY2026 sales $47.9 billion, up 5.7%; comps up 1.7% (US 1.3%); adjusted EPS $4.92; full-year guidance reaffirmed",
   "u": "https://ir.homedepot.com/news-releases/2026/08-18-2026-110040463"
  },
  {
   "d": "2026-08-12",
   "h": "CEO Ted Decker took temporary medical leave; Ann-Marie Campbell and CFO Richard McPhail lead the company in the interim",
   "u": "https://ir.homedepot.com/news-releases/2026/08-12-2026-140442024"
  }
 ],
 "PEP": [
  {
   "d": "2026-10-08",
   "h": "Q3 revenue of $25.3bn and EPS of $2.23 beat; fiscal 2026 outlook raised",
   "u": "https://www.tradingview.com/news/tradingview:e2b99d5da04e4:0-pepsico-posts-q3-2026-revenue-25-27b-eps-2-23-raises-fiscal-2026-outlook/"
  }
 ],
 "MC": [
  {
   "d": "2026-10-13",
   "h": "Q3 revenue of EUR18.5bn with organic growth slowing to 1%; Fashion & Leather Goods falls 5% organically on weak Chinese demand",
   "u": "https://www.indexbox.io/blog/lvmh-q3-2026-revenue-rises-12-to-eur185-billion-as-china-weakness-hits-fashion-and-leather-goods/"
  }
 ],
 "NESN": [
  {
   "d": "2026-10-22",
   "h": "Q3 organic growth picks up to 4% and the 2026 organic sales growth outlook of 3% to 4% is maintained",
   "u": "https://www.tradingview.com/news/seekingalpha:d84c2caad094b:0-nestl-q3-organic-growth-picks-up-to-4-maintains-2026-guidance/"
  }
 ],
 "PM": [
  {
   "d": "2026-10-21",
   "h": "Adjusted operating income tops $5bn for the first time as smoke-free growth accelerates, but a $370m US ZYN investment pushes full-year guidance to the midpoint or lower",
   "u": "https://finance.biggo.com/news/US_PM_2026-10-21"
  }
 ],
 "OR": [
  {
   "d": "2026-10-22",
   "h": "Q3 sales beat forecasts as premium haircare and dermatological beauty accelerate; nine-month sales up 7.7%",
   "u": "https://www.ad-hoc-news.de/boerse/news/corporate-news/l-oreal-stock-nine-month-sales-rise-7-7-prozent-on-strong-third-quarter/70433321"
  },
  {
   "d": "2026-09-23",
   "h": "HSBC reiterated Buy with a EUR450 target while Deutsche Bank kept Sell at EUR340, citing warning signs in Chinese cosmetics imports",
   "u": "https://www.optionfinance.fr/info-financiere-en-continu/d/2026-09-23-hsbc-confiant-sur-la-croissance-de-loreal-mais-db-tempere-sur-la-chine.html"
  }
 ],
 "XOM": [
  {
   "d": "2026-10-30",
   "h": "Q3 profit of $15.4bn as refining hits record utilisation; dividend raised 4% and $20bn buyback pace reaffirmed",
   "u": "https://finance.biggo.com/news/US_XOM_2026-10-30"
  },
  {
   "d": "2026-09-09",
   "h": "Exxon shares up about 40% year to date at $164.83, trailing Chevron (44%) and the XLE energy ETF (48%)",
   "u": "https://finance.yahoo.com/energy/articles/exxonmobil-40-2026-rising-oil-190811096.html"
  },
  {
   "d": "2026-08-25",
   "h": "Exxon reported among suitors for Shell's US chemicals assets, which could fetch up to $8 billion, according to the FT",
   "u": "https://www.thestar.com.my/business/business-news/2026/08/25/shell-us-assets-draw-exxon-lyondell-interest"
  }
 ],
 "CVX": [
  {
   "d": "2026-10-30",
   "h": "Q3 adjusted profit of $10.4bn and free cash flow of $14.2bn on record production and refining margins",
   "u": "https://finance.biggo.com/news/US_CVX_2026-10-30"
  },
  {
   "d": "2026-10-30",
   "h": "Unveils a plan to double Venezuela output to 600,000 barrels a day by 2031",
   "u": "https://finance.biggo.com/news/US_CVX_2026-10-30"
  },
  {
   "d": "2026-09-02",
   "h": "Chevron to invest over $7 billion in Venezuelan joint ventures over five years, aiming to roughly double output there to about 600,000 bpd",
   "u": "https://www.aljazeera.com/economy/2026/9/2/us-oil-giant-chevron-to-expand-venezuela-operations"
  }
 ],
 "SHEL": [
  {
   "d": "2026-10-29",
   "h": "Q3 adjusted earnings of $10.8bn beat with cash flow of $21bn; another $5bn buyback announced and LNG Canada Phase 2 approved",
   "u": "https://www.tradingpedia.com/2026/10/29/shell-beats-q3-estimates-and-expands-share-buybacks/"
  },
  {
   "d": "2026-08-25",
   "h": "Shell weighing sale of its US chemicals business for up to $8 billion; Exxon, LyondellBasell, Apollo and KPC submitted non-binding bids, FT reported",
   "u": "https://www.thestar.com.my/business/business-news/2026/08/25/shell-us-assets-draw-exxon-lyondell-interest"
  }
 ],
 "TTE": [
  {
   "d": "2026-10-29",
   "h": "Q3 adjusted profit up 51% to $9.1bn on a record $33 refining margin; 2026 cash flow guidance raised to $43bn",
   "u": "https://finance.biggo.com/news/US_TTE_2026-10-29"
  },
  {
   "d": "2026-09-28",
   "h": "Strategy update: 4% a year energy production growth to 2030, dividend growth above 5% a year, $2.5bn Q4 buyback, $14-17bn annual net capex 2027-32",
   "u": "https://totalenergies.com/newsroom/presentation-strategie-et-perspectives-2026-501175/?lang=eng"
  }
 ],
 "COP": [
  {
   "d": "2026-08-05",
   "h": "CFO Andy O'Brien named president and CEO from 1 September 2026; Ryan Lance becomes executive chair; Konnie Haynes-Welsh appointed CFO",
   "u": "https://worldoil.com/news/2026/8/6/conocophillips-announces-ceo-succession-names-andy-o-brien"
  }
 ],
 "LIN": [
  {
   "d": "2026-10-29",
   "h": "Record Q3 sales of $9.4bn and adjusted EPS up 9% to $4.59; $425m restructuring charge and Lincare moved to Global Other",
   "u": "https://finance.biggo.com/news/US_LIN_2026-10-29"
  }
 ],
 "BHP": [
  {
   "d": "2026-10-20",
   "h": "September-quarter copper output falls 19% while WAIO iron ore sets records and Jansen potash is 87% complete; FY27 guidance unchanged",
   "u": "https://kalkine.com.au/news/announcements/bhp-q1-fy27-operational-review-copper-output-falls-19-waio-sets-records-jansen-87-complete"
  },
  {
   "d": "2026-09-01",
   "h": "Shares hit a record A$68.77 before pulling back; of 14 analysts, 1 rates Buy, 12 Hold and 1 Sell",
   "u": "https://www.fool.com.au/2026/09/01/bhp-shares-are-pulling-back-from-a-record-high-what-now-for-asx-investors/"
  },
  {
   "d": "2026-08-17",
   "h": "FY26 underlying attributable profit up 30% to $13.2bn and EBITDA $32.9bn; copper 54% of EBITDA; final dividend 99 US cents",
   "u": "https://oilprice.com/Company-News/BHP-Profit-Jumps-as-Copper-Drives-Record-Earnings.html"
  }
 ],
 "NEE": [
  {
   "d": "2026-10-21",
   "h": "Q3 adjusted EPS up 9.7% with the renewables backlog at 36.7 GW; guidance reaffirmed at the high end",
   "u": "https://energynewsbeat.co/earnings/nextera-energy-delivers-solid-q3-2026-adjusted-earnings-beat-reaffirms-high-end-guidance-amid-strong-renewables-backlog-growth/"
  },
  {
   "d": "2026-09-14",
   "h": "Reaffirmed 2026 adjusted EPS guidance of $3.92-4.02, targeting the top end; expanded Virginia customer benefits package for the Dominion deal",
   "u": "https://www.marketscreener.com/news/nextera-energy-reaffirms-2026-guidance-at-top-end-of-range-as-67-billion-dominion-merger-progresses-ce785bdcdc81f622"
  }
 ],
 "RIO": [
  {
   "d": "2026-10-14",
   "h": "Q3 update: Oyu Tolgoi copper up 29% year to date and Simandou reaches a 10 Mtpa run-rate; guidance unchanged",
   "u": "https://kalkinemedia.com/uk/news/announcements/rio-tinto-rio-q3-2026-production-update-oyu-tolgoi-copper-surges-29-ytd-simandou-reaches-10-mtpa-run-rate"
  },
  {
   "d": "2026-09-30",
   "h": "Bell Bay aluminium smelter secured to December 2031 with Hydro Tasmania power and Australian and Tasmanian government support",
   "u": "https://www.mining.com/web/rio-tinto-secures-bell-bay-aluminum-smelter-operations-till-2031/"
  },
  {
   "d": "2026-09-24",
   "h": "Bloomberg reported Rio plans to expand its Singapore commercial arm into trading third-party metals and derivatives, starting with alumina and North American copper",
   "u": "https://www.eurasiareview.com/03102026-a-miner-shift-rio-tinto-trades-ownership-for-offtake-oped/"
  },
  {
   "d": "2026-09-08",
   "h": "China's state buyer told some steel mills to hold off purchases of Rio's Pilbara Blend iron ore, Bloomberg reported",
   "u": "https://www.bloomberg.com/news/articles/2026-09-08/china-tells-steel-mills-to-hold-off-on-buying-rio-tinto-s-ore"
  }
 ],
 "GE": [
  {
   "d": "2026-10-21",
   "h": "Q3 revenue of $14.1bn and adjusted EPS of $2.25 beat as orders rise 49%; 2026 guidance raised again",
   "u": "https://airpronews.com/2026/10/21/ge-aerospace-q3-2026-results-orders-up-49-percent/"
  },
  {
   "d": "2026-09-08",
   "h": "Agreed to buy castings maker Consolidated Precision Products from Warburg Pincus and Berkshire Partners for $11.75bn, funded with $7bn cash plus new debt",
   "u": "https://www.cnbc.com/2026/09/08/ge-aerospace-to-buy-castings-maker-cpp-for-nearly-12-billion.html"
  }
 ],
 "CAT": [
  {
   "d": "2026-10-29",
   "h": "Record Q3 sales up 17% to $20.7bn as data-centre power generation sales rise 30%; backlog nearly doubles to $78bn",
   "u": "https://www.manufacturingdive.com/news/caterpillar-posts-highest-sales-quarter-ever-data-centers-q3-2026/873176/"
  }
 ],
 "RTX": [
  {
   "d": "2026-10-20",
   "h": "Q3 adjusted EPS up 33% to $2.26 and backlog reaches a record $340bn; full-year guidance raised for a second straight quarter",
   "u": "https://finance.biggo.com/news/US_RTX_2026-10-20"
  },
  {
   "d": "2026-10-01",
   "h": "Raytheon awarded multi-year US Navy contract worth up to $24.4bn for SM-6 interceptors, five years plus two option years",
   "u": "https://www.rtx.com/news/news-center/2026/10/01/rtxs-raytheon-awarded-24-4-billion-multi-year-contract-for-sm-6-interceptors"
  },
  {
   "d": "2026-09-28",
   "h": "Raytheon awarded multi-year contract worth up to $20.7bn to raise AMRAAM production to record levels",
   "u": "https://www.rtx.com/news/news-center/2026/09/28/rtxs-raytheon-awarded-20-7-billion-multi-year-contract-for-amraam-under-landmar"
  },
  {
   "d": "2026-09-17",
   "h": "RTX shares fell about 10% in the month to 17 September as valuation concerns outweighed contract wins",
   "u": "https://247wallst.com/investing/2026/09/17/jim-cramer-says-defense-giant-still-too-expensive-despite-22-9-billion-tomahawk-missile-deal/"
  }
 ],
 "GEV": [
  {
   "d": "2026-10-28",
   "h": "Q3 orders surge 96% and backlog nears $200bn as gas power backlog and reservations reach 122 GW; buyback doubled to $20bn alongside a $9bn Trench deal",
   "u": "https://www.turbomachinerymag.com/view/ge-vernova-q3-2026-gas-power-backlog-122-gw-trench-acquisition"
  },
  {
   "d": "2026-09-03",
   "h": "GE Vernova Hitachi, Studsvik and Samsung C&T agreed to advance a four-unit, 1.2 GW BWRX-300 project in Sweden; not a final investment decision",
   "u": "https://www.tmcnet.com/usubmit/2026/09/03/10439758.htm"
  },
  {
   "d": "2026-09-02",
   "h": "Signed agreement in Caracas to rehabilitate Venezuela's grid: 1 GW of new power within 24 months, then 5 GW over four years",
   "u": "https://tedmag.com/ge-vernova-to-help-stabilize-venezuelas-power-grid/"
  },
  {
   "d": "2026-09-02",
   "h": "Shares about 22% below their 52-week high as investors question margin delivery despite record orders",
   "u": "https://www.forbes.com/sites/greatspeculations/2026/09/02/ge-vernova-has-the-orders-but-can-it-deliver-the-margins/"
  }
 ],
 "BA": [
  {
   "d": "2026-10-27",
   "h": "Q3 revenue up 4% to $24.2bn on 161 deliveries and the net loss narrows to $116m; 737-7 and 737-10 certified and backlog hits a record $745bn",
   "u": "https://www.aerotime.aero/articles/boeing-q3-2026-results-record-backlog-737-7-and-737-10-certified-loss-narrows"
  },
  {
   "d": "2026-10-02",
   "h": "SPEEA engineers ratified a contract with an average 32% pay rise over four years, averting a strike after rejecting an August offer",
   "u": "https://spokesman.com/stories/2026/oct/02/boeing-white-collar-workers-ratify-new-offer-avert"
  },
  {
   "d": "2026-09-29",
   "h": "US Navy picked Boeing over Northrop Grumman for the F/A-XX carrier fighter, a roughly $20 billion development award; Northrop could still protest",
   "u": "https://247wallst.com/investing/2026/10/01/boeing-just-beat-northrop-for-a-20-billion-navy-fighter-contract/"
  },
  {
   "d": "2026-09-28",
   "h": "Shares fell 6.9% after the FAA halted 737 MAX 10 certification over a cockpit software flaw affecting autopilot functions on landing",
   "u": "https://finance.yahoo.com/markets/stocks/articles/driving-move-boeing-stock-123305824.html"
  }
 ],
 "HON": [
  {
   "d": "2026-10-22",
   "h": "First quarter as a pure-play automation company after the aerospace spin-off: sales $5.0bn with 7% organic growth and adjusted EPS up 34% to $2.27",
   "u": "https://www.honeywell.com/us/en/news/press-releases/2026/10/honeywell-technologies-reports-third-quarter-results-raises-full-year-2026-outlook"
  },
  {
   "d": "2026-10-22",
   "h": "2026 outlook raised to $20.0bn-$20.1bn of sales and $8.40-$8.45 adjusted EPS for the remaining automation business",
   "u": "https://www.honeywell.com/us/en/news/press-releases/2026/10/honeywell-technologies-reports-third-quarter-results-raises-full-year-2026-outlook"
  },
  {
   "d": "2026-08-01",
   "h": "Vimal Kapur, chairman and CEO of Honeywell Technologies, presents it as the only large pure-play automation company in public markets (T. Rowe Price interview, August 2026)",
   "u": "https://www.troweprice.com/en/ch/insights/the-long-view-honeywell-technologies"
  }
 ],
 "LMT": [
  {
   "d": "2026-10-22",
   "h": "Q3 beat drives a guidance raise as backlog reaches a record $292bn; shares jump",
   "u": "https://pomegra.io/news/lockheed-martin-q3-2026-stock-jumps-on-292b-backlog"
  },
  {
   "d": "2026-09-21",
   "h": "General Motors began supplying missile-housing components for Lockheed's PAC-3 MSE as the Pentagon pushes Patriot output above 2,000 a year by 2030",
   "u": "https://finance.yahoo.com/markets/stocks/articles/why-general-motors-now-missile-175953953.html"
  },
  {
   "d": "2026-08-03",
   "h": "Lockheed won a seven-year PAC-3 MSE interceptor production contract reported at $58.6 billion, with work running to March 2035",
   "u": "https://huntsvillebusinessjournal.com/news/2026/08/03/lockheed-martin-wins-58-6-billion-contract-for-patriot-production/"
  }
 ],
 "SIE": [
  {
   "d": "2026-08-06",
   "h": "Record fiscal Q3: orders up 14% to €27.9bn, revenue up 8%, industrial profit €3.5bn; FY2026 adjusted EPS outlook raised to €11.20–11.50",
   "u": "https://finance.yahoo.com/markets/stocks/articles/siemens-aktiengesellschaft-q3-earnings-call-080407637.html"
  },
  {
   "d": "2026-08-06",
   "h": "Smart Infrastructure orders rose 42% to a record €8bn, led by data centres; Healthineers spin-off received binding tax approval, with shareholder votes planned for February 2027",
   "u": "https://finance.yahoo.com/markets/stocks/articles/siemens-aktiengesellschaft-q3-earnings-call-080407637.html"
  }
 ],
 "TSLA": [
  {
   "d": "2026-10-21",
   "h": "Q3 revenue flat at $28.1bn on 486,532 deliveries and profit falls 43%, though EPS edges past estimates and FSD subscriptions rise 67%",
   "u": "https://www.basenor.com/blogs/news/tesla-q3-2026-earnings-28-05b-revenue-486-532-deliveries-fsd-subs-up-67"
  },
  {
   "d": "2026-10-21",
   "h": "Cybercab robotaxi rides begin and 2026 capital spending is cut to about $20bn",
   "u": "https://driveteslacanada.ca/news/tesla-q3-2026-earnings-results/"
  },
  {
   "d": "2026-10-02",
   "h": "Q3 deliveries of 486,532, down 2.1% year on year but well above the 461,974 consensus; shares rose about 5%",
   "u": "https://electrek.co/2026/10/02/tesla-q3-2026-deliveries-486532/"
  },
  {
   "d": "2026-10-02",
   "h": "Q3 energy storage deployments of 13.7 GWh were up 9.6% year on year but below the 15.9 GWh analysts expected",
   "u": "https://electrek.co/2026/10/02/tesla-q3-2026-deliveries-486532/"
  }
 ],
 "TM": [
  {
   "d": "2026-09-11",
   "h": "President Kenta Kon set out his aim to boost earning power (Yomiuri via MarketWatch)",
   "u": "https://www.marketwatch.com/story/yomiuri-toyota-president-kon-aims-to-boost-earning-power-to-make-better-cars-1f2b7b89"
  },
  {
   "d": "2026-08-04",
   "h": "Q1 FY2027 operating income fell 8.8% to ¥1.06trn but net income rose 75.6% to ¥1.477trn; full-year operating income forecast raised to ¥3.40trn",
   "u": "https://www.techtimes.com/articles/322919/20260804/toyota-raises-forecast-unveils-record-buyback-hybrid-strategy-proves-resilient.htm"
  },
  {
   "d": "2026-08-04",
   "h": "Toyota announced a record ¥1trn share buyback, about 4.22% of shares, and expects a ¥1.45trn tariff drag this fiscal year",
   "u": "https://www.techtimes.com/articles/322919/20260804/toyota-raises-forecast-unveils-record-buyback-hybrid-strategy-proves-resilient.htm"
  }
 ],
 "BYDDY": [
  {
   "d": "2026-10-04",
   "h": "Shareholders elected three new directors on 29 September; Hong Kong shares have lost about 35% over the past year",
   "u": "https://www.forbes.com/sites/russellflannery/2026/10/04/byd-shareholders-pick-three-new-board-members-amid-stock-sales-drops/"
  },
  {
   "d": "2026-10-01",
   "h": "September sales rose 17% to 463,561, a 2026 high; overseas sales up 154% to 180,700; nine-month sales down 3.9%",
   "u": "https://cnevpost.com/2026/10/01/byd-sept-2026-sales/"
  },
  {
   "d": "2026-08-28",
   "h": "H1 2026 revenue fell 7.1% to 344.8bn yuan and net profit fell 20.5% to 12.33bn yuan; gross margin improved to 18.85%",
   "u": "https://cnevpost.com/2026/08/28/byd-h1-2026-earnings/"
  }
 ],
 "RACE": [
  {
   "d": "2026-09-01",
   "h": "Ferrari completed the second tranche of its multi-year share buyback and launched a third tranche",
   "u": "https://markets.businessinsider.com/news/stocks/ferrari-n-v-completion-of-the-second-tranche-and-announcement-of-the-third-tranche-of-the-multi-year-share-repurchase-program-1036512390"
  }
 ],
 "GM": [
  {
   "d": "2026-10-20",
   "h": "Q3 beats for a sixth straight quarter on North America; cash-flow guidance raised and a new $20bn buyback authorised",
   "u": "https://www.cnbc.com/2026/10/20/general-motors-gm-earnings-q3-2026.html"
  },
  {
   "d": "2026-10-01",
   "h": "GM's US sales fell 5.5% in Q3 2026 to 670,974 vehicles, with Silverado EV sales down 92% after tax credits expired",
   "u": "https://www.freep.com/story/money/cars/general-motors/2026/10/01/general-motors-us-sales-third-quarter/92037188007/"
  },
  {
   "d": "2026-09-25",
   "h": "Cox Automotive expects GM and Ford to post the steepest US market-share declines in 2026",
   "u": "https://seekingalpha.com/news/4646972-gm-ford-to-suffer-steepest-us-market-share-decline-in-2026-cox-automotive"
  },
  {
   "d": "2026-09-21",
   "h": "GM began supplying PAC-3 missile components to Lockheed Martin; Barra sees about $700m of defence revenue this year",
   "u": "https://finance.yahoo.com/markets/stocks/articles/why-general-motors-now-missile-175953953.html"
  }
 ],
 "STLA": [
  {
   "d": "2026-10-28",
   "h": "Q3 revenue edges up 1% and beats as the turnaround gains traction; European BEV sales up 65% and shares jump",
   "u": "https://theevreport.com/stellantis-q3-2026-results-bev-sales"
  },
  {
   "d": "2026-10-01",
   "h": "FaSTLAne 2030 plan targets €3bn industrial free cash flow in 2028, €6bn a year by 2030 and a 7% adjusted operating margin by 2030",
   "u": "https://www.cbtnews.com/stellantis-turnaround-plan/"
  },
  {
   "d": "2026-09-30",
   "h": "Shares hit an all-time low of $4.43, down nearly 60% this year, as CEO Filosa reconfirmed 2026 guidance and targeted positive industrial FCF in 2027",
   "u": "https://finance.yahoo.com/markets/stocks/articles/stellantis-ceo-reaffirms-2026-guidance-151311288.html"
  },
  {
   "d": "2026-09-09",
   "h": "Jeep recall adds to a record recall year that includes 1.5 million Ram trucks and 955,000 vehicles in August",
   "u": "https://finance.yahoo.com/markets/stocks/articles/stellantis-stla-recalls-200-000-225734007.html"
  }
 ],
 "TCEHY": [
  {
   "d": "2026-08-12",
   "h": "Q2 revenue rose 11% to 204.8bn yuan, in line with estimates, but net profit of 56bn yuan, up 0.7%, missed the 61.8bn forecast",
   "u": "https://finance.yahoo.com/markets/stocks/articles/chinas-tencent-posts-11-second-084135153.html"
  },
  {
   "d": "2026-08-12",
   "h": "Capital expenditure rose 65% in the June quarter as Tencent stepped up AI infrastructure spending, ending its run of profit growth",
   "u": "https://www.cnbc.com/2026/08/12/china-tencent-earnings-q2-2026-gaming-ai-advertising.html"
  }
 ],
 "BABA": [
  {
   "d": "2026-09-30",
   "h": "Shares were down 26.5% in 2026 by 29 September after five straight quarterly EPS misses",
   "u": "https://finance.yahoo.com/markets/stocks/articles/alibaba-stock-down-nearly-27-124520043.html"
  },
  {
   "d": "2026-08-25",
   "h": "Alibaba's HK$80bn (about $10.2bn) Hong Kong placement, its first share sale since 2019, will fund AI infrastructure",
   "u": "https://www.chinadaily.com.cn/a/202608/25/WS6a8ced9de4b057c97e209899.html"
  },
  {
   "d": "2026-08-20",
   "h": "June-quarter revenue rose 9% to 269bn yuan; cloud and AI revenue up 45% to 48.4bn yuan; adjusted net income fell 38%, missing estimates",
   "u": "https://www.fool.com/investing/2026/08/20/alibaba-cloud-revenue-jumps-45-is-the-profit-plunge-and-china-e-commerce-slide-cause-for-concern/"
  }
 ],
 "005930": [
  {
   "d": "2026-10-29",
   "h": "Record Q3 operating profit of KRW107.4tn, the first ever above KRW100tn, as AI memory demand sells out 2027 HBM supply",
   "u": "https://finance.biggo.com/news/KR_005930.KS_2026-10-29"
  },
  {
   "d": "2026-09-30",
   "h": "TrendForce: Samsung expects HBM4 revenue to more than triple in Q3; foundry and LSI losses seen narrowing about 42% in 2026",
   "u": "https://www.trendforce.com/news/2026/09/30/news-samsung-foundry-loss-reportedly-seen-shrinking-42-yoy-in-2026-as-hbm4-base-die-4nm-demand-rises/"
  },
  {
   "d": "2026-09-21",
   "h": "Samsung reportedly plans to more than double HBM4/HBM4E output in 2027, raising monthly wafer input to 250,000 from 180,000",
   "u": "https://financefeeds.com/samsung-plans-to-more-than-double-hbm4-output-in-2027-nine-days-before-micron-reports/"
  },
  {
   "d": "2026-08-24",
   "h": "Shares fell 8.7% after the board approved a record 90–110trn won 2026 shareholder return but deferred buyback details to January",
   "u": "https://finance.yahoo.com/markets/stocks/articles/samsung-just-authorized-largest-shareholder-214601771.html"
  }
 ],
 "RELIANCE": [
  {
   "d": "2026-10-30",
   "h": "Q2 FY27 net profit up 27% to Rs29,250 crore on revenue up 28% as O2C EBITDA jumps 68%; retail EBITDA falls 8.6%",
   "u": "https://apacnewsnetwork.com/2026/10/reliance-q2-results-fy27-profit-revenue/"
  },
  {
   "d": "2026-10-30",
   "h": "Jio Platforms listing drew more than 22x subscription, making it India's second largest company",
   "u": "https://apacnewsnetwork.com/2026/10/reliance-q2-results-fy27-profit-revenue/"
  },
  {
   "d": "2026-10-05",
   "h": "Jio Platforms plans to open its roughly $3.8bn IPO, India's largest, on 21 October with listing expected on 28 October (Reuters)",
   "u": "https://www.financialexpress.com/market/ipo-news-mukesh-ambani-led-jio-platforms-ipo-likely-by-october-21-reuters-4353920/"
  },
  {
   "d": "2026-10-04",
   "h": "Price band reported at ₹1,300–1,450 a share, implying a valuation of around ₹15 lakh crore",
   "u": "https://www.fortuneindia.com/markets/ipo/jio-platforms-ipo-from-15-lakh-crore-valuation-to-october-listing-10-things-to-know/162707"
  }
 ],
 "INFY": [
  {
   "d": "2026-10-27",
   "h": "Cuts FY27 constant-currency revenue guidance to 1%-2% from 1.5%-3% after Q2 growth of 1.5%; operating margin target of 20%-22% kept",
   "u": "https://www.itechguides.com/infosys-q2-results-profit-rises-6-yoy-to-rs-7823-crore-company-cuts-fy27-revenue-guidance/"
  }
 ],
 "PDD": [
  {
   "d": "2026-08-25",
   "h": "Q2 revenue 112.4bn yuan, up 8% but below estimates; non-GAAP net income 28.5bn yuan, down 13% but ahead of consensus; shares rose 3%",
   "u": "https://www.caixinglobal.com/2026-08-25/pdd-shares-rise-after-earnings-beat-despite-slower-growth-at-temu-102477563.html"
  },
  {
   "d": "2026-08-25",
   "h": "Temu European monthly active users fell 30% after EU tariff policy changes on 1 July; global MAUs down 11% to 467 million in July",
   "u": "https://www.caixinglobal.com/2026-08-25/pdd-shares-rise-after-earnings-beat-despite-slower-growth-at-temu-102477563.html"
  }
 ],
 "SPCX": [
  {
   "d": "2026-09-28",
   "h": "Starship Flight 14, the first orbital Starship flight, carried Starlink V3 satellites and splashed down north of Hawaii after about three hours",
   "u": "https://spaceflightnow.com/tag/starship-flight-14/"
  },
  {
   "d": "2026-09-03",
   "h": "Shares reached $149.80, a seven-week high, after a 19% gain over four weeks",
   "u": "https://tradingeconomics.com/spcx:us/news/581014"
  },
  {
   "d": "2026-08-07",
   "h": "First major lock-up expiry released 911.5 million shares worth about $101bn; next large unlock due in early December",
   "u": "https://www.advisorperspectives.com/articles/2026/08/05/spacexs-101-billion-unlock-pressure-shares"
  },
  {
   "d": "2026-08-04",
   "h": "First quarterly report: Q2 revenue up 92% to $7.8bn vs $6.9bn consensus, net loss $541m; shares fell 7% after hours on $18.4bn capex",
   "u": "https://fortune.com/2026/08/04/spacex-revenue-surges-92-to-7-8-billion-blowing-past-wall-street-expectations-by-nearly-1-billion/"
  }
 ],
 "COIN": [
  {
   "d": "2026-10-29",
   "h": "Q3 revenue falls 34% to $1.16bn and adjusted EBITDA drops 58% as trading cools; prediction markets pass $200m of annualised revenue",
   "u": "https://www.cryptotimes.io/2026/10/30/coinbase-q3-report-shows-719m-profit-but-adjusted-ebitda-falls-58/"
  },
  {
   "d": "2026-10-05",
   "h": "Bank of America raised its target to $203 from $174, Buy, citing stablecoin revenue after the Fed's September 2026 rate hike",
   "u": "https://cryptobriefing.com/bank-of-america-coinbase-price-target-203"
  },
  {
   "d": "2026-10-02",
   "h": "Shares fell 3.8% to $182.09 despite Wells Fargo initiating with a $200 target and Piper Sandler raising to $170",
   "u": "https://www.benzinga.com/trading-ideas/movers/26/10/62139960/coinbase-stock-drops-whats-going-on"
  }
 ],
 "CRWV": [
  {
   "d": "2026-10-02",
   "h": "Jefferies reiterated Buy, $150 target, noting short-dated contracts priced at about $40m per megawatt annualised",
   "u": "https://finance.yahoo.com/technology/ai/articles/coreweave-capacity-constraints-bolster-jefferies-170200559.html"
  },
  {
   "d": "2026-09-01",
   "h": "Shares near $85, about $50 below the May peak of $136.80; full-year capex guidance raised to $35-39bn",
   "u": "https://247wallst.com/investing/2026/09/01/coreweave-offers-so-much-at-85/"
  },
  {
   "d": "2026-08-11",
   "h": "Q2 revenue $2.575bn, up 112%; net loss $626m; backlog $104bn plus $25bn of early-Q3 commitments",
   "u": "https://www.sec.gov/Archives/edgar/data/0001769628/000176962826000362/coreweave2q26earningspress.htm"
  }
 ],
 "VRT": [
  {
   "d": "2026-10-28",
   "h": "Q3 sales up 61% and organic orders more than double; guidance raised and customers have prepaid $4.1bn",
   "u": "https://www.stocktitan.net/articles/vertiv-q3-2026-earnings-customers-prepaid-4-billion"
  },
  {
   "d": "2026-10-05",
   "h": "BMO initiated at Outperform with a $329 target, with shares at $252.18, saying the market has absorbed much of the bad news",
   "u": "https://cryptobriefing.com/bmo-initiates-vertiv-outperform-329-target/"
  },
  {
   "d": "2026-10-02",
   "h": "Shares down 34.6% from their 52-week peak after second-quarter revenue delays on large multi-phase projects; Q3 results expected around 28 October",
   "u": "https://finance.yahoo.com/markets/stocks/articles/vertiv-stocks-fall-bargain-warning-090519447.html"
  }
 ],
 "ANET": [
  {
   "d": "2026-10-02",
   "h": "Shares closed at $207.35, up 1.4% on the day",
   "u": "https://www.marketwatch.com/data-news/arista-networks-inc-stock-underperforms-friday-when-compared-to-competitors-despite-daily-gains-c16b3aef-1c9af889a943"
  },
  {
   "d": "2026-08-04",
   "h": "Q2 revenue $3.036bn, up 37.7%, first $3bn quarter; non-GAAP EPS $1.02 vs $0.89 expected; Q3 guided to about $3.3bn",
   "u": "https://www.arista.com/en/company/news/press-release/24401-pr-20260804"
  }
 ],
 "RKLB": [
  {
   "d": "2026-09-30",
   "h": "Synspective ordered 20 more Electron launches for 2028-2031, the largest commercial Electron contract; launch backlog now above 100 missions",
   "u": "https://www.fool.com/investing/2026/10/03/rocket-lab-just-signed-the-biggest-commercial-electron-deal-in-its-history-its-launch-backlog-now-tops-100/"
  }
 ],
 "IONQ": [
  {
   "d": "2026-09-08",
   "h": "2026 revenue guidance raised to $450-460m from $280-290m, mostly from the SkyWater foundry; sixth-generation Superion 256 unveiled for 2027 delivery",
   "u": "https://www.fool.com/investing/2026/09/08/ionq-just-raised-its-2026-revenue-outlook-by-about-60-most-of-the-raise-isn-t-quantum-computing/"
  }
 ],
 "MSTR": [
  {
   "d": "2026-10-29",
   "h": "Q3 net income of about $19bn on bitcoin gains as holdings reach 848,517 BTC",
   "u": "https://www.gurufocus.com/news/9158307/strategy-inc-mstr-q3-2026-earnings-call-highlights-record-191-billion-net-income-as-bitcoin-holdings-reach-848517-btc"
  },
  {
   "d": "2026-10-05",
   "h": "Holdings reached 848,000 BTC after buying 334 BTC; company expects a $20.91bn unrealised Q3 gain on digital assets; USD reserve $4.88bn",
   "u": "https://www.theblock.co/news/business/2026-10-05-more-orange-than-ever-michael-saylor-strategy-bitcoin-417631"
  },
  {
   "d": "2026-09-22",
   "h": "Shares more than doubled from $81.81 in late June to $169.52 as bitcoin rose above $85,000; mNAV about 1.22x",
   "u": "https://www.ig.com/uk/news-and-trade-ideas/strategy-shares-why-the-bitcoin-treasury-company-is-rallying-so--260922"
  },
  {
   "d": "2026-08-10",
   "h": "Strategy sold 1,690 BTC for $108.6m to repurchase STRC preferred stock, its latest in a run of summer bitcoin sales",
   "u": "https://www.thestreet.com/crypto/markets/strategy-stock-slides-after-108m-sale"
  }
 ],
 "ADI": [
  {
   "d": "2026-08-19",
   "h": "Fiscal Q3 revenue $4.02bn, up 40% and above estimates; adjusted EPS $3.45; Q4 guided to $4.3bn and $3.86 EPS",
   "u": "https://finance.yahoo.com/markets/stocks/articles/analog-devices-adi-down-2-153001627.html"
  }
 ],
 "MRVL": [
  {
   "d": "2026-08-27",
   "h": "Q2 FY27 revenue $2.739bn, up 37%, data centre up 46%; non-GAAP EPS $0.94; Q3 guided to $3.15bn and $1.10 EPS",
   "u": "https://finance.yahoo.com/markets/stocks/articles/marvell-technology-inc-reports-second-200500261.html"
  }
 ],
 "SNPS": [
  {
   "d": "2026-10-01",
   "h": "Shares jumped about 10% after the investor day outlook and OpenAI and AWS deals",
   "u": "https://www.msn.com/en-us/news/other/synopsys-shares-jump-on-robust-growth-outlook-openai-and-aws-deals/ar-AA2dm6An"
  },
  {
   "d": "2026-09-30",
   "h": "Investor day: FY27 revenue target $11.15bn (about 15% growth), about $1bn buyback, GPT-Synopsys with OpenAI and multi-year Amazon IP deal",
   "u": "https://www.prnewswire.com/news-releases/synopsys-details-growth-strategy-and-long-term-financial-model-at-2026-investor-day-302894684.html"
  },
  {
   "d": "2026-08-26",
   "h": "Fiscal Q3 revenue $2.477bn; non-GAAP EPS $3.91 vs $3.67 expected; FY26 guidance raised to $9.715bn revenue midpoint",
   "u": "https://www.aol.com/articles/synopsys-posts-financial-results-third-200500000.html"
  }
 ],
 "CDNS": [
  {
   "d": "2026-10-26",
   "h": "Q3 revenue $1.63bn, up 22%; record $8.2bn backlog; 2026 outlook raised for the third time, to about 21% growth",
   "u": "https://www.sec.gov/Archives/edgar/data/0000813672/000081367226000116/cdns10262026ex9901.htm"
  },
  {
   "d": "2026-09-24",
   "h": "Expanded TSMC partnership covering A14 certification, N3P/N2P IP and wafer-scale 3D-IC flows",
   "u": "https://www.hpcwire.com/aiwire/2026/09/24/cadence-expands-tsmc-partnership-for-ai-and-hpc-chip-design/"
  }
 ],
 "NXPI": [
  {
   "d": "2026-10-27",
   "h": "Q3 revenue $3.79bn, up 19%; automotive $2.07bn, up 13%; Q4 guided to $3.75-3.95bn",
   "u": "https://www.sec.gov/Archives/edgar/data/0001413447/000141344726000057/nxp3q26exhibit991.htm"
  },
  {
   "d": "2026-08-04",
   "h": "CEO Rafael Sotomayor said Q2 revenue rose 19.5% to $3.50bn, above estimates; Q3 guided to $3.75bn midpoint, also above consensus",
   "u": "https://markets.financialcontent.com/startribune/article/stockstory-2026-8-4-5-insightful-analyst-questions-from-nxp-semiconductorss-q2-earnings-call"
  }
 ],
 "IBM": [
  {
   "d": "2026-10-21",
   "h": "Q3 revenue $17.1bn, up 5%; software up 8% to $7.8bn; free cash flow outlook raised",
   "u": "https://www.sec.gov/Archives/edgar/data/0000051143/000005114326000093/ibm-20261021xex991.htm"
  },
  {
   "d": "2026-10-01",
   "h": "Hagens Berman opened a securities investigation into IBM's Z mainframe disclosures after the July 2026 shortfall erased over $68bn of market value in one day.",
   "u": "https://www.prnewswire.com/news-releases/international-business-machines-corporation-ibm-68-billion-wipeout-amid-z-shortfall-triggers-investigation---hbss-302896343.html"
  }
 ],
 "CSCO": [
  {
   "d": "2026-08-12",
   "h": "Q4 FY26 revenue $17.3bn, up 18%, adjusted EPS $1.22 vs $1.17 expected; AI infrastructure orders $4bn in the quarter and $9.3bn for FY26.",
   "u": "https://investor.cisco.com/news/news-details/2026/CISCO-REPORTS-FOURTH-QUARTER-AND-FISCAL-YEAR-2026-EARNINGS/default.aspx"
  },
  {
   "d": "2026-08-12",
   "h": "Cisco guided FY27 revenue to $72.2–73.4bn and adjusted EPS to $5.05–5.11, expecting about $7.5bn of AI revenue in FY27.",
   "u": "https://investor.cisco.com/news/news-details/2026/CISCO-REPORTS-FOURTH-QUARTER-AND-FISCAL-YEAR-2026-EARNINGS/default.aspx"
  },
  {
   "d": "2026-08-12",
   "h": "Shares fell over 4% after hours as adjusted gross margin slipped to 66.3% from 68.4%, after a 60% rally in 2026.",
   "u": "https://cryptobriefing.com/cisco-record-results-ai-supercycle-stock-pullback/"
  }
 ],
 "INTU": [
  {
   "d": "2026-08-25",
   "h": "Q4 FY26 revenue up 14% to $4.4bn and FY26 revenue up 14% to $21.4bn; FY27 guided to 9–10% revenue growth, with TurboTax at 2–3% and Mailchimp at -1% to 0%.",
   "u": "https://www.sec.gov/Archives/edgar/data/0000896878/000089687826000029/fy26q4earningspressrelease.htm"
  }
 ],
 "PANW": [
  {
   "d": "2026-09-02",
   "h": "Shares fell about 8% to $332.30 as next-generation security ARR of $9.1bn missed expectations and fiscal 2027 ARR growth was guided to 22–23%.",
   "u": "https://247wallst.com/investing/2026/09/02/palo-alto-sinks-8-despite-34-revenue-growth-crowdstrike-falls-3-fortinet-slips/"
  },
  {
   "d": "2026-09-01",
   "h": "Q4 FY26 revenue $3.41bn, up 34% vs $3.35bn expected; NGS ARR up 63% to $9.1bn; RPO up 34% to $21.2bn.",
   "u": "https://www.paloaltonetworks.com/company/press/2026/palo-alto-networks-reports-fiscal-fourth-quarter-and-fiscal-year-2026-financial-results"
  },
  {
   "d": "2026-09-01",
   "h": "FY27 guidance: revenue $14.10–14.20bn (23–24% growth), NGS ARR $11.075–11.175bn, adjusted EPS $4.16–4.19.",
   "u": "https://www.paloaltonetworks.com/company/press/2026/palo-alto-networks-reports-fiscal-fourth-quarter-and-fiscal-year-2026-financial-results"
  }
 ],
 "ACN": [
  {
   "d": "2026-10-01",
   "h": "Q4 FY26 revenue $18.7bn, up 7% in local currency and above guidance; adjusted EPS $3.29 vs about $3.18 expected; bookings $22.2bn.",
   "u": "https://www.sec.gov/Archives/edgar/data/0001467373/000146737326000037/q4fy26earnings8-kexhibit.htm"
  },
  {
   "d": "2026-10-01",
   "h": "FY27 guidance of 3–6% local-currency revenue growth and EPS of $14.39–14.81, with at least $9.5bn of shareholder returns; dividend raised 5% to $1.71.",
   "u": "https://pulse2.com/accenture-reports-q4-revenue-of-18-7-billion-and-fy2026-revenue-of-74-2-billion/"
  }
 ],
 "BKNG": [
  {
   "d": "2026-09-23",
   "h": "Booking shares fell 5% to $156.02 after Meta launched Muse, an AI agent that can complete travel bookings directly with airlines and hotels.",
   "u": "https://247wallst.com/investing/2026/09/23/travel-booking-stocks-tumble-as-muse-threatens-to-bypass-them-expedia-falls-7-airbnb-drops-6-booking-holdings-sinks-5/"
  }
 ],
 "PFE": [
  {
   "d": "2026-08-04",
   "h": "Q2 revenue $15.03bn, up 3%, and adjusted EPS $0.77 beat estimates; GAAP loss on $4.3bn impairments; 2026 revenue guidance raised to $60.5–62.5bn.",
   "u": "https://www.rttnews.com/3675124/pfizer-slips-to-loss-in-q2-revenues-rise-backs-fy26-earnings-view-lifts-revenue-forecast.aspx?type=qf"
  }
 ],
 "TMO": [
  {
   "d": "2026-10-21",
   "h": "Q3 revenue up 9% to $12.14bn with 6% organic growth; adjusted EPS of $6.68 beats the $6.40 consensus",
   "u": "https://finviz.com/news/405542/thermo-fisher-scientific-reports-9-revenue-growth-as-third-quarter-earnings-beat-estimates"
  },
  {
   "d": "2026-10-05",
   "h": "JPMorgan added Thermo Fisher to its October picks, citing AI in medical tools, a Mayo Clinic joint venture and US drug-manufacturing reshoring; shares up 25% in three months.",
   "u": "https://www.tipranks.com/news/jpmorgan-adds-american-express-liberty-energy-and-thermo-fisher-to-october-stock-picks-list-heres-why"
  },
  {
   "d": "2026-09-25",
   "h": "Deutsche Bank raised its target to $720 from $635, saying execution and end-market improvement support high-single-digit growth by 2028.",
   "u": "https://www.tipranks.com/news/the-fly/thermo-fisher-price-target-raised-to-720-from-635-at-deutsche-bank-thefly-news"
  }
 ],
 "ABT": [
  {
   "d": "2026-10-21",
   "h": "Q3 sales up 14.5% to $13.0bn with Exact Sciences added, 7% comparable; 2026 adjusted EPS narrowed to $5.50-$5.55",
   "u": "https://stockhub.kr/en/insights/20261021-abt-cy26q3-earnings"
  },
  {
   "d": "2026-10-02",
   "h": "Rothschild & Co Redburn upgraded Abbott to Buy with a $127 target, saying Exact Sciences strengthens diagnostics growth and margins.",
   "u": "https://www.tipranks.com/news/the-fly/abbott-upgraded-to-buy-from-neutral-at-rothschild-co-redburn-thefly-news"
  },
  {
   "d": "2026-09-30",
   "h": "Abbott launched SimpleScreen CRC, a Freenome-developed blood test for colorectal cancer screening, alongside its stool-based Cologuard Plus.",
   "u": "https://www.prnewswire.com/news-releases/abbott-launches-simplescreen-crc-blood-test-joining-cologuard-plus-in-its-colorectal-cancer-screening-portfolio-302893281.html"
  },
  {
   "d": "2026-09-14",
   "h": "Abbott agreed to pay $385m to resolve DOJ, whistleblower and state claims over the 2022 Sturgis infant formula recall; criminal investigation closed.",
   "u": "https://abbott.mediaroom.com/2026-09-14-Abbott-reaches-agreement-with-Department-of-Justice-to-resolve-claims-relating-to-2022-infant-formula-recall"
  }
 ],
 "DHR": [
  {
   "d": "2026-10-21",
   "h": "Q3 revenue up 8.5% to $6.55bn with core growth of 5.5% excluding respiratory; 2026 adjusted EPS guide raised to $8.57-$8.62",
   "u": "https://grafa.com/en/news/united-states/danaher-q3-2026-revenue-6-55-billion-raises-guidance"
  },
  {
   "d": "2026-10-01",
   "h": "Julie Sawyer Montgomery became Danaher president and CEO, succeeding Rainer Blair, who stays as senior adviser to 31 March 2027; succession was announced 3 August 2026.",
   "u": "https://www.prnewswire.com/news-releases/julie-sawyer-montgomery-assumes-role-as-danaher-president-and-chief-executive-officer-302895293.html"
  }
 ],
 "BMY": [
  {
   "d": "2026-10-29",
   "h": "Q3 revenue up 6.9% to $13.07bn beats; 2026 revenue guide lifted to about $50bn while the EPS guide is cut on an in-process R&D charge",
   "u": "https://stockstory.org/us/stocks/nyse/bmy/news/earnings/bristol-myers-squibbs-nysebmy-q3-2026-sales-top-estimates"
  },
  {
   "d": "2026-10-05",
   "h": "Leerink downgraded BMS to Market Perform and cut its target to $59 from $73, doubting milvexian, admilparant and Cobenfy in Alzheimer's psychosis; shares fell about 4%.",
   "u": "https://www.tipranks.com/news/the-fly/leerink-downgrades-bristol-myers-to-market-perform-lowers-target-to-59-thefly-news"
  },
  {
   "d": "2026-09-30",
   "h": "FDA approved an expanded Camzyos indication for symptomatic obstructive hypertrophic cardiomyopathy, including paediatric patients.",
   "u": "https://www.businesswire.com/news/home/20260930516104/en/U.S.-Food-and-Drug-Administration-Approves-Expanded-Indication-for-Bristol-Myers-Squibb%E2%80%99s-CAMZYOS%C2%AE-mavacamten-for-the-Treatment-of-Symptomatic-Obstructive-Hypertrophic-Cardiomyopathy-oHCM-in-Adults-and-Pediatric-Patients*/"
  },
  {
   "d": "2026-09-25",
   "h": "Phase 3 EXCALIBER-RRMM: Zenbexus (iberdomide) with daratumumab met its MRD-negative complete response primary endpoint in relapsed multiple myeloma.",
   "u": "https://www.tipranks.com/news/the-fly/bristol-myers-reports-results-from-prespecified-analysis-of-excaliber-rrmm-trial-thefly-news"
  }
 ],
 "GILD": [
  {
   "d": "2026-09-15",
   "h": "Gilead agreed with PAHO on a regional pathway to supply twice-yearly lenacapavir for HIV prevention in 14 Latin American countries.",
   "u": "https://www.businesswire.com/news/home/20260915880261/en/"
  },
  {
   "d": "2026-08-28",
   "h": "FDA approved Bixlenvo, a once-daily bictegravir and lenacapavir tablet for virologically suppressed adults with HIV; shares slipped 2.3%.",
   "u": "https://www.tipranks.com/news/gilead-sciences-stock-gild-slips-2-despite-fda-approval-of-bixlenvo"
  }
 ],
 "ELV": [
  {
   "d": "2026-10-21",
   "h": "Q3 adjusted EPS up 16% to $6.99 as the benefit expense ratio improves 70bp to 90.6%; 2026 adjusted EPS outlook raised to at least $29.00",
   "u": "https://beancount.io/blog/2026/10/22/elevance-health-fy2026-q3-earnings-analysis"
  }
 ],
 "MDT": [
  {
   "d": "2026-09-14",
   "h": "Medtronic launched a split-off exchange offer for up to 225.4m MiniMed shares at a 7% discount, expiring 9 October 2026.",
   "u": "https://www.prnewswire.com/news-releases/medtronic-launches-exchange-offer-to-complete-separation-of-minimed-group-inc-302877119.html"
  },
  {
   "d": "2026-09-01",
   "h": "Q1 FY27 revenue $9.76bn, up 13.7% organically including about $570m from an extra week; cardiac ablation up 88%; FY27 guidance raised.",
   "u": "https://www.prnewswire.com/news-releases/medtronic-reports-first-quarter-fiscal-2027-results-delivers-broad-based-portfolio-performance-and-raises-fiscal-2027-guidance-302865648.html"
  },
  {
   "d": "2026-09-01",
   "h": "Medtronic is investing about $700m for rights to distribute Cornerstone Robotics' Sentire surgical robot alongside Hugo in select non-US markets.",
   "u": "https://www.prnewswire.com/news-releases/medtronic-announces-strategic-partnership-with-cornerstone-robotics-to-further-expand-global-access-to-robotic-assisted-surgery-302865504.html"
  }
 ],
 "WFC": [
  {
   "d": "2026-10-13",
   "h": "Q3 net income about $5.95bn, up 6%; EPS up 13%; average loans and deposits each up 11%; credit loss provisions up about 51%",
   "u": "https://www.vermoegenszentrum.ch/en/stock-exchange-and-markets/news/wells-fargo-q3-2026-net-income-rises-6-usd-595-billion-eps-climbs"
  },
  {
   "d": "2026-10-05",
   "h": "Morgan Stanley upgraded Wells Fargo to Overweight and a top pick with a $102 target, forecasting 17% ROTCE in the second half of 2027 and 18% in 2028.",
   "u": "https://www.tipranks.com/news/the-fly/wells-fargo-upgraded-to-overweight-from-equal-weight-at-morgan-stanley-thefly-news"
  },
  {
   "d": "2026-10-05",
   "h": "Goldman Sachs cut its target to $96 from $107, keeping Buy, citing normalising capital-markets activity, higher deposit costs and moderating capital returns.",
   "u": "https://www.tipranks.com/news/the-fly/wells-fargo-price-target-lowered-to-96-from-107-at-goldman-sachs-thefly-news"
  }
 ],
 "C": [
  {
   "d": "2026-10-13",
   "h": "Q3 revenue $23.8bn, up 8%; net income about $5.2bn, up roughly 40%; Services and Wealth revenue each up 15%",
   "u": "https://vestedfinance.com/blog/us-stocks/citigroup-q3-earnings-2026/"
  },
  {
   "d": "2026-10-05",
   "h": "Citi shares fell as much as 4.6% on 1 October with bank stocks as Treasury yields rose; Q3 results due 13 October",
   "u": "https://finance.yahoo.com/markets/stocks/articles/citigroup-reports-q3-earnings-october-160451058.html"
  },
  {
   "d": "2026-10-05",
   "h": "Citi, which owns about 51% of Banamex, expects to deconsolidate it in early 2027, moving a roughly $9bn currency translation loss into earnings",
   "u": "https://finance.yahoo.com/markets/stocks/articles/citigroup-reports-q3-earnings-october-160451058.html"
  },
  {
   "d": "2026-09-14",
   "h": "CFO Gonzalo Luchetti told the Barclays conference card spending was up about 6% and delinquencies were below a year earlier",
   "u": "https://finance.yahoo.com/markets/stocks/articles/citigroup-reports-q3-earnings-october-160451058.html"
  }
 ],
 "SCHW": [
  {
   "d": "2026-10-15",
   "h": "Record Q3: revenue $7.2bn, up 17%; EPS $1.62, up 29%; core net new assets $190.4bn, up 38%",
   "u": "https://www.securities.io/schwab-posts-record-q3-eps-as-net-new-assets-reach-190-4-billion/"
  },
  {
   "d": "2026-10-01",
   "h": "Schwab initiated a secondary listing of its shares on the Texas Stock Exchange",
   "u": "https://www.stocktitan.net/news/SCHW/"
  },
  {
   "d": "2026-09-17",
   "h": "Schwab scheduled its Fall Business Update webcast for 15 October 2026",
   "u": "https://www.financialcontent.com/article/bizwire-2026-9-17-schwab-announces-its-fall-business-update"
  },
  {
   "d": "2026-09-15",
   "h": "August core net new assets a record $64.8bn, up 46%; client assets $13.41tn; client cash fell to 8.8% of assets",
   "u": "https://www.stocktitan.net/news/SCHW/schwab-reports-monthly-activity-504uwj5m7w59.html"
  }
 ],
 "SPGI": [
  {
   "d": "2026-10-27",
   "h": "Reported Q3 results and announced a strategic review of Capital IQ and its associated data businesses",
   "u": "https://press.spglobal.com/2026-10-27-S-P-Global-Reports-Third-Quarter-Results-Announces-Strategic-Review-for-Capital-IQ-and-Associated-Data-Businesses"
  },
  {
   "d": "2026-09-26",
   "h": "S&P Global shares down 21.3% year to date at about $403 amid concern AI could erode its data and analytics business",
   "u": "https://finance.yahoo.com/markets/stocks/articles/p-global-spgi-stock-looks-071306522.html"
  },
  {
   "d": "2026-09-17",
   "h": "S&P Global agreed to acquire smart contract security firm OpenZeppelin, to sit within S&P Global Ratings; terms not disclosed",
   "u": "https://www.theblock.co/news/business/2026-09-17-sp-global-agrees-to-acquire-openzeppelin-in-onchain-security-push-415360"
  }
 ],
 "PGR": [
  {
   "d": "2026-10-14",
   "h": "Q3 EPS of $4.60 beats estimates as net premiums written rise 4% to $22.3bn and the combined ratio improves to 88.7",
   "u": "https://www.nasdaq.com/articles/progressives-q3-earnings-top-estimates-higher-premiums"
  },
  {
   "d": "2026-09-18",
   "h": "August net income fell 22% to $951m and combined ratio rose to 89.3 from 83.1; premiums written up 6%, policies in force up 7%",
   "u": "https://www.stocktitan.net/news/PGR/progressive-reports-august-2026-apnijbnjsyx7.html"
  }
 ],
 "CB": [
  {
   "d": "2026-10-20",
   "h": "Q3 core operating income $2.98bn, or $7.66 a share; combined ratio 84.1%; net premiums written up 1.9%",
   "u": "https://www.reinsurancene.ws/chubb-posts-record-5-79bn-pc-underwriting-income-for-first-nine-months-of-2026/"
  },
  {
   "d": "2026-09-30",
   "h": "Chubb will hold its third-quarter earnings call on 21 October 2026",
   "u": "https://news.chubb.com/2026-09-30-Chubb-Limited-to-Hold-its-Third-Quarter-Earnings-Conference-Call-on-Wednesday,-October-21,-2026"
  },
  {
   "d": "2026-09-21",
   "h": "Chubb split its global digital business into separate technology and partnership units under new heads",
   "u": "https://www.marketscreener.com/news/chubb-limited-announces-management-changes-effective-september-21-2026-ce785adbd189f524"
  }
 ],
 "PYPL": [
  {
   "d": "2026-10-27",
   "h": "Raises 2026 adjusted EPS guidance to $5.60 after Q3 EPS of $1.45 beats; revenue up 2% to $8.58bn, TPV up 6% to $487bn",
   "u": "https://finviz.com/news/408888/paypal-raises-2026-earnings-guidance-after-q3-profit-beats-forecasts-shares-rise-12"
  },
  {
   "d": "2026-08-28",
   "h": "Shares fell 12.7% to $53.66 after Bloomberg reported the Stripe and Advent International consortium abandoned its pursuit of PayPal",
   "u": "https://finance.yahoo.com/markets/stocks/articles/stock-market-today-aug-28-210044860.html"
  },
  {
   "d": "2026-08-14",
   "h": "Talks to sell PayPal to Stripe and Advent were reported to be intensifying",
   "u": "https://techcrunch.com/2026/08/14/talks-to-sell-paypal-to-stripe-and-advent-are-heating-up/"
  }
 ],
 "NKE": [
  {
   "d": "2026-10-01",
   "h": "Q1 FY27 revenue $11.21bn, down 4% (est. $11.32bn); EPS $0.48 beat $0.43; Greater China revenue down 26% currency-neutral",
   "u": "https://www.stocktitan.net/articles/nike-q1-fy2027-earnings-outlook-dividend"
  },
  {
   "d": "2026-10-01",
   "h": "FY27 guided to a high-single-digit revenue decline and adjusted EPS of $1.15-1.35, below the $1.61 consensus",
   "u": "https://www.stocktitan.net/sec-filings/NKE/8-k-nike-inc-reports-material-event-33f2ee1c28be.html"
  },
  {
   "d": "2026-10-01",
   "h": "Nike launched 'Pace' restructuring targeting about $2.5bn of savings through FY2031, with about $1bn of charges and a move to three geographies",
   "u": "https://www.stocktitan.net/sec-filings/NKE/8-k-nike-inc-reports-material-event-33f2ee1c28be.html"
  }
 ],
 "SBUX": [
  {
   "d": "2026-10-29",
   "h": "Fiscal Q4 global comparable sales up 7.2% with US comps up 7.7% and EPS up 54% as Back to Starbucks shifts from turnaround to growth",
   "u": "https://finance.biggo.com/news/US_SBUX_2026-10-29"
  },
  {
   "d": "2026-09-24",
   "h": "Board approved closing about 250 North America coffeehouses with about $300m of restructuring charges; FY26 net new stores cut to about 440 from 600-650",
   "u": "https://www.sec.gov/Archives/edgar/data/829224/000082922426000145/sbux-20260922.htm"
  },
  {
   "d": "2026-09-23",
   "h": "Niccol said 'Starbucks is back'; company reportedly plans about $1bn to remodel up to 9,000 North American company-operated stores",
   "u": "https://finance.yahoo.com/markets/stocks/articles/starbucks-sbux-back-next-1-140203733.html"
  }
 ],
 "LOW": [
  {
   "d": "2026-08-19",
   "h": "Q2 sales $26.0bn, comparable sales up 0.2%, adjusted EPS $4.40; 2026 outlook cut to low end, with comps now about flat",
   "u": "https://www.stocktitan.net/sec-filings/LOW/8-k-lowes-companies-inc-reports-material-event-b7114160e058.html"
  }
 ],
 "TGT": [
  {
   "d": "2026-09-24",
   "h": "Shares slipped to $156 from a near two-year high of about $171 after Target pulled a criticised Halloween costume",
   "u": "https://finance.yahoo.com/markets/stocks/articles/target-stock-156-down-170-114735089.html"
  },
  {
   "d": "2026-08-19",
   "h": "Q2 EPS $4.11 (incl. $1.65 tariff refund) vs $2.34 expected; comparable sales up 3.8%; full-year EPS guidance raised to $9.90-10.90",
   "u": "https://www.ttnews.com/articles/target-earnings-q2-2026"
  }
 ],
 "TJX": [
  {
   "d": "2026-08-21",
   "h": "Marmaxx comparable sales rose only 1%, which CEO Ernie Herrman blamed on self-inflicted merchandising errors",
   "u": "https://finance.yahoo.com/markets/stocks/articles/tjx-beats-q2-expectations-despite-110224640.html"
  },
  {
   "d": "2026-08-19",
   "h": "Q2 FY27 sales $15.2bn, comps up 4%, EPS $1.36 ($1.22 ex tariff refund); FY27 EPS guidance raised to $5.31-5.36",
   "u": "https://www.stocktitan.net/sec-filings/TJX/8-k-tjx-companies-inc-de-reports-material-event-db4c1ece23aa.html"
  },
  {
   "d": "2026-08-19",
   "h": "TJX raised its long-term global store target by 500 to 7,500, with store growth accelerating to 4% a year from FY28",
   "u": "https://www.stocktitan.net/sec-filings/TJX/8-k-tjx-companies-inc-de-reports-material-event-db4c1ece23aa.html"
  }
 ],
 "MO": [
  {
   "d": "2026-10-29",
   "h": "Q3 EPS of $1.51 and revenue of $6.13bn beat as pricing offsets falling cigarette volumes; 2026 guidance raised and buyback expanded",
   "u": "https://stockstory.org/us/stocks/nyse/mo/news/earnings/altrias-nysemo-q3-2026-beats-on-revenue"
  },
  {
   "d": "2026-08-27",
   "h": "Altria raised its quarterly dividend 4.7% to $1.11 a share, a 6.4% yield, its 61st increase in 57 years",
   "u": "https://investor.altria.com/press-releases/news-details/2026/Altria-Increases-Quarterly-Dividend-to-1-11-Per-Share/default.aspx"
  },
  {
   "d": "2026-08-22",
   "h": "Altria has repurchased about 22.4m shares for roughly $1.34bn under its current programme",
   "u": "https://finance.yahoo.com/markets/stocks/articles/altria-group-mo-higher-2026-080751758.html"
  }
 ],
 "MDLZ": [
  {
   "d": "2026-10-29",
   "h": "Q3 revenue up 2.3% to $9.97bn misses while adjusted EPS of $1.02 beats",
   "u": "https://www.stocktitan.net/news/MDLZ/mondelez-international-reports-q3-2026-148t1vrp1t4s.html"
  },
  {
   "d": "2026-09-09",
   "h": "At the Barclays conference Mondelez raised its 2026 revenue outlook but held EPS guidance, planning to reinvest the extra profit",
   "u": "https://in.investing.com/news/stock-market-news/mondelez-at-barclays-global-consumer-conference-growth-bets-widen-93CH-5586475"
  }
 ],
 "SLB": [
  {
   "d": "2026-10-23",
   "h": "Q3 revenue of $9.45bn beats as Data Center Solutions jumps 23% sequentially; Q4 revenue guided near $10bn",
   "u": "https://marketchameleon.com/articles/b/2026/10/23/slb-q3-2026-results-data-center-solutions-growth"
  },
  {
   "d": "2026-09-24",
   "h": "Aramco awarded SLB four integrated well construction contracts covering more than 450 wells in Saudi Arabia; value undisclosed",
   "u": "https://www.worldoil.com/news/2026/9/24/slb-to-deliver-more-than-450-wells-for-aramco-under-three-year-contracts/"
  }
 ],
 "EOG": [
  {
   "d": "2026-08-04",
   "h": "Q2 net income $2.72bn, free cash flow $2.80bn, $1.29bn of buybacks; volumes beat guidance; first oil production in the UAE",
   "u": "https://www.stocktitan.net/news/EOG/eog-resources-reports-second-quarter-2026-eldsvrmu1rjw.html"
  }
 ],
 "PSX": [
  {
   "d": "2026-10-28",
   "h": "Q3 earnings of $5.6bn as record refining margins and 98% utilisation drive a beat",
   "u": "https://www.tradingkey.com/news/earnings/262246590-tradingkey"
  },
  {
   "d": "2026-10-05",
   "h": "Refining EVP Rich Harbison to retire 31 December 2026; former Plains All American COO Chris Chandler to take over Refining on 1 January 2027",
   "u": "https://www.stocktitan.net/news/PSX/phillips-66-announces-refining-leadership-rs3hj1nybh9y.html"
  },
  {
   "d": "2026-08-11",
   "h": "Final investment decision on Western Gateway Pipeline JV (about $5.0bn EV) with Kinder Morgan and HF Sinclair; PSX 49.9%, about $2.5bn cash contribution, completion targeted 2029",
   "u": "https://www.stocktitan.net/news/KMI/phillips-66-kinder-morgan-and-hf-sinclair-announce-final-investment-ae9ks054jpm0.html"
  },
  {
   "d": "2026-08-05",
   "h": "Q2 2026 earnings $3.8bn ($9.55/share), realised refining margin $24.08/bbl vs $10.11 in Q1; total debt cut by $6.6bn to $20.6bn",
   "u": "https://www.stocktitan.net/news/PSX/phillips-66-delivers-strong-second-quarter-results-and-operating-umdn1whz7wl5.html"
  }
 ],
 "OXY": [
  {
   "d": "2026-10-13",
   "h": "Q3 operating update: production within guidance despite Gulf of America downtime, with a $94m hit from oil collars",
   "u": "https://www.minichart.com.sg/2026/10/13/occidental-q3-2026-production-in-line-94m-collar-hit-gulf-curbs/"
  },
  {
   "d": "2026-10-01",
   "h": "Occidental will report third-quarter 2026 results on 9 November, with the call on 10 November",
   "u": "https://www.stocktitan.net/news/OXY/occidental-to-announce-third-quarter-results-monday-november-9-2026-mwugqyoegvb1.html"
  },
  {
   "d": "2026-08-05",
   "h": "Q2 2026 adjusted EPS $2.40, production 1,433 Mboed above guidance, free cash flow before working capital $3.0bn; principal debt cut $1.9bn to $11.8bn",
   "u": "https://www.oxy.com/news/news-releases/occidental-announces-2nd-quarter-2026-results/"
  }
 ],
 "DUK": [
  {
   "d": "2026-09-03",
   "h": "Duke Energy Florida asked to lower 2027 rates, avoiding a previously planned 2% base rate increase",
   "u": "https://www.stocktitan.net/news/DUK/duke-energy-florida-requests-to-lower-rates-in-yt0vjd86sy6n.html"
  },
  {
   "d": "2026-08-04",
   "h": "Q2 2026 adjusted EPS $1.43 vs $1.25 a year earlier; 2026 adjusted EPS guidance of $6.55-$6.80 reaffirmed",
   "u": "https://www.sec.gov/Archives/edgar/data/0001326160/000132616026000037/er-20260630xearningsreleas.htm"
  }
 ],
 "SO": [
  {
   "d": "2026-09-21",
   "h": "Georgia Power agreed with Google, subject to PSC approval, on Vogtle and Hatch nuclear uprates adding about 96 MW",
   "u": "https://www.stocktitan.net/news/SO/georgia-power-agreement-with-google-to-provide-approximately-900-4rqna1fv8yhg.html"
  },
  {
   "d": "2026-09-10",
   "h": "Georgia PSC approved 1,137 MW of new solar power purchase agreements for Georgia Power",
   "u": "https://www.stocktitan.net/news/SO/georgia-power-receives-approval-for-1-137-mw-of-new-solar-power-zm4qh0ymdad0.html"
  },
  {
   "d": "2026-08-26",
   "h": "Georgia PSC approved Georgia Power's contract to serve OpenAI's 3,200 MW Effingham County project, with OpenAI paying full infrastructure costs",
   "u": "https://www.stocktitan.net/news/SO/georgia-power-s-contract-with-open-ai-approved-latest-approval-part-k1trg0a7u6tp.html"
  }
 ],
 "UNP": [
  {
   "d": "2026-10-22",
   "h": "Q3 revenue up 15% to $7.2bn and adjusted EPS up 15% to $3.53 on record net income; Norfolk Southern merger expected to close in the second half of 2027",
   "u": "https://www.tradingkey.com/news/transcripts/262233508-tradingkey"
  },
  {
   "d": "2026-09-24",
   "h": "Union Pacific will report third-quarter 2026 results on 22 October",
   "u": "https://www.stocktitan.net/news/UNP/union-pacific-corporation-announces-third-quarter-2026-earnings-pvvjhjyey49b.html"
  },
  {
   "d": "2026-09-22",
   "h": "STB unanimously denied opponents' requests to dismiss the revised Union Pacific-Norfolk Southern merger application; companies expect completion in the second half of 2027",
   "u": "https://www.stocktitan.net/news/NSC/union-pacific-railroad-and-norfolk-southern-combination-gains-gl5wv4cuybzu.html"
  },
  {
   "d": "2026-09-16",
   "h": "More than 500 customers backed the Norfolk Southern combination; companies cite about $3.5bn of annual customer savings and 2.1m truckloads shifted to rail",
   "u": "https://www.stocktitan.net/news/NSC/more-than-500-customers-back-union-pacific-norfolk-southern-phmdp9xvyap9.html"
  }
 ],
 "UPS": [
  {
   "d": "2026-10-27",
   "h": "Q3 revenue up 6.9% to $22.9bn and adjusted EPS of $1.69 beat despite lower volumes; full-year guidance raised and shares up 2%",
   "u": "https://markets.financialcontent.com/stocks/article/stockstory-2026-10-27-united-parcel-services-nyseups-q3-2026-beats-on-revenue-full-year-outlook-slightly-exceeds-expectations"
  },
  {
   "d": "2026-10-07",
   "h": "UPS plans to hire 100,000 seasonal workers for the 2026 peak season",
   "u": "https://www.stocktitan.net/news/UPS/ups-scales-seasonal-workforce-eyes-ninth-consecutive-peak-season-of-z7li7vyqxwii.html"
  },
  {
   "d": "2026-08-31",
   "h": "New global operating model and leadership changes from 1 September 2026, after the Amazon volume glide-down and network reconfiguration were completed in June 2026",
   "u": "https://www.stocktitan.net/news/UPS/ups-announces-executive-leadership-changes-and-new-global-operating-y4goqnms1tsj.html"
  },
  {
   "d": "2026-08-24",
   "h": "UPS outlined more than $2bn of investment from 2024 to 2028 across International, Healthcare and Supply Chain Solutions",
   "u": "https://www.stocktitan.net/news/UPS/ups-invests-more-than-2-billion-to-give-customers-even-faster-lh4v9v62htup.html"
  }
 ],
 "ETN": [
  {
   "d": "2026-09-25",
   "h": "Eaton agreed to buy Italian medium-voltage switchgear maker COL Group from Oaktree for EUR 810m enterprise value; close expected Q1 2027",
   "u": "https://www.stocktitan.net/news/ETN/eaton-signs-agreement-to-acquire-col-group-expanding-manufacturing-xnj8yq730xp3.html"
  },
  {
   "d": "2026-09-02",
   "h": "Eaton to invest over $242m in a North Little Rock, Arkansas modular enclosure plant, doubling US Fibrebond capacity",
   "u": "https://www.stocktitan.net/news/ETN/eaton-expands-manufacturing-for-modular-electrical-enclosures-with-7god8u3ifn49.html"
  },
  {
   "d": "2026-08-17",
   "h": "Eaton and Trane Technologies released a joint AI data centre power and cooling reference design",
   "u": "https://www.stocktitan.net/news/TT/trane-technologies-and-eaton-collaborate-on-industry-first-reference-8t1pp5rrxx03.html"
  }
 ],
 "EMR": [
  {
   "d": "2026-08-13",
   "h": "Emerson won a multi-million-dollar automation contract for the BP-operated Shah Deniz compression project",
   "u": "https://www.stocktitan.net/news/EMR/emerson-to-automate-bp-operated-shah-deniz-compression-fjwxhtkrs5ig.html"
  },
  {
   "d": "2026-08-06",
   "h": "Emerson acquired AI test-and-measurement start-up Glue Inc.; terms not disclosed",
   "u": "https://www.stocktitan.net/news/EMR/emerson-acquires-glue-inc-to-accelerate-ai-driven-test-measurement-r1asp1gy83jl.html"
  },
  {
   "d": "2026-08-04",
   "h": "Q3 FY26 net sales up 7% to $4.87bn, adjusted EPS $1.71; FY26 outlook raised to adjusted EPS about $6.55 and free cash flow about $3.6bn",
   "u": "https://www.stocktitan.net/news/EMR/emerson-reports-third-quarter-2026-results-raises-2026-eb4kpvst3x47.html"
  }
 ],
 "GD": [
  {
   "d": "2026-10-30",
   "h": "Q3 revenue up nearly 13% to $14.6bn and EPS of $4.49 beat on Gulfstream and shipbuilding; backlog jumps to a record $220bn",
   "u": "https://www.indexbox.io/blog/general-dynamics-q3-profit-and-revenue-beat-estimates-on-gulfstream-and-shipbuilding-strength/"
  },
  {
   "d": "2026-10-07",
   "h": "Board elected president Danny Deep CEO effective 1 January 2027; Phebe Novakovic, CEO since 2013, becomes executive chairman",
   "u": "https://www.stocktitan.net/news/GD/deep-elected-ceo-of-general-dynamics-novakovic-to-executive-msel380g4k4y.html"
  },
  {
   "d": "2026-08-07",
   "h": "GDIT won a $1.3bn Army National Guard network operations and cybersecurity contract (one-year base plus six option years)",
   "u": "https://www.stocktitan.net/news/GD/gdit-awarded-1-3-billion-enterprise-network-operations-and-rowngz8gk8yt.html"
  },
  {
   "d": "2026-08-06",
   "h": "Danny Deep, president since December 2025, elected to the General Dynamics board",
   "u": "https://www.stocktitan.net/news/GD/general-dynamics-elects-danny-deep-to-board-of-0kgrvygbhc9z.html"
  }
 ],
 "NOC": [
  {
   "d": "2026-10-20",
   "h": "Q3 profit beats and backlog reaches a record $109.6bn; full-year guidance raised",
   "u": "https://www.stocktitan.net/articles/northrop-grumman-q3-2026-earnings-record-backlog"
  },
  {
   "d": "2026-09-17",
   "h": "Northrop will report third-quarter 2026 results on 20 October",
   "u": "https://www.stocktitan.net/news/NOC/northrop-grumman-announces-date-for-third-quarter-2026-financial-cc6pklv12rta.html"
  },
  {
   "d": "2026-09-14",
   "h": "Air Force and Northrop assembled an inert Sentinel missile; flight test planned for 2027",
   "u": "https://www.stocktitan.net/news/NOC/u-s-air-force-and-northrop-grumman-assemble-inert-missile-progress-z9rnb8zhr078.html"
  },
  {
   "d": "2026-08-03",
   "h": "Framework agreements worth over $3bn: $2bn for PAC-3 MSE solid rocket motors and $1bn over seven years for THAAD components",
   "u": "https://www.stocktitan.net/news/NOC/northrop-grumman-enters-into-3-billion-landmark-agreements-to-bmbqb2rxzbaa.html"
  }
 ],
 "T": [
  {
   "d": "2026-10-21",
   "h": "Q3 brings a record 769,000 internet net adds and the best service revenue growth in more than four years; EPS outlook raised",
   "u": "https://marketchameleon.com/articles/b/2026/10/21/t-q3-2026-advanced-connectivity-record-internet-net-adds"
  },
  {
   "d": "2026-10-06",
   "h": "AT&T to form a 50/50 wholesale fibre JV with GIP and CPP Investments combining Lumen-acquired fibre assets and Gigapower; proceeds at close in H1 2027",
   "u": "https://www.stocktitan.net/news/T/at-t-global-infrastructure-partners-and-cpp-investments-to-form-new-w20o7168um5y.html"
  },
  {
   "d": "2026-10-01",
   "h": "AT&T, T-Mobile and Verizon formed a joint venture pooling spectrum to extend satellite and rural coverage",
   "u": "https://www.stocktitan.net/news/T/at-t-t-mobile-and-verizon-launch-joint-venture-that-helps-end-dead-oj4qt21w7ljt.html"
  },
  {
   "d": "2026-09-29",
   "h": "Multi-year fibre supply agreement with Corning worth more than $3bn; AT&T reiterated its outlook",
   "u": "https://www.stocktitan.net/news/T/at-t-and-corning-team-up-to-engineer-the-connected-world-with-wt7i3ixldcbm.html"
  }
 ],
 "VZ": [
  {
   "d": "2026-10-26",
   "h": "Record Q3 postpaid phone and account additions and a $2bn AWS fiber deal; full-year guidance raised despite a revenue miss",
   "u": "https://www.gurufocus.com/news/9142843/verizon-vz-reports-strong-q3-2026-with-postpaid-growth-and-2b-aws-fiber-deal"
  },
  {
   "d": "2026-10-01",
   "h": "Verizon, AT&T and T-Mobile formed a joint venture pooling spectrum to extend satellite and rural coverage",
   "u": "https://www.stocktitan.net/news/T/at-t-t-mobile-and-verizon-launch-joint-venture-that-helps-end-dead-oj4qt21w7ljt.html"
  },
  {
   "d": "2026-09-28",
   "h": "Verizon will report third-quarter 2026 results on 26 October",
   "u": "https://www.stocktitan.net/news/VZ/verizon-to-report-third-quarter-earnings-october-26-qysv5q0kmy0k.html"
  }
 ],
 "TMUS": [
  {
   "d": "2026-10-29",
   "h": "Q3 revenue up 7% to $23.6bn and EPS of $3.22 beat as postpaid revenue grows 9%; outlook raised",
   "u": "https://telecomlead.com/5g/t-mobile-q3-2026-revenue-rises-7-to-23-6-billion-profit-jumps-27-as-5g-broadband-and-fiber-drive-growth-128443"
  },
  {
   "d": "2026-10-01",
   "h": "T-Mobile, AT&T and Verizon formed a joint venture pooling spectrum to extend satellite and rural coverage",
   "u": "https://www.stocktitan.net/news/T/at-t-t-mobile-and-verizon-launch-joint-venture-that-helps-end-dead-oj4qt21w7ljt.html"
  },
  {
   "d": "2026-09-24",
   "h": "Quarterly dividend raised 15% to $1.17 per share",
   "u": "https://www.stocktitan.net/news/TMUS/t-mobile-announces-a-15-quarterly-dividend-jm0x8pa8eqzk.html"
  },
  {
   "d": "2026-09-17",
   "h": "Shares fell 5.6% to about $166, a one-year low and 17% down year to date, amid slower account growth and legacy plan migration",
   "u": "https://www.trefis.com/stock/tmus/articles/615852/how-much-further-can-t-mobile-stock-fall-from-here/2026-09-18"
  }
 ],
 "CMCSA": [
  {
   "d": "2026-10-22",
   "h": "Q3 revenue of $29.3bn and adjusted EPS of $1.07 beat as Peacock turns profitable and the World Cup helps, while broadband revenue keeps falling",
   "u": "https://variety.com/2026/tv/news/comcast-q3-boosted-fifa-world-cup-odyssey-revenue-downturn-1236919567/"
  },
  {
   "d": "2026-09-23",
   "h": "Comcast's network footprint passed more than 65 million homes and businesses after a New Hampshire expansion",
   "u": "https://www.stocktitan.net/news/CMCSA/xfinity-and-comcast-business-reliable-high-speed-internet-now-ope4udl83mce.html"
  }
 ],
 "DIS": [
  {
   "d": "2026-09-18",
   "h": "Disney named Character.AI CEO Karandeep Anand to a new chief technology officer role reporting to CEO Josh D'Amaro",
   "u": "https://www.stocktitan.net/news/DIS/the-walt-disney-company-names-karandeep-anand-to-newly-created-role-71c78s3nmzgh.html"
  },
  {
   "d": "2026-09-17",
   "h": "Adam Smith named Chairman, Direct-to-Consumer, overseeing Disney+ and Hulu",
   "u": "https://www.stocktitan.net/news/DIS/adam-smith-named-chairman-direct-to-consumer-disney-frgkhes2b7el.html"
  },
  {
   "d": "2026-08-05",
   "h": "Fiscal Q3 2026 adjusted EPS $2.06, up 28%; revenue $25.2bn; fiscal 2026 buyback target raised to at least $9bn",
   "u": "https://www.sec.gov/Archives/edgar/data/0001744489/000174448926000056/fy2026_q3xerxex991.htm"
  }
 ],
 "MCHP": [
  {
   "d": "2026-08-06",
   "h": "June 2026 quarter net sales $1.485 bn, up 38% year on year; non-GAAP EPS $0.76 vs $0.70 expected; September quarter guided up 7-9% sequentially.",
   "u": "https://www.sec.gov/Archives/edgar/data/0000827054/000082705426000037/exhibit991q1fy27.htm"
  },
  {
   "d": "2026-08-06",
   "h": "Management guided non-GAAP gross margin to 66-67%, warned against modelling it higher, and said excess cash goes to debt reduction rather than buybacks.",
   "u": "https://in.investing.com/news/transcripts/earnings-call-transcript-microchip-technology-beats-q1-2026-estimates-shares-jump-93CH-5542971"
  }
 ],
 "MPWR": [
  {
   "d": "2026-10-29",
   "h": "Q3 revenue $1.20bn, up 63%; Q4 guided to $1.315-1.385bn",
   "u": "https://www.sec.gov/Archives/edgar/data/0001280452/000162828026068202/mpwr-20260930xexx991.htm"
  },
  {
   "d": "2026-09-09",
   "h": "Signed a long-term manufacturing agreement to run its proprietary process at GlobalFoundries' 300mm Singapore fab, adding capacity from early 2027.",
   "u": "https://markets.financialcontent.com/lethbridgeherald.com/article/gnwcq-2026-9-9-globalfoundries-and-monolithic-power-systems-form-manufacturing-partnership-to-scale-high-performance-power-solutions"
  }
 ],
 "TER": [
  {
   "d": "2026-10-27",
   "h": "Q3 revenue $1.31bn, up 70% on AI test demand; Q4 guided to $1.25-1.35bn, roughly flat",
   "u": "https://www.sec.gov/Archives/edgar/data/0000097210/000119312526434981/ter-ex99_1.htm"
  },
  {
   "d": "2026-10-06",
   "h": "Launched the Titan HP platform with burn-in capabilities for advanced AI data-centre devices.",
   "u": "https://markets.financialcontent.com/lethbridgeherald.com/article/bizwire-2026-10-6-teradyne-introduces-titan-hp-platform-with-burn-in-capabilities-for-advanced-ai-data-center-devices"
  },
  {
   "d": "2026-09-29",
   "h": "Announced the Magnum E2 memory tester aimed at next-generation memory test demand from AI and high-performance computing.",
   "u": "https://markets.financialcontent.com/lethbridgeherald.com/article/bizwire-2026-9-29-teradyne-announces-magnum-e2-to-address-next-generation-memory-test-demands-driven-by-ai-and-high-performance-computing"
  }
 ],
 "GFS": [
  {
   "d": "2026-10-08",
   "h": "Agreed with TSMC to build a US-based supply of silicon interposers for CoWoS advanced packaging at its Malta, New York fab; initial five-year term, volume ramp from first half 2028.",
   "u": "https://markets.financialcontent.com/lethbridgeherald.com/article/gnwcq-2026-10-8-globalfoundries-reaches-agreement-to-establish-us-based-supply-of-silicon-interposers-for-advanced-ai-packaging"
  },
  {
   "d": "2026-09-09",
   "h": "Signed a long-term manufacturing partnership with Monolithic Power Systems at its Singapore 300mm fab, with added capacity from early 2027.",
   "u": "https://markets.financialcontent.com/lethbridgeherald.com/article/gnwcq-2026-9-9-globalfoundries-and-monolithic-power-systems-form-manufacturing-partnership-to-scale-high-performance-power-solutions"
  },
  {
   "d": "2026-09-08",
   "h": "Finalised a $375 million US Department of Commerce R&D award for quantum technology.",
   "u": "https://markets.financialcontent.com/lethbridgeherald.com/article/gnwcq-2026-9-8-globalfoundries-and-us-department-of-commerce-finalize-375m-r-and-d-award-to-advance-american-quantum-leadership"
  },
  {
   "d": "2026-08-05",
   "h": "Q2 2026 revenue $1.786 bn, up 6% year on year and above guidance; non-IFRS gross margin 29.9%; Q3 guided to $1.885 bn.",
   "u": "https://www.sec.gov/Archives/edgar/data/0001709048/000170904826000218/globalfoundries2q2026earni.htm"
  }
 ],
 "SNOW": [
  {
   "d": "2026-09-02",
   "h": "Q2 FY27 product revenue $1.49 bn, up 37% year on year; net revenue retention 126%; RPO $9.0 bn, up 30%.",
   "u": "https://www.sec.gov/Archives/edgar/data/0001640147/000164014726000033/fy2027q2earnings.htm"
  },
  {
   "d": "2026-09-02",
   "h": "Raised FY27 product revenue guidance to $6.07 bn (36% growth) from $5.84 bn; guided Q3 product revenue to $1.588-1.593 bn.",
   "u": "https://www.sec.gov/Archives/edgar/data/0001640147/000164014726000033/fy2027q2earnings.htm"
  }
 ],
 "DDOG": [
  {
   "d": "2026-08-06",
   "h": "Q2 2026 revenue $1.12 bn, up 36% year on year vs $1.08 bn expected; EPS $0.65 vs $0.58; full-year revenue guide raised to $4.45-4.47 bn.",
   "u": "https://www.investing.com/news/earnings/datadog-sinks-17-despite-raised-guidance-q2-beat-4841479"
  },
  {
   "d": "2026-08-06",
   "h": "Shares fell about 21% in premarket trading despite the beat, after hitting a record close earlier that week.",
   "u": "https://www.investing.com/news/earnings/datadog-sinks-17-despite-raised-guidance-q2-beat-4841479"
  }
 ],
 "WDAY": [
  {
   "d": "2026-08-27",
   "h": "Q2 FY27 subscription revenue $2.471 bn, up 13.9%; non-GAAP operating margin 31.1%; board added a $4.0 bn buyback.",
   "u": "https://www.placera.se/pressmeddelanden/workday-workday-announces-fiscal-2027-second-quarter-financial-results-20260827"
  },
  {
   "d": "2026-08-13",
   "h": "Reuters reported Silver Lake was in talks to take Workday private, valuing it at roughly $43 bn market capitalisation; no deal guaranteed.",
   "u": "https://www.bnnbloomberg.ca/business/company-news/2026/08/13/silver-lake-in-talks-to-buy-workday-sources-say-reuters-exclusive/"
  }
 ],
 "ABNB": [
  {
   "d": "2026-08-06",
   "h": "Q2 2026 revenue $3.6 bn, up 17%; nights and seats booked up 10%, accelerating from Q1; adjusted EPS $1.37 vs $1.26 expected.",
   "u": "https://news.airbnb.com/airbnb-q2-2026-financial-results/"
  },
  {
   "d": "2026-08-06",
   "h": "Raised full-year outlook to at least mid-teens revenue growth and at least 35.5% adjusted EBITDA margin; Q3 revenue guided to $4.69-4.77 bn.",
   "u": "https://news.airbnb.com/airbnb-q2-2026-financial-results/"
  },
  {
   "d": "2026-08-06",
   "h": "Shares rose about 11% after hours to around $168; $1.1 bn of stock repurchased in the quarter.",
   "u": "https://www.investing.com/news/transcripts/earnings-call-transcript-airbnb-tops-q2-2026-estimates-and-lifts-outlook-93CH-4844707"
  }
 ],
 "SPOT": [
  {
   "d": "2026-08-04",
   "h": "Q2 2026 Premium subscribers reached 300 million; revenue EUR 4.78 bn, up 14%; operating income EUR 655 m, up 61%; record gross margin of 33.4%.",
   "u": "https://www.musicbusinessworldwide.com/spotify-hits-300-million-premium-subscribers-in-q2-202/"
  },
  {
   "d": "2026-08-04",
   "h": "Shares fell about 6% premarket as Q3 operating income guidance of EUR 670 m and MAU guidance of 788 million missed estimates.",
   "u": "https://finance.yahoo.com/markets/stocks/articles/spotify-hits-300-million-subscribers-182522233.html"
  }
 ],
 "APP": [
  {
   "d": "2026-08-05",
   "h": "Q2 2026 revenue $1.924 bn, up 53%; adjusted EBITDA $1.614 bn at an 84% margin; Q3 revenue guided to $2.055-2.085 bn.",
   "u": "https://www.sec.gov/Archives/edgar/data/0001751008/000175100826000057/exhibit991-2q26earningspre.htm"
  }
 ],
 "FTNT": [
  {
   "d": "2026-09-10",
   "h": "Named a Leader in Gartner's 2026 Magic Quadrant for Hybrid Mesh Firewall.",
   "u": "https://markets.financialcontent.com/ibtimes/article/gnwcq-2026-9-10-fortinet-named-a-leader-in-the-2026-gartner-magic-quadrant-report-for-hybrid-mesh-firewall"
  },
  {
   "d": "2026-08-17",
   "h": "Acquired AI runtime-protection start-up Virtue AI for an undisclosed sum it described as immaterial.",
   "u": "https://markets.financialcontent.com/ibtimes/article/gnwcq-2026-8-17-fortinet-advances-continuous-ai-protection-with-the-acquisition-of-virtue-ai"
  }
 ],
 "ADSK": [
  {
   "d": "2026-08-27",
   "h": "Q2 FY27 revenue $2.05 bn, up 16%, vs $2.01 bn expected; non-GAAP EPS $3.30 vs $3.12; full-year revenue and billings guidance raised.",
   "u": "https://www.sec.gov/Archives/edgar/data/0000769397/000076939726000059/q227pressrelease.htm"
  },
  {
   "d": "2026-08-27",
   "h": "Shares fell about 5% after hours as GAAP margin guidance was cut to 25-27% on MaintainX acquisition effects.",
   "u": "https://www.investing.com/news/transcripts/earnings-call-transcript-autodesk-beats-q2-2026-estimates-shares-reverse-after-hours-93CH-4880303"
  },
  {
   "d": "2026-08-03",
   "h": "Closed the roughly $3.6 bn all-cash acquisition of maintenance software company MaintainX, its largest deal to date.",
   "u": "https://www.investing.com/news/transcripts/earnings-call-transcript-autodesk-beats-q2-2026-estimates-shares-reverse-after-hours-93CH-4880303"
  }
 ],
 "SYK": [
  {
   "d": "2026-10-30",
   "h": "Shares fall about 10% as Q3 revenue of $6.52bn misses despite 7.7% organic growth; 2026 adjusted EPS guided to $14.80-$14.90",
   "u": "https://finance.biggo.com/news/e56206d7-fe10-401e-a985-bb738b7a8d83"
  }
 ],
 "BSX": [
  {
   "d": "2026-10-28",
   "h": "Q3 organic growth slows to 1.5% after an eight-day cyber incident and share losses in EP and WATCHMAN; Q4 organic sales guided down 1% to 3%",
   "u": "https://finance.biggo.com/news/US_BSX_2026-10-28"
  },
  {
   "d": "2026-10-28",
   "h": "Management warns it will be challenged to grow sales and adjusted EPS in 2027 and expects a return to growth in 2028",
   "u": "https://finance.biggo.com/news/US_BSX_2026-10-28"
  },
  {
   "d": "2026-10-08",
   "h": "Barclays upgraded the shares to hold after they hit a 52-week low near $41.50; CEO Michael Mahoney bought about $9 million of stock.",
   "u": "https://www.defenseworld.net/2026/10/08/boston-scientific-nysebsx-stock-rating-raised-to-hold-at-barclays.html"
  },
  {
   "d": "2026-09-17",
   "h": "Shares down about 54% since late December 2025 on US electrophysiology share loss and a Watchman slowdown; US EP sales grew 3% in Q2 vs 23% internationally.",
   "u": "https://www.trefis.com/articles/615706/why-bsx-stock-lost-more-than-half-its-value-while-sales-kept-rising/2026-09-17"
  }
 ],
 "CI": [
  {
   "d": "2026-09-30",
   "h": "Investor day reaffirmed 2026 adjusted EPS of at least $30.45, set a 10-14% annual EPS growth target to 2030 and a $3 bn productivity programme.",
   "u": "https://newsroom.thecignagroup.com/2026-09-30-The-Cigna-Group-Hosts-2026-Investor-Day-Introduces-Lead-to-One-to-Drive-Durable-Growth-Through-Complex-Care-Leadership-and-Differentiated-Capabilities"
  },
  {
   "d": "2026-09-04",
   "h": "PBM reform in the Consolidated Appropriations Act 2026 delinks Part D PBM pay and mandates commercial rebate pass-through, mostly from 2028-29.",
   "u": "https://www.pharmacytimes.com/view/the-pbm-reform-clock-is-running-to-2028-here-s-what-independent-pharmacies-should-do"
  }
 ],
 "CVS": [
  {
   "d": "2026-08-05",
   "h": "Q2 2026 revenue $106.1bn, up 7.3%; adjusted EPS $2.58 vs $1.81; full-year adjusted EPS guidance raised to $7.90-$8.10 from $7.30-$7.50",
   "u": "https://www.cvshealth.com/news/company-news/cvs-health-corporation-reports-strong-second-quarter-2026-results-and-raises-full-year-2026-guidance.html"
  }
 ],
 "MCK": [
  {
   "d": "2026-08-05",
   "h": "McKesson names its Medical-Surgical Solutions business Wellverse ahead of the planned separation",
   "u": "https://www.businesswire.com/news/home/20260805315014/en/"
  },
  {
   "d": "2026-08-05",
   "h": "Fiscal Q1 2027 revenue $105.4bn, up 8%; adjusted EPS $9.93, up 20%; full-year adjusted EPS guidance raised to $44.20-$45.00",
   "u": "https://www.mckesson.com/about-us/newsroom/press-releases/2026/mckesson-reports-fiscal-2027-first-quarter-results-and-raises-full-year-adjusted-eps-guidance/"
  }
 ],
 "HCA": [
  {
   "d": "2026-10-27",
   "h": "Q3 revenue up 3.6% to $19.85bn and EPS up 4.5% to $7.27, though more uninsured patients cut pretax income by about $400m; 2026 seen in upper half of guidance",
   "u": "https://marketchameleon.com/articles/b/2026/10/27/hca-q3-2026-results-uninsured-payer-mix-hit"
  }
 ],
 "ZTS": [
  {
   "d": "2026-08-06",
   "h": "Q2 2026 revenue $2.468bn, flat (down 1% organic); US companion animal down 11%; 2026 revenue guidance cut to $9.12-$9.32bn and adjusted EPS to $6.15-$6.25",
   "u": "https://www.stocktitan.net/news/ZTS/zoetis-announces-second-quarter-2026-2scm7vc3edkx.html"
  }
 ],
 "MMC": [
  {
   "d": "2026-10-15",
   "h": "Q3 revenue $6.9bn, up 8% (5% underlying); adjusted EPS up 10% to $2.03. The company now trades as Marsh (MRSH)",
   "u": "https://insurancenewsnet.com/oarticle/marsh-reports-third-quarter-2026-results"
  },
  {
   "d": "2026-10-02",
   "h": "Marsh completed its acquisition of Accel Holdings, an Iowa insurance and advisory firm; terms not disclosed",
   "u": "https://stocktitan.net/news/MRSH/"
  },
  {
   "d": "2026-09-16",
   "h": "Marsh declared a quarterly dividend of $0.99 per share and set third-quarter results for 15 October 2026",
   "u": "https://stocktitan.net/news/MRSH/"
  }
 ],
 "ICE": [
  {
   "d": "2026-10-05",
   "h": "September 2026 total ADV up 51% year on year and Q3 up 31%, with record open interest in interest rate futures",
   "u": "https://s2.q4cdn.com/154085107/files/doc_news/Intercontinental-Exchange-Reports-September-and-Third-Quarter-2026-Statistics-2026.pdf"
  },
  {
   "d": "2026-09-29",
   "h": "ICE and MarketAxess refiled HSR notifications, extending the antitrust waiting period to 29 October 2026; MarketAxess vote set for the same day",
   "u": "https://www.sec.gov/Archives/edgar/data/0001278021/000119312526407834/d142535d8k.htm"
  }
 ],
 "CME": [
  {
   "d": "2026-10-21",
   "h": "Record Q3 revenue of $1.74bn, up 13%; net income $1.04bn, up 14%; record Q3 average daily volume of 29.4m contracts",
   "u": "https://mondovisione.com/media-and-resources/news/cme-group-inc-reports-highest-q3-revenue-on-record-for-q3-2026-20261021/"
  },
  {
   "d": "2026-10-02",
   "h": "CME suspended plans to launch a 24/7 10-barrel crude oil contract and withdrew its filing",
   "u": "https://www.stocktitan.net/news/CME/"
  },
  {
   "d": "2026-09-10",
   "h": "CME plans to launch CME Securities Clearing, an SEC-registered clearing house, on 7 December 2026, pending approvals",
   "u": "https://www.stocktitan.net/news/CME/"
  }
 ],
 "COF": [
  {
   "d": "2026-10-20",
   "h": "Q3 net income $3.5bn, or $5.61 a share, against $4.83 a year earlier; revenue $16.3bn",
   "u": "https://www.sec.gov/Archives/edgar/data/0000927628/000092762826000142/ex991q32026earningsrelease.htm"
  },
  {
   "d": "2026-09-24",
   "h": "Capital One will report third-quarter 2026 results on 20 October 2026",
   "u": "https://www.stocktitan.net/news/COF/"
  },
  {
   "d": "2026-08-20",
   "h": "Capital One announced full redemption of its Series M fixed-rate reset perpetual preferred stock on 1 September 2026",
   "u": "https://www.stocktitan.net/news/COF/"
  }
 ],
 "BX": [
  {
   "d": "2026-10-22",
   "h": "Q3 distributable earnings $1.7bn, down from $1.9bn; AUM $1.37tn, up 10%, on $63bn of inflows",
   "u": "https://www.rttnews.com/3701819/blackstone-q3-net-income-rises-total-aum-up-10.aspx"
  },
  {
   "d": "2026-09-24",
   "h": "Blackstone launched BXPM, a perpetual multi-strategy private markets fund for eligible non-US investors",
   "u": "https://www.stocktitan.net/news/BX/"
  },
  {
   "d": "2026-09-10",
   "h": "Blackstone funds agreed to acquire Flow Control Holdings, a maker of data-centre liquid cooling components; closing expected in Q4",
   "u": "https://www.stocktitan.net/news/BX/"
  }
 ],
 "MCO": [
  {
   "d": "2026-10-21",
   "h": "Q3 revenue up 1% to $2.02bn and adjusted EPS of $4.14 misses as leveraged-finance issuance weakens; 2026 EPS outlook of $16.50 to $17.00 kept",
   "u": "https://grafa.com/en/news/united-states/moodys-q3-2026-revenue-2-02-billion-earnings-miss"
  },
  {
   "d": "2026-09-14",
   "h": "Moody's agreed to acquire a minority stake in Philippine Rating Services Corporation (PhilRatings); terms not disclosed",
   "u": "https://www.stocktitan.net/news/MCO/"
  }
 ],
 "KKR": [
  {
   "d": "2026-09-25",
   "h": "Q3 quarter-to-date monetisation income above $750m, about 80% realised performance income, excluding the USI sale",
   "u": "https://www.financialcontent.com/article/bizwire-2026-9-25-kkr-announces-intra-quarter-monetization-activity-update-for-the-third-quarter"
  },
  {
   "d": "2026-09-01",
   "h": "Aon agreed to buy KKR-owned USI Insurance Services for $17bn in cash; KKR expects about $3.3bn of after-tax proceeds",
   "u": "https://fintech.global/2026/09/01/aon-agrees-17bn-deal-to-acquire-usi-from-kkr/"
  }
 ],
 "CL": [
  {
   "d": "2026-10-30",
   "h": "Q3 sales up 4.6% to $5.37bn with organic growth accelerating to 1.8% and Hill's up 6.5%; gross margin guidance raised",
   "u": "https://finance.biggo.com/news/US_CL_2026-10-30"
  },
  {
   "d": "2026-09-17",
   "h": "Colgate-Palmolive declared a regular quarterly dividend of $0.53 per share",
   "u": "https://www.stocktitan.net/news/CL/"
  },
  {
   "d": "2026-09-04",
   "h": "S&P Dow Jones Indices said Colgate-Palmolive would leave the S&P 100 in the 21 September 2026 rebalance",
   "u": "https://www.stocktitan.net/news/CL/"
  }
 ],
 "CMG": [
  {
   "d": "2026-10-28",
   "h": "Q3 revenue up 9.6% with comparable sales up 2.1% as traffic grows; margins narrow and Q4 comps are guided near 2%",
   "u": "https://www.tradingkey.com/news/presentation/262252094-tradingkey"
  },
  {
   "d": "2026-09-14",
   "h": "Former KFC CEO Sabir Sami joined Chipotle's board, expanding it to 11 members",
   "u": "https://www.stocktitan.net/news/CMG/"
  },
  {
   "d": "2026-09-02",
   "h": "Chipotle opened its first Asian restaurant in Seoul through a joint venture, with Singapore planned for 2027",
   "u": "https://www.stocktitan.net/news/CMG/"
  }
 ],
 "ORLY": [
  {
   "d": "2026-10-28",
   "h": "Q3 sales up 9% with comparable store sales up 7.2% and EPS up 14%; full-year guidance raised",
   "u": "https://scanx.trade/stock-market-news/companies/o-reilly-automotive-q3fy26-results-eps-up-14-comps-rise-7-2/54836934"
  },
  {
   "d": "2026-10-01",
   "h": "O'Reilly will report third-quarter 2026 results on 28 October 2026",
   "u": "https://www.globenewswire.com/news-release/2026/10/01/3373421/10672/en/index.html"
  }
 ],
 "KR": [
  {
   "d": "2026-09-11",
   "h": "Kroger cut full-year 2026 identical sales ex-fuel guidance to 0.2%-0.8% from 1%-2%, reaffirmed EPS of $5.10-$5.30 and FCF of $2.7-$2.9 bn",
   "u": "https://www.sec.gov/Archives/edgar/data/0000056873/000110465926106890/tm2625060d1_ex99-1.htm"
  },
  {
   "d": "2026-09-11",
   "h": "Kroger repurchased $1.0 bn of stock in Q2 and $1.2 bn year to date under a $2 bn authorisation, and raised its dividend 11%",
   "u": "https://www.sec.gov/Archives/edgar/data/0000056873/000110465926106890/tm2625060d1_ex99-1.htm"
  }
 ],
 "MNST": [
  {
   "d": "2026-08-11",
   "h": "Two-for-one stock split, effected as a 100% stock dividend, distributed after the 10 August close; split-adjusted trading began 11 August 2026",
   "u": "https://investors.monsterbevcorp.com/node/18181"
  },
  {
   "d": "2026-08-07",
   "h": "Q2 2026 net sales $2.54 bn, up 20.2% and about 5% above the $2.42 bn consensus; adjusted EPS $0.60 versus $0.59 expected",
   "u": "https://finance.yahoo.com/markets/stocks/articles/monster-beverage-beats-q2-earnings-164300309.html"
  },
  {
   "d": "2026-08-06",
   "h": "Sales outside the US rose 34.6% to about 46% of net sales; selling expenses rose to 10.6% of sales on higher sponsorship and media spend",
   "u": "https://investors.monsterbevcorp.com/node/18181"
  }
 ],
 "YUM": [
  {
   "d": "2026-09-01",
   "h": "Yum completed the sale of Pizza Hut outside mainland China to LongRange Capital for about $1.5 bn plus a possible $75 m earn-out",
   "u": "https://chainstoreage.com/done-deal-yum-brands-completes-15-billion-sale-pizza-hut"
  },
  {
   "d": "2026-08-10",
   "h": "Yum sold the mainland China Pizza Hut brand to Yum China for $1.2 bn, taking total Pizza Hut proceeds to $2.7 bn",
   "u": "https://www.nrn.com/restaurant-finance/pizza-hut-s-sale-to-longrange-capital-is-complete"
  }
 ],
 "MPC": [
  {
   "d": "2026-10-06",
   "h": "G7 agreed an emergency release of up to 100 million barrels of oil and diesel as US diesel averaged above $6 a gallon; refiners' wide product margins are the target",
   "u": "https://www.stocktitan.net/news/MPC/g7-releases-100-million-barrels-as-diesel-tops-6-a-0acl166k0wi6.html"
  },
  {
   "d": "2026-10-06",
   "h": "Talk of a temporary US diesel-export restriction in late September pushed refining shares lower for about a week before a recovery in early October",
   "u": "https://www.stocktitan.net/news/MPC/g7-releases-100-million-barrels-as-diesel-tops-6-a-0acl166k0wi6.html"
  },
  {
   "d": "2026-08-04",
   "h": "Q2 2026 diluted EPS $17.73 on net income of $5.1 bn; R&M margin $36.33 per barrel versus $17.58 a year earlier; over $2.8 bn returned to shareholders",
   "u": "https://www.stocktitan.net/news/MPC/marathon-petroleum-corp-reports-second-quarter-2026-iq2hnbenos6h.html"
  }
 ],
 "WMB": [
  {
   "d": "2026-09-08",
   "h": "Williams priced $2.75 bn of senior notes due 2029-2056 to repay commercial paper and fund general corporate purposes including capex",
   "u": "https://www.stocktitan.net/news/WMB/williams-prices-2-75-billion-of-senior-eltfmvvb43jw.html"
  },
  {
   "d": "2026-09-03",
   "h": "Williams closed the roughly $5.5 bn acquisition of Haynesville gatherer Momentum Midstream, paid with about $3.5 bn cash and debt and $2 bn in stock",
   "u": "https://www.stocktitan.net/news/WMB/williams-completes-acquisition-of-momentum-nbkcypost7lz.html"
  },
  {
   "d": "2026-08-03",
   "h": "Q2 2026 adjusted EBITDA $1.921 bn, up 6%, adjusted EPS $0.50; 2026 EBITDA guidance midpoint raised $200 m to $8.4 bn",
   "u": "https://www.stocktitan.net/news/WMB/williams-delivers-strong-second-quarter-2026-results-announces-2pu7wluzqcml.html"
  }
 ],
 "FCX": [
  {
   "d": "2026-10-27",
   "h": "Q3 copper production of 830m lb as the Grasberg recovery advances; earnings up sharply on higher copper and gold prices",
   "u": "https://news.metal.com/newscontent/104143740-freeport-reports-q3-copper-production-of-830-million-lb-as-grasberg-recovery-advances"
  },
  {
   "d": "2026-10-02",
   "h": "Q3 2026 copper output about 830 m lb, in line; Grasberg mill at about 67% of pre-incident rates; unit costs about 5% above $2.00/lb estimate",
   "u": "https://www.stocktitan.net/news/FCX/freeport-provides-third-quarter-2026-operational-vkuik38lgh0h.html"
  },
  {
   "d": "2026-10-02",
   "h": "Freeport reiterated Grasberg reaching 80% of capacity by mid-2027 and near full capacity by end-2027; Eastern Java smelter restarted late August 2026",
   "u": "https://www.stocktitan.net/news/FCX/freeport-provides-third-quarter-2026-operational-vkuik38lgh0h.html"
  },
  {
   "d": "2026-10-02",
   "h": "Average realised copper price for Q3 expected above $6.50 per pound; Q3 results due 27 October 2026",
   "u": "https://www.stocktitan.net/news/FCX/freeport-provides-third-quarter-2026-operational-vkuik38lgh0h.html"
  }
 ],
 "APD": [
  {
   "d": "2026-10-07",
   "h": "Air Products to build and operate a 600+ tonne-per-day LNG-based air separation unit at Pengerang, Malaysia, for a PETRONAS Gas-led venture, starting early 2027",
   "u": "https://www.stocktitan.net/news/APD/air-products-to-supply-malaysia-s-first-lng-based-air-separation-lqgmbi7cz0xb.html"
  },
  {
   "d": "2026-09-16",
   "h": "Won a long-term contract to supply high-purity gases to an unnamed semiconductor maker in Arizona, investing about $250 m; two recent chip wins exceed $900 m",
   "u": "https://www.stocktitan.net/news/APD/air-products-wins-long-term-contract-to-supply-high-purity-qlletlcrivt6.html"
  }
 ],
 "SHW": [
  {
   "d": "2026-10-27",
   "h": "Q3 sales up 7.9% to $6.86bn beat estimates while margins narrow and profit slips",
   "u": "https://kalkinemedia.com/us/news/announcements/sherwin-williams-q3-2026-earnings-sales-increase-79-to-686-billion"
  },
  {
   "d": "2026-10-01",
   "h": "Sherwin-Williams will report third-quarter 2026 results on 27 October 2026",
   "u": "https://www.stocktitan.net/news/SHW/sherwin-williams-to-announce-third-quarter-2026-financial-results-on-3auruezx2m2n.html"
  },
  {
   "d": "2026-09-30",
   "h": "Opened an expanded manufacturing facility in Statesville",
   "u": "https://www.stocktitan.net/news/SHW/sherwin-williams-celebrates-grand-opening-of-expanded-statesville-uwn4sd8u2j2x.html"
  }
 ],
 "MMM": [
  {
   "d": "2026-10-20",
   "h": "Q3 organic sales up 3.3% and adjusted EPS up 12% to $2.50; 2026 EPS guide raised to $9.10-$9.15",
   "u": "https://finance.biggo.com/news/US_MMM_2026-10-20"
  },
  {
   "d": "2026-10-20",
   "h": "Grants Amazon a warrant for up to 3.2 million shares tied to $6bn of optical connectivity and data-centre product sales over seven years",
   "u": "https://finance.biggo.com/news/US_MMM_2026-10-20"
  },
  {
   "d": "2026-10-06",
   "h": "3M will hold its third-quarter 2026 earnings call on 20 October 2026",
   "u": "https://www.stocktitan.net/news/MMM/3m-announces-upcoming-investor-6fnp1g8ig10n.html"
  },
  {
   "d": "2026-09-04",
   "h": "3M issued EUR 1.5 bn of senior unsecured notes in three EUR 500 m tranches maturing 2028, 2031 and 2034",
   "u": "https://www.stocktitan.net/sec-filings/MMM/424b2-3m-co-prospectus-supplement-8f2c0971a948.html"
  }
 ],
 "ITW": [
  {
   "d": "2026-10-27",
   "h": "Q3 EPS of $3.00 on revenue of $4.24bn as record margins offset a sales miss",
   "u": "https://stockstory.org/us/stocks/nyse/itw/news/earnings/illinois-tool-works-nyseitw-misses-q3-2026-sales-expectations"
  },
  {
   "d": "2026-08-27",
   "h": "Miller welding unit launched the Copilot Builder adaptive automation system for fabrication shops",
   "u": "https://www.stocktitan.net/news/ITW/the-new-miller-copilot-tm-builder-tm-with-blue-i-qtm-brings-adaptive-p92s7f2rfkyr.html"
  },
  {
   "d": "2026-08-07",
   "h": "ITW raised its annual dividend 7% to $6.88 a share, its 63rd consecutive annual increase, and authorised a new $6 bn share repurchase programme",
   "u": "https://www.stocktitan.net/news/ITW/itw-announces-7-dividend-increase-and-6-billion-share-repurchase-2eijnc5xz6h4.html"
  }
 ],
 "CSX": [
  {
   "d": "2026-10-22",
   "h": "Q3 net income up 52% to $1.05bn as margins expand and intermodal grows; revenue outlook raised",
   "u": "https://www.stocktitan.net/sec-filings/CSX/8-k-csx-corp-reports-material-event-6e3da125001f.html"
  },
  {
   "d": "2026-09-21",
   "h": "CSX will report third-quarter 2026 results after the close on 21 October 2026",
   "u": "https://www.stocktitan.net/news/CSX/csx-corp-announces-date-for-third-quarter-earnings-release-and-ix2y55l8v949.html"
  }
 ],
 "WM": [
  {
   "d": "2026-10-28",
   "h": "Q3 revenue up 6.3% as Healthcare Solutions posts its first revenue gain; full-year revenue and free cash flow seen at the high end of guidance",
   "u": "https://finance.biggo.com/news/US_WM_2026-10-28"
  },
  {
   "d": "2026-10-28",
   "h": "CEO Jim Fish to retire in early January 2027, with President John Morris succeeding him",
   "u": "https://finance.biggo.com/news/US_WM_2026-10-28"
  },
  {
   "d": "2026-09-24",
   "h": "WM will report third-quarter 2026 results after the close on 27 October 2026, with a call on 28 October",
   "u": "https://www.stocktitan.net/news/WM/wm-sets-date-for-third-quarter-2026-earnings-conference-26mu6cykax3a.html"
  },
  {
   "d": "2026-08-26",
   "h": "CEO Jim Fish to retire; President John Morris named as next CEO effective 4 January 2027",
   "u": "https://www.stocktitan.net/news/WM/jim-fish-to-retire-from-wm-john-morris-named-as-next-tdbldrm872yj.html"
  }
 ],
 "TDG": [
  {
   "d": "2026-09-28",
   "h": "TransDigm completed the roughly $1.07 bn cash acquisition of Prince & Izant, an aerospace brazing alloys maker expecting about $390 m of 2026 revenue",
   "u": "https://www.stocktitan.net/news/TDG/trans-digm-completes-acquisition-of-prince-9mhovivs447p.html"
  },
  {
   "d": "2026-08-04",
   "h": "Fiscal Q3 2026 net sales $2.74 bn, up 23% (13% organic); adjusted EPS $10.87; FY2026 adjusted EPS guidance raised to $40.62-$41.46",
   "u": "https://www.stocktitan.net/news/TDG/trans-digm-group-reports-fiscal-2026-third-quarter-c7e9nzbe7m88.html"
  },
  {
   "d": "2026-08-04",
   "h": "TransDigm bought back $1.0 bn of stock in fiscal Q3 at about $1,208 a share, $1.8 bn year to date",
   "u": "https://www.stocktitan.net/news/TDG/trans-digm-group-reports-fiscal-2026-third-quarter-c7e9nzbe7m88.html"
  }
 ],
 "FDX": [
  {
   "d": "2026-09-14",
   "h": "FedEx issued EUR 1.1 bn of 2030 notes, EUR 900 m of 2034 notes and $1.1 bn of 2036 notes",
   "u": "https://www.stocktitan.net/sec-filings/FDX/8-k-fedex-corp-reports-material-event-646fd314c81a.html"
  },
  {
   "d": "2026-09-09",
   "h": "Filing shows FedEx repurchased about $4.86 bn of debt via July tender offers, funded mainly by a $4.1 bn dividend from FedEx Freight before its spin-off",
   "u": "https://www.stocktitan.net/sec-filings/FDX/424b3-fedex-corp-prospectus-filed-pursuant-to-rule-424-b-3-ddfdede2d270.html"
  },
  {
   "d": "2026-08-17",
   "h": "Proxy confirms FedEx Freight spin-off completed 1 June 2026: 80.1% distributed one-for-two to FedEx holders, up to 19.9% retained for disposal within 24 months",
   "u": "https://www.stocktitan.net/sec-filings/FDX/def-14a-fedex-corp-definitive-proxy-statement-8792df0cb98f.html"
  }
 ],
 "LHX": [
  {
   "d": "2026-10-29",
   "h": "Q3 revenue of $6.1bn and EPS of $3.28 beat as $11bn of PAC-3 and THAAD orders lift backlog to a record $53.2bn; guidance raised",
   "u": "https://finance.biggo.com/news/US_LHX_2026-10-29"
  },
  {
   "d": "2026-09-29",
   "h": "Lockheed Martin awarded L3Harris a seven-year undefinitized THAAD propulsion contract worth more than $6 bn, including a new solid rocket motor facility",
   "u": "https://www.stocktitan.net/news/LHX/l3harris-receives-thaad-propulsion-contract-valued-at-6-2rnijwps4rxh.html"
  },
  {
   "d": "2026-09-08",
   "h": "L3Harris won a $4.7 bn seven-year PAC-3 MSE propulsion contract from Lockheed Martin, its largest PAC-3 propulsion award to date",
   "u": "https://www.stocktitan.net/news/LHX/l3harris-receives-landmark-pac-3-mse-propulsion-contract-to-power-vo28wiw5x3k3.html"
  },
  {
   "d": "2026-08-17",
   "h": "CEO Christopher Kubasik stepped down after a board investigation into conduct inconsistent with the Code of Conduct; Sam Mehta named CEO; 2026 guidance reaffirmed",
   "u": "https://www.stocktitan.net/news/LHX/l3harris-technologies-appoints-sam-mehta-proven-aerospace-and-61wbrca2keno.html"
  }
 ],
 "F": [
  {
   "d": "2026-10-29",
   "h": "Q3 adjusted EPS of $0.50 and revenue of $49.5bn beat; full-year profit outlook raised on record software revenue",
   "u": "https://www.investing.com/news/transcripts/earnings-call-transcript-ford-beats-q3-2026-estimates-lifts-profit-outlook-93CH-4981118"
  },
  {
   "d": "2026-10-06",
   "h": "Ford Authority: September F-150 production fell sharply on the supplier issue, just after recovering from a months-long aluminium supply problem.",
   "u": "https://fordauthority.com/2026/10/ford-f-150-production-in-september-nosedived-due-to-supplier-issue/"
  },
  {
   "d": "2026-09-30",
   "h": "CEO Jim Farley said a supplier disruption that halted F-150 output at Dearborn and Kansas City will hit third-quarter sales; the issue is fixed.",
   "u": "https://www.detroitnews.com/story/business/autos/ford/2026/09/30/f-150-supplier-disruption-to-hit-3q-sales-ford-ceo-jim-farley-says/92021499007/"
  },
  {
   "d": "2026-09-29",
   "h": "Ford restarted F-150 production at two plants after Dearborn Truck stopped output from 24 September because of an undisclosed supplier problem.",
   "u": "https://www.usatoday.com/story/money/cars/ford/2026/09/29/ford-f-150-production-restarts-at-2-plants-after-temporary-halt/92009085007/"
  }
 ],
 "RIVN": [
  {
   "d": "2026-10-02",
   "h": "Q3 2026 deliveries 19,248 and production 19,751, ahead of roughly 18,000 expected; full-year 65,000–70,000 delivery outlook reaffirmed; Q3 results due 29 October.",
   "u": "https://www.stocktitan.net/news/RIVN/rivian-releases-q3-2026-production-and-delivery-figures-and-sets-xsjbihohdxdj.html"
  },
  {
   "d": "2026-10-02",
   "h": "Q3 was the first full quarter of R2 deliveries, which began in June; only the R2 Performance is being sold through the end of 2026.",
   "u": "https://driveteslacanada.ca/?p=124476"
  },
  {
   "d": "2026-08-27",
   "h": "CFO Claire McDonough to leave on 30 October 2026; VP of Finance Derek Mulvey to become interim CFO while a permanent search runs.",
   "u": "https://www.stocktitan.net/news/RIVN/rivian-announces-cfo-transition-51y4b9y33mlj.html"
  }
 ],
 "CHTR": [
  {
   "d": "2026-08-31",
   "h": "CFO Jessica Fischer to step down; chief accounting officer Kevin Howard named interim CFO effective 15 October 2026.",
   "u": "https://www.stocktitan.net/news/CHTR/charter-announces-chief-financial-officer-5hw7f0o66xi5.html"
  },
  {
   "d": "2026-08-20",
   "h": "Charter completed the Cox Communications combination and its Liberty Broadband acquisition; Cox Enterprises now owns about 26% and the parent will be renamed Cox Communications.",
   "u": "https://www.stocktitan.net/news/CHTR/charter-and-cox-communications-complete-transaction-benefiting-5y2pvyilwmha.html"
  },
  {
   "d": "2026-08-18",
   "h": "Charter closed a $4.75 billion senior secured notes offering ahead of the Cox closing.",
   "u": "https://www.stocktitan.net/news/CHTR/charter-closes-4-75-billion-senior-secured-notes-vafmnvh1n672.html"
  }
 ],
 "HOOD": [
  {
   "d": "2026-10-27",
   "h": "Record Q3 revenue up 9% to $1.42bn and event contracts up sixfold, but crypto revenue falls 55% and diluted EPS drops 16%",
   "u": "https://fxnewsgroup.com/forex-news/retail-forex/robinhood-revenues-tick-up-9-to-record-1-42-billion-in-q3-2026-profits-fall/"
  },
  {
   "d": "2026-10-01",
   "h": "Robinhood will report third-quarter 2026 results on 27 October 2026.",
   "u": "https://www.stocktitan.net/news/HOOD/robinhood-markets-inc-to-announce-third-quarter-2026-results-on-xxwmx7vb7has.html"
  },
  {
   "d": "2026-09-10",
   "h": "August 2026: 28.6m funded customers, platform assets $383.7bn (up 26% year on year), $4.0bn net deposits, event contracts traded about 15 times year-earlier levels.",
   "u": "https://www.stocktitan.net/news/HOOD/robinhood-markets-inc-reports-august-2026-operating-39e37qkbua3j.html"
  },
  {
   "d": "2026-09-08",
   "h": "Robinhood picked OG.com as infrastructure partner for its prediction markets platform and holds an equity stake in the exchange engine.",
   "u": "https://www.stocktitan.net/news/HOOD/robinhood-selects-og-com-as-infrastructure-partner-for-prediction-x1a6o98wzhnf.html"
  }
 ],
 "AMKR": [
  {
   "d": "2026-10-26",
   "h": "Q3 net sales $1.99bn, flat year on year; Q4 guided to $1.9-2.0bn, and the shares fell on the outlook",
   "u": "https://finviz.com/news/408080/amkor-technology-reports-financial-results-for-the-third-quarter-2026"
  },
  {
   "d": "2026-10-05",
   "h": "Amkor will report third-quarter 2026 results on 26 October 2026.",
   "u": "https://www.stocktitan.net/news/AMKR/amkor-technology-to-announce-third-quarter-2026-financial-results-on-srcgj664sbwd.html"
  },
  {
   "d": "2026-09-08",
   "h": "Amkor announced phase 2 of its Arizona packaging and test campus, lifting planned investment to about $12 billion; construction from late 2027, completion by end-2029.",
   "u": "https://www.stocktitan.net/news/AMKR/amkor-technology-announces-phase-2-of-arizona-advanced-packaging-and-m19aoplwpjtk.html"
  }
 ],
 "ON": [
  {
   "d": "2026-10-01",
   "h": "onsemi and Synaptics revised their merger to $123 per share in cash, about $5.7 billion versus about $7 billion originally, after a rival unsolicited proposal; close expected by mid-2027.",
   "u": "https://www.stocktitan.net/news/ON/onsemi-and-synaptics-announce-revised-merger-ad7hqu6fpmpy.html"
  },
  {
   "d": "2026-09-16",
   "h": "onsemi set out its long-term strategy, citing a $213 billion addressable market by 2030 and a new Embedded Power Platform, without quantified financial targets.",
   "u": "https://www.stocktitan.net/news/ON/onsemi-charts-path-to-power-the-next-decade-of-bkez1ijbdmc1.html"
  },
  {
   "d": "2026-08-03",
   "h": "Q2 2026 revenue $1.60 billion, up 9%; non-GAAP EPS $0.74; Q3 guided to $1.65–1.75 billion revenue and $0.81–0.93 non-GAAP EPS.",
   "u": "https://www.stocktitan.net/news/ON/onsemi-reports-second-quarter-2026-anna8udjnqdf.html"
  }
 ],
 "SWKS": [
  {
   "d": "2026-10-05",
   "h": "Skyworks completed its combination with Qorvo; Qorvo holders received $32.50 cash plus 0.960 Skyworks shares each and own about 37% of the company.",
   "u": "https://www.stocktitan.net/news/SWKS/skyworks-completes-combination-with-5c9clkhhafsu.html"
  },
  {
   "d": "2026-10-05",
   "h": "Skyworks announced final results of its exchange offers for Qorvo's senior notes due 2029 and 2031.",
   "u": "https://www.stocktitan.net/news/SWKS/skyworks-announces-expiration-and-final-results-of-exchange-offers-dqx3yor0rjna.html"
  },
  {
   "d": "2026-09-30",
   "h": "Skyworks said it had received all necessary regulatory clearances for the Qorvo combination.",
   "u": "https://www.stocktitan.net/news/SWKS/skyworks-receives-all-necessary-clearances-for-proposed-combination-xrz832d949d6.html"
  }
 ],
 "ENTG": [
  {
   "d": "2026-10-29",
   "h": "Q3 net sales $1.01bn, up about 25%; Q4 guided to $1.025-1.055bn",
   "u": "https://www.sec.gov/Archives/edgar/data/0001101302/000110130226000159/entgq32026ex991.htm"
  },
  {
   "d": "2026-10-01",
   "h": "Entegris will report third-quarter 2026 results on 29 October 2026.",
   "u": "https://www.stocktitan.net/news/ENTG/entegris-to-report-results-for-third-quarter-of-2026-on-thursday-48stl4p1s6xy.html"
  },
  {
   "d": "2026-08-26",
   "h": "Entegris will host an investor day on 9 November 2026.",
   "u": "https://www.stocktitan.net/news/ENTG/entegris-to-host-investor-day-on-november-9-ehd6ismpatb2.html"
  },
  {
   "d": "2026-08-18",
   "h": "Entegris reported further success defending its CMP slurry patent portfolio.",
   "u": "https://www.stocktitan.net/news/ENTG/entegris-achieves-further-success-in-defending-its-cmp-slurry-patent-t3pao1d1hwek.html"
  }
 ],
 "STX": [
  {
   "d": "2026-10-28",
   "h": "September-quarter revenue $4.23bn, up about 61%; 57.3% gross margin; December quarter guided to $4.8bn",
   "u": "https://www.sec.gov/Archives/edgar/data/0001137789/000113778926000300/stxq12027pressreleasefinan.htm"
  },
  {
   "d": "2026-09-14",
   "h": "Seagate published survey research finding nearly all organisations expect AI to increase storage requirements.",
   "u": "https://www.stocktitan.net/news/STX/global-seagate-research-finds-nearly-all-organizations-expect-ai-to-agz6nbt6isjz.html"
  },
  {
   "d": "2026-09-09",
   "h": "Seagate completed the redemption of its exchangeable notes.",
   "u": "https://www.stocktitan.net/news/STX/seagate-completes-redemption-of-exchangeable-1iojn900uffy.html"
  }
 ],
 "WDC": [
  {
   "d": "2026-10-22",
   "h": "September-quarter revenue $4.38bn, up 55%; 57.8% gross margin; December quarter guided to $5.1bn, up 66-72%",
   "u": "https://westerndigital.com/company/newsroom/press-releases/2026/2026-10-22-wd-reports-fiscal-first-quarter-2027-financial-results"
  },
  {
   "d": "2026-09-14",
   "h": "Western Digital announced the redemption of its 3.00% convertible senior notes due 2028.",
   "u": "https://www.stocktitan.net/news/WDC/western-digital-announces-redemption-of-3-00-convertible-senior-lwy7rjhezy52.html"
  },
  {
   "d": "2026-08-05",
   "h": "Fiscal Q4 2026 revenue $3.75 billion, up 44%; non-GAAP gross margin 54.4%, EPS $3.56; fiscal Q1 2027 guided to about $4.1 billion and $4.00 EPS.",
   "u": "https://www.stocktitan.net/news/WDC/wd-reports-fiscal-fourth-quarter-and-fiscal-year-2026-financial-vvtkd43s3yuu.html"
  }
 ],
 "NET": [
  {
   "d": "2026-08-11",
   "h": "Cloudflare priced $2.175 billion of 0% convertible notes due 2031, convertible at about $496.94, a 60% premium, with capped calls.",
   "u": "https://www.stocktitan.net/news/NET/cloudflare-inc-announces-pricing-of-offering-of-2-175-billion-of-0-lvu2ooxokybw.html"
  },
  {
   "d": "2026-08-10",
   "h": "Cloudflare achieved FedRAMP High authorisation for US government work.",
   "u": "https://www.stocktitan.net/news/NET/cloudflare-achieves-fed-ramp-high-authorization-to-secure-and-qo2u12j1jfj3.html"
  }
 ],
 "TEAM": [
  {
   "d": "2026-09-10",
   "h": "Atlassian launched a system to coordinate agentic engineering work across its products.",
   "u": "https://www.stocktitan.net/news/TEAM/atlassian-launches-system-to-coordinate-and-accelerate-agentic-2lmhp7bq3wls.html"
  },
  {
   "d": "2026-08-06",
   "h": "Q4 FY26 revenue $1.77 billion, up 28%, cloud up 31%; FY27 guided to about 13% revenue growth and 25.5% cloud growth.",
   "u": "https://www.stocktitan.net/news/TEAM/atlassian-announces-fourth-quarter-and-fiscal-year-2026-u2n9sve5wan8.html"
  },
  {
   "d": "2026-08-06",
   "h": "CEO Mike Cannon-Brookes said he intends to set up a trading plan to buy up to $250 million of Atlassian Class A stock.",
   "u": "https://www.stocktitan.net/news/TEAM/atlassian-announces-fourth-quarter-and-fiscal-year-2026-u2n9sve5wan8.html"
  }
 ],
 "VEEV": [
  {
   "d": "2026-09-23",
   "h": "Another top-20 biopharma company chose Veeva Vault CRM.",
   "u": "https://www.stocktitan.net/news/VEEV/vault-crm-extends-market-leadershipas-another-top-20-biopharma-rv4prz5u6smy.html"
  },
  {
   "d": "2026-09-15",
   "h": "A leading biotech selected Veeva Vault CRM globally.",
   "u": "https://www.stocktitan.net/news/VEEV/leading-biotech-selects-veeva-vault-crm-uax8r7n6w16m.html"
  },
  {
   "d": "2026-08-26",
   "h": "Q2 FY27 revenue $928.0 million, up 18%, subscription up 16%, non-GAAP EPS $2.35; full-year guidance lifted to $3.682–3.687 billion revenue.",
   "u": "https://www.stocktitan.net/news/VEEV/veeva-announces-fiscal-2027-second-quarter-nu95gdrixwyt.html"
  }
 ],
 "ADP": [
  {
   "d": "2026-09-30",
   "h": "ADP's National Employment Report showed private employers added 90,000 jobs in September 2026; August was revised to 36,000.",
   "u": "https://www.stocktitan.net/news/ADP/adp-national-employment-report-private-sector-employment-increased-lcaz2y7z5bw7.html"
  },
  {
   "d": "2026-09-28",
   "h": "ADP will report first-quarter fiscal 2027 results on 28 October 2026.",
   "u": "https://www.stocktitan.net/news/ADP/adp-to-announce-first-quarter-fiscal-2027-financial-results-on-93oa7nby45iz.html"
  }
 ],
 "FISV": [
  {
   "d": "2026-10-05",
   "h": "Fiserv set 3 November 2026 as the date for third-quarter 2026 results.",
   "u": "https://finance.yahoo.com/markets/stocks/articles/fiserv-release-third-quarter-earnings-210000977.html"
  }
 ],
 "TTD": [
  {
   "d": "2026-10-02",
   "h": "Trade Desk shares hit a 52-week low of $11.85.",
   "u": "https://ca.investing.com/news/stock-market-news/trade-desk-stock-hits-52week-low-at-1185-93CH-4864413"
  }
 ],
 "ROP": [
  {
   "d": "2026-10-22",
   "h": "Q3 revenue $2.17bn, up 8% (7% organic); full-year adjusted EPS guidance raised to $22.35-22.40; share count down to 99m after $2.7bn of buybacks this year",
   "u": "https://www.sec.gov/Archives/edgar/data/0000882835/000088283526000042/a2026q3earningsrelease.htm"
  },
  {
   "d": "2026-10-01",
   "h": "Roper scheduled third-quarter 2026 results for 22 October 2026, before the market opens.",
   "u": "https://www.stocktitan.net/news/ROP/roper-technologies-schedules-third-quarter-2026-financial-results-oa4farf3c2bu.html"
  },
  {
   "d": "2026-09-14",
   "h": "Roper's Procare Solutions acquired Playground, an AI-powered child care software provider; terms not given in the headline.",
   "u": "https://www.stocktitan.net/news/ROP/procare-solutions-acquires-playground-combining-industry-leading-qpk3vhmmbx0p.html"
  }
 ],
 "SNY": [
  {
   "d": "2026-10-30",
   "h": "Q3 sales up 14.3% at constant currency to EUR14.4bn and business EPS up 22%; Dupixent up 35% to EUR5.7bn and 2026 guidance upgraded",
   "u": "https://grafa.com/en/news/united-states/sanofi-q3-2026-sales-rise-16-percent-to-eur14-44-billion"
  },
  {
   "d": "2026-10-06",
   "h": "Sanofi will publish third-quarter 2026 results on 30 October 2026.",
   "u": "https://www.sanofi.com/en/media-room/press-releases/2026/2026-10-06-05-30-00-3375120"
  },
  {
   "d": "2026-10-01",
   "h": "Sanofi will pay Regeneron $1bn upfront, plus up to $7bn in milestones, to co-develop next-generation long-acting immunology antibodies; prior litigation settled.",
   "u": "https://www.sanofi.com/en/media-room/press-releases/2026/2026-10-01-05-00-00-3372517"
  },
  {
   "d": "2026-09-14",
   "h": "Sanofi agreed to transfer 20 mature medicines and three plants to Cheplapharm in exchange for a 26.4% equity stake; completion expected by Q3 2027.",
   "u": "https://www.sanofi.com/en/media-room/press-releases/2026/2026-09-14-13-03-56-3361178"
  }
 ],
 "GSK": [
  {
   "d": "2026-10-28",
   "h": "Q3 sales up 5% to GBP8.9bn as specialty medicines grow 15% while vaccines soften; 2026 guidance reaffirmed",
   "u": "https://kalkine.com/news/announcements/gsk-q3-2026-sales-89bn-core-eps-up-1"
  },
  {
   "d": "2026-10-06",
   "h": "ViiV's long-acting Cabenuva beat daily oral therapy on viral suppression at six months in people with viremia in the Phase IIIb CROWN trial.",
   "u": "https://www.gsk.com/en-gb/media/press-releases/viiv-healthcare-s-long-acting-hiv-treatment-cabenuva-cabotegravir-plus-rilpivirine-meets-primary-endpoint-of-superior-viral-suppression-vs-daily-oral-therapy-in-people-with-viremia/"
  },
  {
   "d": "2026-09-15",
   "h": "GSK agreed to acquire a trispecific T cell-engager for multiple myeloma from Chimagen Biosciences for up to $750m including milestones.",
   "u": "https://www.gsk.com/en-gb/media/press-releases/gsk-to-acquire-potential-best-in-class-t-cell-engager-tce-for-multiple-myeloma-from-chimagen-biosciences/"
  },
  {
   "d": "2026-09-01",
   "h": "GSK will advance its mRNA seasonal flu vaccine candidate to Phase III after positive Phase II data.",
   "u": "https://www.gsk.com/en-gb/media/press-releases/gsk-to-advance-mrna-seasonal-flu-vaccine-candidate-to-phase-iii-following-positive-phase-ii-data/"
  }
 ],
 "MRNA": [
  {
   "d": "2026-10-01",
   "h": "Nasdaq said Moderna will join the Nasdaq-100 on 9 October 2026, replacing Warner Bros. Discovery.",
   "u": "https://www.stocktitan.net/news/NDAQ/moderna-inc-to-join-the-nasdaq-100-index-beginning-october-9-mq90cqb2xw0t.html"
  },
  {
   "d": "2026-08-28",
   "h": "Moderna priced an upsized $2.6bn zero-coupon convertible due 2032, conversion price about $210.58, a 47.5% premium to $142.77.",
   "u": "https://www.stocktitan.net/news/MRNA/moderna-announces-pricing-of-upsized-2-6-billion-offering-of-7g6fgrpeohkx.html"
  },
  {
   "d": "2026-08-19",
   "h": "Phase 3 INTerpath-001 of intismeran plus Keytruda in resected melanoma met its recurrence-free survival primary endpoint at an interim analysis.",
   "u": "https://www.stocktitan.net/news/MRK/merck-and-moderna-announce-phase-3-in-terpath-001-trial-of-xjfqxswsydqg.html"
  },
  {
   "d": "2026-08-05",
   "h": "FDA granted full approval to Moderna's mRNA flu vaccine mFLUSIVA for adults aged 50 and older.",
   "u": "https://www.stocktitan.net/news/MRNA/moderna-receives-u-s-fda-approval-for-influenza-vaccine-m-8obxyt0n1i54.html"
  }
 ],
 "BIIB": [
  {
   "d": "2026-10-28",
   "h": "Q3 revenue of $2.8bn beats as the growth portfolio (Leqembi, Skyclarys, Zurzuvae) overtakes the legacy MS franchise",
   "u": "https://www.investing.com/news/company-news/biogen-q3-2026-slides-growth-portfolio-surpasses-legacy-ms-business-93CH-4979691"
  },
  {
   "d": "2026-10-02",
   "h": "Biogen reported 52-week Phase 2 data showing rapid and durable efficacy for litifilimab in cutaneous lupus erythematosus.",
   "u": "https://www.stocktitan.net/news/BIIB/biogen-s-litifilimab-demonstrates-rapid-and-durable-efficacy-in-new-esipoyv1owfl.html"
  },
  {
   "d": "2026-08-24",
   "h": "Leqembi Iqlik subcutaneous autoinjector, approved in July for starting therapy, became available in the US for early Alzheimer's disease.",
   "u": "https://www.stocktitan.net/news/BIIB/leqembi-iqlik-lecanemab-irmb-autoinjector-for-initiation-of-therapy-3uvt2g6f5bb5.html"
  },
  {
   "d": "2026-08-06",
   "h": "Biogen completed its acquisition of RayThera, a private immunology small-molecule developer, in a deal agreed in June worth up to $1bn.",
   "u": "https://www.stocktitan.net/news/BIIB/biogen-completes-acquisition-of-ray-thera-ar4sxk5so5du.html"
  }
 ],
 "IDXX": [
  {
   "d": "2026-10-01",
   "h": "IDEXX will report third-quarter 2026 results before the market opens on 2 November 2026.",
   "u": "https://www.stocktitan.net/news/IDXX/idexx-laboratories-to-release-2026-third-quarter-financial-rep7xeicoyns.html"
  },
  {
   "d": "2026-09-16",
   "h": "IDEXX acquired CoVetAI, a veterinary workflow software company; terms not disclosed in the headline.",
   "u": "https://www.stocktitan.net/news/IDXX/idexx-laboratories-acquires-co-vet-ai-to-advance-veterinary-workflow-e151bwdvdlmc.html"
  },
  {
   "d": "2026-08-11",
   "h": "IDEXX added a dual-species point-of-care NT-proBNP cardiac test to its Catalyst analyser platform.",
   "u": "https://www.stocktitan.net/news/IDXX/idexx-expands-catalyst-platform-into-cardiac-disease-with-first-and-0e9se2m09wys.html"
  },
  {
   "d": "2026-08-04",
   "h": "Q2 2026 revenue $1.217bn, up 10% (9% organic), EPS $4.27, up 18%; 2026 EPS outlook raised to $14.69-14.94.",
   "u": "https://www.stocktitan.net/news/IDXX/idexx-laboratories-announces-second-quarter-vqwj432xvnrs.html"
  }
 ],
 "A": [
  {
   "d": "2026-09-08",
   "h": "Board chair Koh Boon Hwee retired; Dow Wilson became chair effective 4 September 2026 and Glenn Boehnlein joined the board.",
   "u": "https://www.stocktitan.net/news/A/agilent-announces-retirement-of-board-chair-koh-boon-hwee-x3c0aoyz48zx.html"
  },
  {
   "d": "2026-08-26",
   "h": "Fiscal Q3 2026 revenue $1.88bn, up 8.1% (7.3% core), non-GAAP EPS $1.62, up 18%; full-year EPS guidance raised to $6.18-6.21.",
   "u": "https://www.stocktitan.net/news/A/agilent-reports-third-quarter-fiscal-year-2026-financial-mijwgwne1e57.html"
  }
 ],
 "EW": [
  {
   "d": "2026-10-07",
   "h": "Edwards will host its next earnings call on 4 November 2026, after a TCT investor event on 2 November.",
   "u": "https://www.stocktitan.net/news/EW/edwards-lifesciences-to-host-earnings-conference-call-on-november-4-f7letkj7ogyf.html"
  },
  {
   "d": "2026-10-01",
   "h": "FDA approved the AUTUS valve, the first surgical pulmonary valve for paediatric patients.",
   "u": "https://www.stocktitan.net/news/EW/edwards-lifesciences-receives-fda-approval-for-autus-valve-the-first-f7is9qzy36ph.html"
  },
  {
   "d": "2026-09-10",
   "h": "CMS issued an updated TAVR national coverage determination; Edwards said it expands patient access and reiterated 2026 guidance.",
   "u": "https://www.stocktitan.net/news/EW/edwards-lifesciences-comments-on-tavr-national-coverage-cfpqe1dqe1kv.html"
  }
 ],
 "CNC": [
  {
   "d": "2026-10-27",
   "h": "Q3 health benefits ratio of 92.7% beats expectations and the 2026 adjusted EPS floor is lifted above $5.20; Medicare Advantage nears breakeven",
   "u": "https://marketchameleon.com/articles/b/2026/10/27/cnc-q3-2026-results-adjusted-eps-guidance-hbr-92-7"
  },
  {
   "d": "2026-10-01",
   "h": "Wellcare unveiled its 2027 Medicare Advantage and prescription drug plan offerings.",
   "u": "https://www.stocktitan.net/news/CNC/wellcare-unveils-2027-medicare-offerings-focused-on-affordability-dmwhs1qraw3b.html"
  },
  {
   "d": "2026-08-17",
   "h": "Centene said CFO Drew Asher will step down at end-2026, succeeded by Chris Neczypor on 1 January 2027, and reaffirmed 2026 adjusted EPS guidance above $4.80.",
   "u": "https://www.stocktitan.net/news/CNC/centene-announces-planned-chief-financial-officer-5p0kn8n7atxv.html"
  }
 ],
 "IQV": [
  {
   "d": "2026-10-27",
   "h": "Q3 revenue up 8% to $4.43bn with record R&D Solutions bookings; full-year 2026 guidance raised",
   "u": "https://www.biotechreality.com/2026/10/iqvia-q3-2026-results-revenue-guidance-raised.html"
  },
  {
   "d": "2026-09-29",
   "h": "IQVIA will report third-quarter 2026 results on 27 October 2026.",
   "u": "https://www.stocktitan.net/news/IQV/iqvia-to-announce-third-quarter-2026-results-on-october-27-silyer6ni2zd.html"
  },
  {
   "d": "2026-09-09",
   "h": "IQVIA priced $2.0bn of 6.375% senior notes due 2034 to redeem its 5.000% 2026 notes and repay part of its revolver.",
   "u": "https://www.stocktitan.net/news/IQV/iqvia-announces-pricing-of-senior-xs0i0t53cf86.html"
  }
 ],
 "DXCM": [
  {
   "d": "2026-10-29",
   "h": "Q3 revenue of $1.344bn and EPS of $0.72 beat estimates as margins hit a multi-year high; full-year guidance raised",
   "u": "https://www.investing.com/news/company-news/dexcom-q3-2026-slides-margins-hit-multiyear-high-guidance-raised-93CH-4985422"
  },
  {
   "d": "2026-10-07",
   "h": "DexCom will report third-quarter 2026 results after the market closes on 29 October 2026.",
   "u": "https://www.stocktitan.net/news/DXCM/dexcom-schedules-third-quarter-2026-earnings-release-and-conference-ukm70797gu7b.html"
  },
  {
   "d": "2026-09-28",
   "h": "DexCom published a Type 2 diabetes survey report at EASD 2026 and a monitoring partnership with Team Novo Nordisk.",
   "u": "https://www.stocktitan.net/news/DXCM/dexcom-publishes-new-report-during-easd-2026-on-type-2-diabetes-5c739f0t469v.html"
  },
  {
   "d": "2026-09-14",
   "h": "CFO Jereme Sylvain was also named chief operating officer; the release names Jake Leach as president and CEO.",
   "u": "https://www.stocktitan.net/news/DXCM/dexcom-promotes-jereme-sylvain-to-chief-operating-prtxcns63oym.html"
  }
 ],
 "HUM": [
  {
   "d": "2026-10-01",
   "h": "Humana outlined 2027 Medicare Advantage plans in about 2,600 counties across 45 states, standardising core benefits and expanding chronic-condition special needs plans",
   "u": "https://policy.humana.com/news-and-resources/news-press/2026/humana-maintains-affordable-medicare-advantage-plans-and-expands"
  },
  {
   "d": "2026-09-25",
   "h": "Barclays upgraded Humana to Overweight and raised its target to $515 from $407; shares rose about 7% to $406, up about 60% year to date",
   "u": "https://247wallst.com/investing/2026/09/25/humana-jumps-7-on-barclays-upgrade-and-515-target-unitedhealth-nudges-higher/"
  },
  {
   "d": "2026-09-10",
   "h": "CMS draft 2027 star cutpoints were tougher on about half of measures; Humana says it expects stars to be meaningfully higher next year",
   "u": "https://www.healthcaredive.com/news/medicare-advantage-stars-cutpoints-2027-cms/829963/"
  },
  {
   "d": "2026-08-14",
   "h": "Humana is exiting plans covering about 600,000 Medicare Advantage members for 2027, roughly 8% of its 7.2 million MA members, as disclosed on its Q2 call",
   "u": "https://247wallst.com/personal-finance/2026/08/14/humana-is-dropping-plans-that-cover-600000-medicare-members-in-2027-the-letters-arrive-in-september/"
  }
 ],
 "AON": [
  {
   "d": "2026-10-28",
   "h": "Q3 beat: organic revenue up 6%, adjusted margin widens 70bp to 27.0% and adjusted EPS rises 10% to $3.36; shares gain 5%",
   "u": "https://www.tikr.com/blog/aon-soars-5-on-third-quarter-beat-with-6-organic-growth-and-wider-margins"
  },
  {
   "d": "2026-09-04",
   "h": "Aon expects leverage of about 4.8 times at USI closing, targeting a return to 2.8–3.0 times within roughly 24 months, with buybacks paused",
   "u": "https://finance.yahoo.com/markets/stocks/articles/aon-aon-paying-17b-usi-162842766.html"
  },
  {
   "d": "2026-08-31",
   "h": "Aon agreed to buy USI from KKR and other holders for $17.0 billion in cash, funded with new debt; close expected in Q4 2026",
   "u": "https://aon.mediaroom.com/2026-08-31-Aon-to-acquire-USI-to-establish-the-premier-U-S-middle-market-platform"
  },
  {
   "d": "2026-08-17",
   "h": "CFO Edmund Reese left Aon; Nadin Virani named interim CFO while a permanent search is under way",
   "u": "https://aon.mediaroom.com/2026-08-17-Aon-Announces-CFO-Transition"
  }
 ],
 "USB": [
  {
   "d": "2026-10-15",
   "h": "Q3 net income $2.2bn, up 10%; EPS $1.34; revenue $7.97bn, up about 9%",
   "u": "https://finviz.com/news/403171/us-bancorp-reports-10-rise-in-q3-net-income-to-22-billion-as-earnings-beat-forecasts"
  },
  {
   "d": "2026-10-01",
   "h": "U.S. Bancorp will report third-quarter 2026 results before the market opens on 15 October 2026",
   "u": "https://www.stocktitan.net/news/USB/u-s-bancorp-announces-third-quarter-earnings-conference-call-7cswsucce166.html"
  },
  {
   "d": "2026-09-09",
   "h": "U.S. Bank completed a pilot cross-border payment using USBDC, its own dollar-backed stablecoin on the Stellar blockchain",
   "u": "https://www.stocktitan.net/news/USB/u-s-bank-launches-usbdc-vl9whi7az4tl.html"
  }
 ],
 "PNC": [
  {
   "d": "2026-10-15",
   "h": "Q3 net income $2.1bn, EPS $4.97 against $4.35 a year earlier; revenue $6.56bn, up 11% year on year",
   "u": "https://www.stocktitan.net/news/PNC/pnc-reports-third-quarter-2026-net-income-of-2-1-billion-4-97-jq3ahvudfbhi.html"
  },
  {
   "d": "2026-10-02",
   "h": "PNC declared a $2.00 quarterly common dividend, payable 5 November 2026; Q3 results due 15 October",
   "u": "https://www.stocktitan.net/news/PNC/pnc-declares-dividend-of-2-00-on-common-znmlnumpn89y.html"
  },
  {
   "d": "2026-08-03",
   "h": "PNC opened its 50th new branch since launching its coast-to-coast branch expansion, in Hialeah, Florida",
   "u": "https://www.stocktitan.net/news/PNC/pnc-celebrates-50th-new-branch-opening-since-launch-of-coast-to-oeq4gnllqx9l.html"
  }
 ],
 "TFC": [
  {
   "d": "2026-10-16",
   "h": "Q3 net income fell 45% to $799m after $1.45bn of securities losses from repositioning the balance sheet; revenue $3.75bn",
   "u": "https://capital.com/en-ae/news/truist-3q26-net-income-falls-45-year-over-year-to"
  },
  {
   "d": "2026-09-18",
   "h": "Truist set third-quarter 2026 results for 16 October 2026, with CEO Mike Lyons and CFO Mike Maguire hosting the call",
   "u": "https://www.stocktitan.net/news/TFC/truist-announces-third-quarter-2026-earnings-call-jt4iryhmpmym.html"
  },
  {
   "d": "2026-09-17",
   "h": "Truist redeemed all $850 million of subordinated notes due October 2026 on 30 September at par",
   "u": "https://www.stocktitan.net/news/TFC/truist-announces-redemption-of-subordinated-notes-due-october-nyv0cbzgi6zc.html"
  }
 ],
 "AIG": [
  {
   "d": "2026-09-16",
   "h": "Jon Hancock will retire as CEO of General Insurance at the end of 2026; Sierra Signorelli named CEO of Americas and Global Personal from January 2027",
   "u": "https://www.stocktitan.net/news/AIG/jon-hancock-to-retire-from-fvadyl51x1z3.html"
  },
  {
   "d": "2026-09-02",
   "h": "Peter Zaffino to step down as executive chair and leave the board on 15 September 2026; John Rice becomes chair",
   "u": "https://www.stocktitan.net/news/AIG/aig-announces-board-leadership-9j6r1q6r9pv3.html"
  },
  {
   "d": "2026-08-06",
   "h": "Q2 2026 adjusted EPS rose 10% to $2.00; General Insurance premiums up 9% to $7.5 billion, combined ratio 89.0%; $641 million of buybacks",
   "u": "https://www.stocktitan.net/news/AIG/aig-delivers-strong-second-quarter-results-and-exceptional-first-24drx4dsrusk.html"
  }
 ],
 "MET": [
  {
   "d": "2026-08-05",
   "h": "Q2 2026 adjusted EPS rose 20% to $2.43 and adjusted ROE reached 17.0%; net investment income up 18% to $6.7 billion",
   "u": "https://www.stocktitan.net/news/MET/met-life-announces-2q-2026-3kbozgu1mctx.html"
  },
  {
   "d": "2026-08-05",
   "h": "MetLife authorised a new $3 billion share repurchase, on top of about $400 million left under the April 2025 programme",
   "u": "https://www.stocktitan.net/news/MET/met-life-announces-new-3-billion-share-repurchase-s48n1lzvrpoh.html"
  }
 ],
 "APO": [
  {
   "d": "2026-10-01",
   "h": "Apollo extended daily pricing to all its credit assets, with asset-level pricing expected from 30 October 2026",
   "u": "https://ir.apollo.com/news-events/press-releases/detail/654/apollo-expands-daily-pricing-to-all-credit-assets"
  },
  {
   "d": "2026-08-10",
   "h": "NVIDIA named Apollo among six firms partnering to set up AI compute infrastructure financing platforms",
   "u": "https://ir.apollo.com/news-events/press-releases/detail/642/nvidia-partners-with-apollo-blackrock-blackstone"
  },
  {
   "d": "2026-08-04",
   "h": "Q2 2026 record fee-related earnings of $785 million, up 25%, and spread-related earnings of $877 million; AUM about $1.05 trillion, origination $74 billion",
   "u": "https://ir.apollo.com/_assets/_a02f093a9b29fcd2623e09250f4f4dbe/apollo/db/2247/22879/full_earnings_release/AGM+Earnings+Release+2Q%272026.pdf"
  }
 ],
 "AJG": [
  {
   "d": "2026-10-29",
   "h": "Q3 brokerage and risk management revenue up 18% with 5% organic growth; adjusted EPS $3.00 vs $2.31",
   "u": "https://www.sec.gov/Archives/edgar/data/0000354190/000162828026068263/a3rdquarter2026earningsrel.htm"
  },
  {
   "d": "2026-10-01",
   "h": "Gallagher acquired Albany Insurance Services, a New Zealand retail broker; terms not disclosed",
   "u": "https://www.stocktitan.net/news/AJG/arthur-j-gallagher-co-acquires-albany-insurance-services-7a7fm4zj2xiy.html"
  },
  {
   "d": "2026-09-15",
   "h": "Gallagher acquired Colorado-based Innovise Business Consultants (McMillan Insurance & Bonding); terms not disclosed",
   "u": "https://www.stocktitan.net/news/AJG/arthur-j-gallagher-co-acquires-innovise-business-faiblzmbqw5k.html"
  }
 ],
 "HDB": [
  {
   "d": "2026-10-17",
   "h": "Q2 FY27 net profit up 4.7% to Rs19,510 crore as NII rises 9.7% and deposits grow 19%; a treasury loss weighs on profit",
   "u": "https://www.business-standard.com/companies/quarterly-results/hdfc-bank-q2fy27-result-net-profit-rises-4-7-to-19-510-cr-nii-up-9-7-126101700465_1.html"
  }
 ],
 "IBN": [
  {
   "d": "2026-10-17",
   "h": "Q2 FY27 consolidated profit up 22% to Rs16,333 crore as provisions fall and loans grow 24% excluding FCNR(B)",
   "u": "https://www.business-standard.com/companies/quarterly-results/icici-bank-q2-fy27-result-net-profit-rises-22-3-to-16-333-crore-126101700550_1.html"
  }
 ],
 "CVNA": [
  {
   "d": "2026-10-29",
   "h": "Record Q3 revenue up 42% to $8.04bn on 217,385 retail units, up 39%, with record profitability",
   "u": "https://www.stocktitan.net/sec-filings/CVNA/8-k-carvana-co-reports-material-event-e896c89a119e.html"
  }
 ],
 "MBLY": [
  {
   "d": "2026-10-29",
   "h": "Q3 revenue slips 2% to $492m but beats as EyeQ shipments outpace global production by 11%; 2026 revenue outlook lifted to $2.01bn",
   "u": "https://finance.biggo.com/news/US_MBLY_2026-10-29"
  }
 ],
 "AMX": [
  {
   "d": "2026-10-21",
   "h": "Q3 revenue up 7.6% to MXN251bn and profit up 7% to about $1.3bn, topping estimates; cash flow cuts net debt and shares jump 6%",
   "u": "https://www.tikr.com/blog/america-movil-jumps-6-as-third-quarter-profit-rises-7-topping-earnings-and-revenue-estimates"
  }
 ],
 "RBLX": [
  {
   "d": "2026-10-29",
   "h": "Q3 bookings fall 12% to $1.7bn and daily active users drop 9% to 138 million against a record 2025; Q4 bookings guided down 10% to 15%",
   "u": "https://www.gaming.net/roblox-q3-revenue-rises-16-as-bookings-fall-12-to-1-7-billion/"
  }
 ],
 "OMC": [
  {
   "d": "2026-10-22",
   "h": "Q3 organic growth accelerates to 7.2% and EPS jumps 22% to $2.73 as Interpublic synergies add 200bp of margin",
   "u": "https://finance.biggo.com/news/US_OMC_2026-10-22"
  }
 ],
 "SOFI": [
  {
   "d": "2026-10-27",
   "h": "Record Q3 net revenue of $1.4bn and net income of $241m; full-year guidance raised and shares jump 11%",
   "u": "https://investors.sofi.com/news/news-details/2026/SoFi-Reports-Third-Quarter-2026-with-Record-Net-Revenue-of-1-4-Billion-Net-Income-of-241-Million-and-Raises-Full-Year-Guidance/default.aspx"
  }
 ],
 "APH": [
  {
   "d": "2026-10-28",
   "h": "Q3 sales $10.2bn, up 65% (37% organic); record $12.2bn of orders; dividend raised 20% and a new $4bn buyback",
   "u": "https://www.sec.gov/Archives/edgar/data/0000820313/000110465926119421/aph-ex99d1.htm"
  }
 ],
 "ALNY": [
  {
   "d": "2026-10-29",
   "h": "Q3 product revenue up 52% on AMVUTTRA demand in ATTR cardiomyopathy; EPS boosted by a $1.9bn tax benefit",
   "u": "https://www.tradingkey.com/news/earnings/262252849-tradingkey"
  }
 ],
 "GEHC": [
  {
   "d": "2026-10-28",
   "h": "Q3 beats with strong organic growth and wider margins as adjusted EPS rises; full-year guidance raised",
   "u": "https://www.chartmill.com/news/GEHC/Chartmill-57026-GE-HealthCare-NASDAQGEHC-Q3-Earnings-Beat-and-Raised-Guidance-Drive-Premarket-Gains"
  }
 ],
 "IBKR": [
  {
   "d": "2026-10-15",
   "h": "Q3 net revenues up 16% to $1.91bn; customer accounts up 35% to 5.58 million and client equity up 27% to $965bn",
   "u": "https://finviz.com/news/403263/interactive-brokers-group-announces-3q2026-results"
  }
 ],
 "BK": [
  {
   "d": "2026-10-15",
   "h": "Q3 net income $1.61bn, up 20%; fee revenue up 12%; assets under custody and administration $63.4tn, up 10%",
   "u": "https://www.familywealthreport.com/article.php/BNY-Says-Q3-2026-Net-Income-Higher"
  }
 ],
 "TRV": [
  {
   "d": "2026-10-16",
   "h": "Q3 net income $1.92bn, or $9.04 a share; combined ratio improved to 86.8%; net written premiums roughly flat",
   "u": "https://insurancenewsnet.com/oarticle/travelers-reports-excellent-third-quarter-and-year-to-date-results-3"
  }
 ],
 "MSCI": [
  {
   "d": "2026-10-20",
   "h": "Q3 revenue up 12.4% to $892m with asset-based fees up 25% on record ETF assets linked to MSCI indexes; adjusted EPS up 14% to $5.11",
   "u": "https://finviz.com/news/404371/msci-reports-financial-results-for-third-quarter-and-nine-months-2026"
  }
 ],
 "ARES": [
  {
   "d": "2026-10-29",
   "h": "Q3 fee-related earnings of $524m and realized income of $1.26 a share; more than $31bn raised as AUM reaches about $691bn",
   "u": "https://www.sec.gov/Archives/edgar/data/0001176948/000162828026067994/a2026q3-ex991.htm"
  }
 ],
 "HLT": [
  {
   "d": "2026-10-27",
   "h": "Q3 RevPAR up 5.8% with US up 7.0% and a record pipeline; full-year adjusted EPS guided to $9.07-$9.13",
   "u": "https://lexpress-franchise.com/en-us/news/hilton-q3-2026-record-results-nasdaq/"
  },
  {
   "d": "2026-10-20",
   "h": "Moves its listing from the NYSE to Nasdaq effective 5 November 2026, keeping the HLT ticker",
   "u": "https://lexpress-franchise.com/en-us/news/hilton-q3-2026-record-results-nasdaq/"
  }
 ],
 "RCL": [
  {
   "d": "2026-10-27",
   "h": "Q3 revenue up 9% to $5.6bn and adjusted EPS of $6.57 beat; 2026 adjusted EPS guide raised to $17.85-$17.95",
   "u": "https://cruiseindustrynews.com/cruise-news/2026/10/royal-caribbean-group-reports-q3-2026-results-raises-full-year-guidance/"
  }
 ],
 "UL": [
  {
   "d": "2026-10-28",
   "h": "Q3 underlying sales growth of 5.2% with turnover up 6.7% to EUR13.3bn; full-year volume outlook raised",
   "u": "https://uk.finance.yahoo.com/news/unilever-reports-5-2-q3-075252616.html"
  }
 ],
 "KMI": [
  {
   "d": "2026-10-21",
   "h": "Record Q3 with adjusted EPS up 21% to $0.35 and adjusted EBITDA of $2.18bn; project backlog reaches a record $14.4bn",
   "u": "https://scanx.trade/stock-market-news/companies/kinder-morgan-fy26-results-adj-eps-guidance-1-36-vs-1-54-est/54159480"
  }
 ],
 "NEM": [
  {
   "d": "2026-10-22",
   "h": "Record Q3 adjusted net income of $2.3bn as gold prices lift EPS 41%, though attributable ounces fall 8%",
   "u": "https://www.geminiq.com/blog/newmont-earnings-q3-2026"
  }
 ],
 "ECL": [
  {
   "d": "2026-10-27",
   "h": "Q3 organic sales growth accelerates to 7% as the data-centre-led High-Tech business surges 63%; growth outlook lifted",
   "u": "https://www.tradingkey.com/news/transcripts/262243957-tradingkey"
  }
 ],
 "AEP": [
  {
   "d": "2026-10-28",
   "h": "Q3 operating EPS of $2.18 on revenue of $6.83bn as demand rises; capital plan expanded and long-term growth outlook increased",
   "u": "https://www.aep.com/news/stories/view/12347/"
  }
 ],
 "TT": [
  {
   "d": "2026-10-29",
   "h": "Q3 revenue of $6.76bn and EPS of $4.79 beat as bookings rise 20% and backlog reaches $12.5bn; revenue guidance raised",
   "u": "https://stockstory.org/us/stocks/nyse/tt/news/earnings/trane-technologies-nysett-posts-better-than-expected-sales-in-q3-2026"
  }
 ],
 "PWR": [
  {
   "d": "2026-10-29",
   "h": "Q3 revenue up 57% to $12.0bn and EPS of $4.55 beat; backlog reaches a record $63.7bn",
   "u": "https://www.kalkine.com/news/announcements/quanta-services-q3-2026-120b-revenue-637b-backlog-record"
  }
 ],
 "HWM": [
  {
   "d": "2026-10-29",
   "h": "Q3 revenue up 29% and EPS up 54%; guidance raised and the buyback authorisation boosted by $5bn",
   "u": "https://www.indexbox.io/blog/howmet-aerospace-q3-2026-revenue-jumps-29-to-270-billion/"
  }
 ]
}
