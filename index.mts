import { parse } from "yaml";
import { readFileSync, writeFileSync } from "fs";

const PROJECT_BLOCK_REGEXP =
  /{begin-project}(?<content>\n+(?<head>---\n+(?<frontmatter>[\s\S]+?)\n+---\n+)?(?<body>[\s\S]*?)?\n+){end-project}/g;

const PROJECT_CONTENT_REGEXP =
  /(?<content>\n+(?<head>---\n+(?<frontmatter>[\s\S]+?)\n+---\n+)?(?<body>[\s\S]*?)?\n+)/;

type Attachment<T extends "image" | "video" | "file"> = {
  videoSource: T extends "video" ? "youtube" | "vimeo" : undefined;
  title: string;
  type: T;
  url: string;
  alt: T extends "image" ? string : undefined;
  description?: string;
};

type VideoAttachment = Attachment<"video">;
type ImageAttachment = Attachment<"image">;

type ProjectT = {
  id: string;
  title: string;
  subtitle?: string;
  type: "commercial" | "free" | "open-source";
  url: string;
  repo_url?: string;
  start_date: string;
  end_date?: string;
  description: string;
  technologies: string[];
  topics: string[];
  tags: string[];
  cover?: ImageAttachment;
  attachments: Attachment<"image" | "video" | "file">[];
};

function parseProjectBlock(mdText: string): ProjectT {
  const projectBlockRegExp = mdText.match(PROJECT_CONTENT_REGEXP);
  if (!(projectBlockRegExp && projectBlockRegExp.groups))
    throw new Error(`Failed to parse project block markdown: ${mdText}`);

  const frontmatter = projectBlockRegExp.groups["frontmatter"];
  const projectBody = projectBlockRegExp.groups["body"];
  const frontmatterObject = parse(frontmatter);

  return {
    id: frontmatterObject.title.replaceAll(/[^\w-]/g, "-"),
    title: frontmatterObject.title,
    subtitle: frontmatterObject.subtitle,
    type: frontmatterObject.type,
    url: frontmatterObject.url,
    repo_url: frontmatterObject.repo_url,
    start_date: frontmatterObject.start_date,
    end_date: frontmatterObject.end_date,
    description: projectBody,
    technologies: frontmatterObject.technologies,
    topics: frontmatterObject.topics,
    tags: frontmatterObject.tags,
    cover: frontmatterObject.cover,
    attachments: frontmatterObject.attachments,
  };
}

function main() {
  const projectMd = readFileSync("docs/projects.md")
    .toString()
    .replaceAll("\r\n", "\n");

  const projectMatches = [...projectMd.matchAll(PROJECT_BLOCK_REGEXP)];

  if (!projectMatches.length)
    throw new Error(`Failed to parse project block markdown: ${projectMd}`);

  const projects = projectMatches.map((match) =>
    // @ts-ignore
    parseProjectBlock(match.groups.content)
  );

  writeFileSync("docs/projects.json", JSON.stringify(projects, undefined, 2));
}

main();
