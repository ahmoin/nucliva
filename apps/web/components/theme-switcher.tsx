"use client";

import { DesktopIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { isTyping, KeyHint } from "@/components/hotkeys";

const OPTIONS = [
  { Icon: DesktopIcon, label: "System theme", value: "system" },
  { Icon: SunIcon, label: "Light theme", value: "light" },
  { Icon: MoonIcon, label: "Dark theme", value: "dark" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleValueChange = useCallback(
    (value: string[]) => {
      if (value[0]) {
        setTheme(value[0]);
      }
    },
    [setTheme]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "t" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.repeat ||
        isTyping(event.target)
      ) {
        return;
      }

      const values = OPTIONS.map((option) => option.value);
      const next =
        values[(values.indexOf(theme ?? "system") + 1) % values.length];

      if (next) {
        setTheme(next);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [theme, setTheme]);

  return (
    <div className="flex items-center gap-2">
      <ToggleGroup
        aria-label="Theme"
        onValueChange={handleValueChange}
        spacing={1}
        value={mounted && theme ? [theme] : []}
        variant="default"
      >
        {OPTIONS.map(({ value, label, Icon }) => (
          <ToggleGroupItem
            aria-label={label}
            key={value}
            size="sm"
            title={label}
            value={value}
          >
            <Icon />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <KeyHint>T</KeyHint>
    </div>
  );
}
