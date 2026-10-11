import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { categories, solutionPath, solutions } from "@/lib/solutions";

// Every public page: the site itself, the legal pages, and a page for each
// line of work and each solution.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "",
    "/features",
    "/built-with",
    "/solutions",
    "/terms",
    "/privacy",
    "/cookies",
    "/security",
    "/signup",
    "/login",
  ];

  return [
    ...pages.map((path) => ({
      priority: path === "" ? 1 : 0.7,
      url: `${siteUrl}${path}`,
    })),
    ...categories.map((category) => ({
      priority: 0.6,
      url: `${siteUrl}/solutions/${category.slug}`,
    })),
    ...solutions.map((solution) => ({
      priority: 0.5,
      url: `${siteUrl}${solutionPath(solution)}`,
    })),
  ];
}
