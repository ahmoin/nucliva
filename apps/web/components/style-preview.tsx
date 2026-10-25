import { SparkleIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  type StyleSampleRow,
  StyleSampleTable,
} from "@/components/style-sample-table";

const DAY = 24 * 60 * 60 * 1000;
const day = (ago: number) => new Date(Date.UTC(2026, 9, 14) - ago * DAY);

const samples: StyleSampleRow[] = [
  {
    content:
      "Quick update before Friday\nShipped the new onboarding. Three steps instead of ten, and early numbers look good. More next week.",
    createdAt: day(1),
    id: "email",
    source: "email",
  },
  {
    content:
      "What we got wrong about pricing\nWe priced for the buyer we wanted, not the one we had. Here is what changed when we stopped.",
    createdAt: day(4),
    id: "post",
    source: "document",
  },
  {
    content:
      "Board notes, September\nRevenue up, churn flat, hiring slower than planned. Two asks for the board at the end.",
    createdAt: day(9),
    id: "notes",
    source: "note",
  },
  {
    content:
      "Thanks for the intro\nReally appreciate it. I will keep it short: we help small teams write faster without sounding like a robot.",
    createdAt: day(15),
    id: "intro",
    source: "email",
  },
];

export function StylePreview() {
  return (
    <Card className="text-left">
      <CardHeader>
        <CardTitle>Writing samples</CardTitle>
        <CardDescription>
          Your voice, learned from {samples.length} things you wrote.
        </CardDescription>
        <CardAction>
          <Badge variant="outline">
            <SparkleIcon />
            Voice match 96%
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <StyleSampleTable samples={samples} />
      </CardContent>
    </Card>
  );
}
