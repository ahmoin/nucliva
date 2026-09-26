export function PageHeader({
  actions,
  description,
  title,
}: {
  actions?: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading font-semibold text-2xl uppercase tracking-wider">
          {title}
        </h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {actions}
    </div>
  );
}
