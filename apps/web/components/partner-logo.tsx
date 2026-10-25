import { cn } from "@workspace/ui/lib/utils";
import Image from "next/image";

export interface Partner {
  darkLogo: string;
  height: number;
  lightLogo: string;
  name: string;
  width: number;
}

export function PartnerLogo({
  className,
  partner,
}: {
  className?: string;
  partner: Partner;
}) {
  const size = { height: partner.height, width: partner.width };

  if (partner.lightLogo === partner.darkLogo) {
    return (
      <Image
        alt={partner.name}
        className={cn("h-8 w-auto", className)}
        src={partner.lightLogo}
        {...size}
      />
    );
  }

  return (
    <>
      <Image
        alt={partner.name}
        className={cn("h-8 w-auto dark:hidden", className)}
        src={partner.lightLogo}
        {...size}
      />
      <Image
        alt={partner.name}
        className={cn("hidden h-8 w-auto dark:block", className)}
        src={partner.darkLogo}
        {...size}
      />
    </>
  );
}
