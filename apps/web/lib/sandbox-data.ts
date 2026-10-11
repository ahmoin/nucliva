// What a guest finds in the sandbox for each line of work: a workspace that
// looks lived in, with earlier documents, a sheet, a deck, notes to write
// from and a few samples of writing to match. All of it is made up.

export interface SandboxDoc {
  // How many days ago it was last changed.
  ago: number;
  // Lines of text. "## " starts a heading and "- " a bullet.
  body: string[];
  starred?: boolean;
  title: string;
}

export interface SandboxSheet {
  ago: number;
  // The first row is the header.
  rows: (string | number)[][];
  title: string;
}

export interface SandboxDeck {
  ago: number;
  slides: { points: string[]; title: string }[];
  title: string;
}

export interface Workspace {
  deck: SandboxDeck;
  docs: SandboxDoc[];
  // Rough notes for the document the guest lands in.
  notes: string[];
  samples: string[];
  sheet: SandboxSheet;
}

export const workspaces: Record<string, Workspace> = {
  consulting: {
    deck: {
      ago: 5,
      slides: [
        {
          points: [
            "Margins are down 3 points in two years",
            "Most of the loss is in about 200 products",
          ],
          title: "What we found",
        },
        {
          points: [
            "Raise private label by 4%",
            "Stop matching rivals on loss leaders",
            "Test weekly pricing in five stores",
          ],
          title: "Three changes",
        },
        {
          points: [
            "Weeks 1 to 2: set the new prices",
            "Weeks 3 to 8: run the store test",
            "Week 9: decide and roll out",
          ],
          title: "Plan and timing",
        },
      ],
      title: "Pricing review, client readout",
    },
    docs: [
      {
        ago: 20,
        body: [
          "## Summary",
          "Northgate has 40 stores and a margin problem that is easy to describe and harder to fix. Sales are steady, but gross margin has slipped from 31% to 28% in two years.",
          "## What we did",
          "- Reviewed 24 months of sales data across all stores",
          "- Interviewed six store managers and the head of buying",
          "- Compared prices on 200 products with two main rivals",
        ],
        starred: true,
        title: "Northgate pricing review, scope",
      },
      {
        ago: 9,
        body: [
          "## Competitors",
          "Two rivals are discounting the same 200 products, mostly in groceries and household goods. Our client has matched them on almost all of these, and loses money on about a third.",
          "## Private label",
          "The client's own brand sells well, and sits 11% under comparable brands. There is room to raise prices without losing the customer.",
        ],
        title: "Market scan, notes",
      },
      {
        ago: 3,
        body: [
          "## Interview themes",
          "- Store managers feel pressure to match prices they cannot afford",
          "- Buying wants clearer rules on when to follow a rival",
          "- Nobody tracks which discounts bring people back",
        ],
        title: "Interview notes, store managers",
      },
    ],
    notes: [
      "Client: a retail chain with 40 stores, asked us to review pricing",
      "Gross margin is down 3 points over two years",
      "Two big competitors are discounting the same 200 products",
      "Our own private label sells well but is priced too low",
      "Draft ideas: raise private label by 4%, stop matching on loss leaders, test weekly pricing in 5 stores",
      "Report due to the client on Friday, they like short and direct",
    ],
    samples: [
      "The short answer is that margins are being lost in a few places, not everywhere. Three changes would recover most of it, and none of them needs new tools. We set them out below, in the order we would do them.",
      "We looked at 24 months of sales data across all 40 stores. What stood out was how much of the discounting was a reaction to two rivals, not to customers. That is good news, because it is a choice and not a trend.",
      "A note on method. We kept the analysis simple on purpose, so your team can repeat it each quarter without us. Everything is in the attached sheet.",
    ],
    sheet: {
      ago: 8,
      rows: [
        ["Category", "Margin 2024", "Margin 2026", "Change"],
        ["Groceries", "24%", "20%", "-4"],
        ["Household", "33%", "29%", "-4"],
        ["Private label", "41%", "40%", "-1"],
        ["Electronics", "18%", "17%", "-1"],
      ],
      title: "Margin by category",
    },
  },
  founders: {
    deck: {
      ago: 14,
      slides: [
        {
          points: [
            "Small teams write all day, and it all sounds the same",
            "Editing a draft takes longer than writing one",
          ],
          title: "The problem",
        },
        {
          points: [
            "Revenue $48k a month, up 17% in October",
            "Churn 1.8%, flat for four months",
          ],
          title: "Traction",
        },
        {
          points: [
            "Raising $1.5M to hire three engineers",
            "Eighteen months of runway after the round",
          ],
          title: "The ask",
        },
      ],
      title: "Seed pitch, draft",
    },
    docs: [
      {
        ago: 30,
        body: [
          "Hi all, short one again.",
          "## Highlights",
          "- Revenue reached $41k a month, up 9%",
          "- Shipped the template library",
          "- Signed two agencies",
          "## Metrics",
          "Churn was 1.9%. Trial to paid is 14%, up from 12%.",
          "## Asks",
          "Intros to seed investors in fintech, and a designer for a few hours a week. Thank you, as always, for the support.",
        ],
        starred: true,
        title: "September investor update",
      },
      {
        ago: 12,
        body: [
          "## Why now",
          "- Writing tools have all gone the same way, and people can tell",
          "- Models are now good enough to match a voice, not just fill a page",
          "## What we say if they ask about moats",
          "Our edge is the loop: draft, review, accept or reject. People teach it by using it.",
        ],
        title: "Seed round, talking points",
      },
      {
        ago: 6,
        body: [
          "## Roles for Q4",
          "- Second engineer, starts Monday",
          "- Part time designer, 10 hours a week",
          "- Customer success, once we pass 200 teams",
        ],
        title: "Hiring plan, Q4",
      },
      {
        ago: 2,
        body: [
          "## What people said",
          "- 'The first draft is never the problem, the second one is.'",
          "- 'I would pay for something that sounds like me.'",
          "- 'Export was the one thing I could not do.'",
        ],
        title: "Customer interviews, October",
      },
    ],
    notes: [
      "Revenue is $48k a month, up from $41k last month",
      "Signed three new teams, two are agencies, one is an in-house team of 12",
      "Churn flat at 1.8%",
      "Shipped export to PDF and Markdown, two weeks late, but people like it",
      "Hired our second engineer, she starts Monday",
      "Need: intros to seed investors in fintech, and a designer for 10 hours a week",
    ],
    samples: [
      "Hi all, a short one this month, as always. Revenue is up, churn is flat and the team is a little tired but happy. Two things I would love your help with are at the bottom. Thank you, as ever, for the support.",
      "We shipped the thing we said we would ship, a bit late. I would rather be late and good than on time and sorry. More on what we learned below, including one mistake I would like you to hear from me.",
      "Quick note on hiring. We are going slowly on purpose. Every person we add changes how we work, so we want to be sure about each one. If you know someone great, send them over.",
    ],
    sheet: {
      ago: 4,
      rows: [
        ["Month", "MRR ($)", "New teams", "Churn"],
        ["June", 28000, 4, "2.1%"],
        ["July", 33000, 6, "2.0%"],
        ["August", 37000, 5, "1.9%"],
        ["September", 41000, 5, "1.9%"],
        ["October", 48000, 7, "1.8%"],
      ],
      title: "Monthly metrics",
    },
  },
  legal: {
    deck: {
      ago: 18,
      slides: [
        {
          points: [
            "A two year term that renews on its own",
            "A liability cap at 12 months of fees",
          ],
          title: "The agreement at a glance",
        },
        {
          points: [
            "No right to end the contract early",
            "No data protection clause",
            "Prices can rise 8% a year",
          ],
          title: "Where we would push",
        },
      ],
      title: "Supplier agreement, client briefing",
    },
    docs: [
      {
        ago: 11,
        body: [
          "## The issue",
          "The agreement renews for a further two years unless notice is given 60 days before the end. A client who misses the date is locked in.",
          "## What we suggest",
          "- Ask for 90 days notice, or a reminder from the supplier",
          "- Ask for a right to end early on 30 days notice after year one",
        ],
        starred: true,
        title: "Renewal clause, note to client",
      },
      {
        ago: 7,
        body: [
          "## Data protection",
          "The supplier will hold customer data, but the agreement says nothing about how. We recommend a short data clause that covers use, storage and what happens at the end.",
        ],
        title: "Data clause, draft wording",
      },
      {
        ago: 2,
        body: [
          "## Facts",
          "- Supplier of billing software to a small company",
          "- Two year term, signed by both sides last month",
          "- Annual price rises of up to 8%",
          "## Questions for the client",
          "- Do you plan to stay with this supplier past year one?",
          "- Who handles customer data on their side?",
        ],
        title: "Matter intake, supplier agreement",
      },
    ],
    notes: [
      "Matter: a supplier agreement for a small software company",
      "Two year term that renews on its own unless notice is given 60 days before",
      "Liability is capped at the fees paid in the last 12 months",
      "No right to end the contract early, and no data protection clause",
      "The supplier can raise prices once a year by up to 8%",
      "Next steps: ask for a termination right, add a data clause, review the renewal notice",
    ],
    samples: [
      "In short, the agreement is workable, but three points should be fixed before signing. We explain each one below in plain terms, with the clause it comes from, so you can see where we are looking.",
      "The key issue is the renewal. As written, the contract renews on its own, and the window to stop it is short. We recommend asking for a longer notice period, or for a reminder from the supplier.",
      "This is a summary, not a full review. If you would like us to go further on any point, say which and we will do it.",
    ],
    sheet: {
      ago: 9,
      rows: [
        ["Clause", "Where", "Status", "Comment"],
        ["Term and renewal", "3.1", "Flag", "Renews on its own"],
        ["Liability cap", "9.2", "OK", "12 months of fees"],
        ["Early termination", "none", "Missing", "Ask for a right"],
        ["Data protection", "none", "Missing", "Add a short clause"],
        ["Price changes", "5.4", "Flag", "Up to 8% a year"],
      ],
      title: "Clause checklist",
    },
  },
  marketing: {
    deck: {
      ago: 10,
      slides: [
        {
          points: [
            "Freelance writers, small agencies, independent bookshops",
            "People who care how their words sound",
          ],
          title: "Who we are talking to",
        },
        {
          points: [
            "Write in your own voice, not a robot's",
            "Proof: a draft that sounds like you in minutes",
          ],
          title: "The one message",
        },
        {
          points: [
            "Newsletter, LinkedIn and Product Hunt",
            "Launch on 14 June, with a week of posts before",
          ],
          title: "Channels and timing",
        },
      ],
      title: "Spring launch, campaign deck",
    },
    docs: [
      {
        ago: 25,
        body: [
          "## What worked",
          "- Posts with a before and after of a real draft got the most clicks",
          "- The newsletter beat LinkedIn, two to one",
          "## What did not",
          "- Long product tours, and anything with the word 'revolutionary'",
        ],
        starred: true,
        title: "Last campaign, what we learned",
      },
      {
        ago: 8,
        body: [
          "## Voice",
          "Plain, warm, a little dry. Short sentences. We say 'you', not 'users'. We do not use exclamation marks.",
        ],
        title: "Brand voice, one page",
      },
      {
        ago: 3,
        body: [
          "## Week of 9 June",
          "- Monday: teaser on LinkedIn",
          "- Wednesday: newsletter with a real draft",
          "- Friday: behind the scenes post",
        ],
        title: "Launch week plan",
      },
    ],
    notes: [
      "Launching a new library of templates this spring",
      "Audience: freelance writers, small agencies and independent bookshops",
      "Main angle: write in your own voice, not in a robot's",
      "Channels: our newsletter, LinkedIn and Product Hunt",
      "Budget is $4,000 and the launch date is 14 June",
      "Our last campaign got a 2.1% click rate, we want to beat it",
    ],
    samples: [
      "Most writing tools make everything sound the same. We think your words should sound like you. That is the whole idea, and it is why we built this. Here is what that looks like in practice.",
      "No buzzwords, no big promises. Just a tool that learns how you write and helps you do more of it. Try it on something real, and tell us what you think.",
      "Here is a draft, before and after. The first one is what a generic tool gave us. The second is what we got once it had read a few of our own emails. Same idea, very different feel.",
    ],
    sheet: {
      ago: 5,
      rows: [
        ["Week", "Topic", "Channel", "Status"],
        ["1", "Teaser", "LinkedIn", "Done"],
        ["2", "Real draft", "Newsletter", "Draft"],
        ["3", "Behind the scenes", "LinkedIn", "Idea"],
        ["4", "Launch", "Product Hunt", "Planned"],
      ],
      title: "Content calendar",
    },
  },
  media: {
    deck: {
      ago: 16,
      slides: [
        {
          points: [
            "Short, curious subject lines",
            "One line of context for every link",
          ],
          title: "What our readers like",
        },
        {
          points: [
            "Open with the story people are talking about",
            "Finish with something warm",
          ],
          title: "How an issue is built",
        },
      ],
      title: "Newsletter playbook",
    },
    docs: [
      {
        ago: 7,
        body: [
          "Good morning. The week in short, five links and a reason to read each.",
          "## Port delays",
          "A new report says delays cost importers about $4 billion this year. The numbers are rough, but the pattern is not.",
          "## The baker",
          "A profile of a baker who stayed open through all of it. Read it for the bread, stay for the last paragraph.",
        ],
        starred: true,
        title: "Issue 41, last Thursday",
      },
      {
        ago: 4,
        body: [
          "## Sources to check",
          "- Port authority statement, Monday",
          "- Two shipping firms, both on the record",
          "- A union spokesperson, off the record so far",
        ],
        title: "Port delays, research brief",
      },
      {
        ago: 1,
        body: [
          "## Links this week",
          "- Port delays report",
          "- A profile of a local baker",
          "- Two stories on interest rates",
          "- A long read on AI in classrooms",
        ],
        title: "Link pile",
      },
    ],
    notes: [
      "This week's links: a report on port delays, a profile of a local baker, two stories on interest rates and a long read on AI in classrooms",
      "Lead with the port delays, it is the story people are talking about",
      "Keep the baker as the warm one near the end",
      "Readers like a line of context for each link, not a summary",
      "Subject line should be short and a bit curious",
      "Sent on Thursday mornings, about a 5 minute read",
    ],
    samples: [
      "Good morning. The ports are backed up again, and this time it is not the weather. Here is what we know, what we do not, and where to look for more.",
      "That is the week. If one story stayed with you, reply and tell me which. I read every answer, and it shapes what goes in next Thursday.",
      "A correction from last week: the figure was $2.1 billion, not $21 billion. Thank you to the three of you who wrote in within the hour.",
    ],
    sheet: {
      ago: 6,
      rows: [
        ["Issue", "Opens", "Clicks", "Top link"],
        ["38", "52%", "9%", "Rates explained"],
        ["39", "55%", "11%", "Port delays"],
        ["40", "49%", "8%", "The baker"],
        ["41", "57%", "12%", "AI in classrooms"],
      ],
      title: "Issue stats",
    },
  },
  operations: {
    deck: {
      ago: 12,
      slides: [
        {
          points: [
            "One owner for each task, one date",
            "Decisions written down the same day",
          ],
          title: "How the team works",
        },
        {
          points: [
            "Supplier checklist in the shared drive",
            "New invoice flow tested with three suppliers",
          ],
          title: "This quarter",
        },
      ],
      title: "Ops review",
    },
    docs: [
      {
        ago: 14,
        body: [
          "## Before you start",
          "You will need the supplier's tax form and a signed contract.",
          "## Steps",
          "- Send the supplier form and wait for the reply",
          "- Check the tax number against the register",
          "- Set them up in the finance system",
          "- Send a welcome email with the contacts they need",
        ],
        starred: true,
        title: "Supplier onboarding, how to",
      },
      {
        ago: 7,
        body: [
          "## Decisions",
          "- Move supplier onboarding to a checklist",
          "## Actions",
          "- Priya: new supplier form, next Wednesday",
          "- Dan: test the invoice flow with three suppliers",
          "## Open",
          "- Who approves orders over $5,000?",
        ],
        title: "Team meeting, last week",
      },
      {
        ago: 2,
        body: [
          "## Policy",
          "Orders over $5,000 need a second person to approve. Until we decide who that is, ask your manager.",
        ],
        title: "Purchasing policy, draft",
      },
    ],
    notes: [
      "Weekly team meeting, notes from the call",
      "Decided to move the supplier onboarding to a checklist in the shared drive",
      "Priya owns the new supplier form, due next Wednesday",
      "Dan will test the new invoice flow with three suppliers before month end",
      "Open question: who approves orders over $5,000, finance or ops",
      "Next meeting is the same time next week",
    ],
    samples: [
      "Here is how it works, start to finish. Follow the steps in order, and if a step does not fit your case, stop and ask. It is better to check than to fix it later.",
      "Decisions first, then actions, then open questions. Each action has one owner and one date. If a date will slip, tell the owner early so the rest can move.",
      "A quick reminder: if a supplier calls about a late payment, do not promise a date. Find out where the invoice is, then call back.",
    ],
    sheet: {
      ago: 3,
      rows: [
        ["Task", "Owner", "Due", "Status"],
        ["New supplier form", "Priya", "Wed", "In progress"],
        ["Test invoice flow", "Dan", "Oct 28", "Not started"],
        ["Approval rule over $5k", "Maya", "Fri", "Blocked"],
        ["Update the checklist", "Dan", "Oct 21", "Done"],
      ],
      title: "Project tracker",
    },
  },
  research: {
    deck: {
      ago: 9,
      slides: [
        {
          points: [
            "Working memory holds about four chunks",
            "Sleep helps memories settle",
            "Spacing beats cramming",
          ],
          title: "Three ideas to remember",
        },
        {
          points: [
            "Chunking: group items into meaningful units",
            "Consolidation: memories becoming long term",
          ],
          title: "Key terms",
        },
      ],
      title: "Cognitive psychology, revision slides",
    },
    docs: [
      {
        ago: 10,
        body: [
          "## Working memory",
          "It holds a small amount of information for a short time. Newer work puts the limit nearer four chunks than the seven people used to quote.",
          "## Why it matters",
          "- It explains why a long list is hard to hold in the head",
          "- It is why grouping things helps",
        ],
        starred: true,
        title: "Lecture 3, working memory",
      },
      {
        ago: 6,
        body: [
          "## Sleep and memory",
          "Deep sleep seems to help turn new memories into long term ones. Students who slept after learning did better the next day than those who stayed up.",
        ],
        title: "Lecture 5, sleep and memory",
      },
      {
        ago: 2,
        body: [
          "## Reading list",
          "- Baddeley on working memory",
          "- A review of sleep and consolidation",
          "- A paper on the spacing effect",
        ],
        title: "Reading list for the exam",
      },
    ],
    notes: [
      "Course: Introduction to Cognitive Psychology, exam on Friday",
      "Topics: working memory, sleep and memory, spaced repetition",
      "Working memory holds about four chunks, not seven, in newer work",
      "Sleep helps turn new memories into long-term ones, especially deep sleep",
      "Spacing out study beats cramming for most things",
      "Need: key terms, a few practice questions and one worked example",
    ],
    samples: [
      "The main idea is simple. Memory is not a recording, it is something we rebuild each time. That is why the way we study matters as much as how long we study.",
      "I find it easier to learn a topic by asking what question it answers. Working memory answers how much we can hold at once. Sleep answers what happens to it afterwards.",
      "Before the exam, I will go through each topic once out loud. If I get stuck, that is where I study next.",
    ],
    sheet: {
      ago: 4,
      rows: [
        ["Topic", "Confidence", "Last reviewed", "Next"],
        ["Working memory", "High", "Monday", "Friday"],
        ["Sleep and memory", "Medium", "Tuesday", "Wednesday"],
        ["Spacing effect", "Low", "Not yet", "Today"],
      ],
      title: "Revision tracker",
    },
  },
  sales: {
    deck: {
      ago: 6,
      slides: [
        {
          points: [
            "Weekly reports take two days to produce",
            "Decisions are made on old numbers",
          ],
          title: "What we heard from you",
        },
        {
          points: [
            "Reports in two hours, not two days",
            "A similar company did this in a month",
          ],
          title: "What changes",
        },
        {
          points: [
            "Setup in two weeks",
            "$18k to $24k a year, depending on seats",
          ],
          title: "Next steps and price",
        },
      ],
      title: "Northfield, proposal deck",
    },
    docs: [
      {
        ago: 22,
        body: [
          "## Result",
          "Brightline Freight cut its weekly reporting from two days to two hours in the first month. Their ops lead now spends Monday on decisions, not spreadsheets.",
        ],
        starred: true,
        title: "Brightline, case study",
      },
      {
        ago: 5,
        body: [
          "## Account notes",
          "- Maria is head of operations, new second warehouse in March",
          "- Pain: slow reporting",
          "- Budget available this quarter",
          "- Prefers short emails and a call on Tuesdays",
        ],
        title: "Northfield Logistics, account notes",
      },
      {
        ago: 1,
        body: [
          "Hi Maria, thank you for the time today. The short version of what we agreed is below. If I got anything wrong, tell me and I will fix it right away.",
          "- Reporting is the first thing to fix",
          "- We will send a proposal on Tuesday",
        ],
        title: "Call recap, Northfield",
      },
    ],
    notes: [
      "Prospect: Northfield Logistics, a mid-size freight company",
      "Contact is Maria, head of operations, she opened a second warehouse in March",
      "Their pain is slow reporting, it takes them two days to get a weekly report",
      "Our last similar win was Brightline Freight, who cut that to two hours",
      "Price range is $18k to $24k a year, they have budget this quarter",
      "Follow up on Tuesday, keep it short and friendly",
    ],
    samples: [
      "Hi Maria, I saw you opened the second warehouse, congratulations. I will keep this short. A company a lot like yours cut their weekly reporting from two days to two hours, and I thought you might want to see how.",
      "Thanks for the time today. The short version of what we agreed is below. If I got anything wrong, tell me and I will fix it right away. Otherwise I will send the proposal on Tuesday.",
      "No pressure at all on timing. If it helps, I can send a one page summary you can forward to whoever signs off. Just say the word.",
    ],
    sheet: {
      ago: 2,
      rows: [
        ["Account", "Stage", "Value ($)", "Next step"],
        ["Northfield Logistics", "Proposal", 21000, "Send Tuesday"],
        ["Harbor Supply", "Call booked", 18000, "Thursday"],
        ["Pinecrest Foods", "Trial", 24000, "Check in"],
        ["Brightline Freight", "Won", 22000, "Renew in June"],
      ],
      title: "Pipeline",
    },
  },
};
