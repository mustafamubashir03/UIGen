import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ComputerIcon,
  EditIcon,
  MoonIcon,
  SunIcon,
  SunMoonIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetProjectById } from "../hooks/project";
import { Spinner } from "@/components/ui/spinner";
import UIGenLogo from "@/modules/home/components/UIGenLogo";

const ProjectHeader = ({ projectId }:{projectId:string}) => {
  const { data: project, isPending } = useGetProjectById(projectId);
  const { setTheme, theme } = useTheme();

  return (
<header className="px-3 py-2 flex justify-between items-center border-b bg-background/80 backdrop-blur-xl">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 px-2 hover:bg-accent/50 transition-colors rounded-lg"
      >
        <UIGenLogo />

        <span className="text-sm font-medium truncate max-w-[160px]">
          {isPending ? <Spinner /> : project?.name || "Untitled Project"}
        </span>

        <ChevronDownIcon className="size-4 opacity-60" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent
      side="bottom"
      align="start"
      className="w-56 backdrop-blur-xl bg-background/90 border border-border/50"
    >
      {/* Dashboard */}
      <DropdownMenuItem asChild>
        <Link href={"/"} className="flex items-center gap-2 cursor-pointer">
          <ChevronLeftIcon className="size-4 text-muted-foreground" />
          <span>Go to Dashboard</span>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      {/* Appearance */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="gap-2">
          <SunMoonIcon className="size-4 text-indigo-500 dark:text-indigo-400" />
          <span>Appearance</span>
        </DropdownMenuSubTrigger>

        <DropdownMenuPortal>
          <DropdownMenuSubContent
            sideOffset={6}
            className="backdrop-blur-xl bg-background/90 border border-border/50"
          >
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>

              {/* LIGHT */}
              <DropdownMenuRadioItem
                value="light"
                className="flex items-center gap-2 px-8"
              >
                <SunIcon
                  className={`size-4 transition ${
                    theme === "light"
                      ? "text-yellow-500"
                      : "text-yellow-400/80"
                  }`}
                />
                Light
              </DropdownMenuRadioItem>

              {/* DARK */}
              <DropdownMenuRadioItem
                value="dark"
                className="flex items-center gap-2 px-8"
              >
                <MoonIcon
                  className={`size-4 transition ${
                    theme === "dark"
                      ? "text-blue-400"
                      : "text-blue-300/80"
                  }`}
                />
                Dark
              </DropdownMenuRadioItem>

              {/* SYSTEM */}
              <DropdownMenuRadioItem
                value="system"
                className="flex items-center gap-2 px-8"
              >
                <ComputerIcon
                  className={`size-4 transition ${
                    theme === "system"
                      ? "text-emerald-500"
                      : "text-emerald-400/80"
                  }`}
                />
                System
              </DropdownMenuRadioItem>

            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </DropdownMenuContent>
  </DropdownMenu>
</header>
  );
};

export default ProjectHeader;