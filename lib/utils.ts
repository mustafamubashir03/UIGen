import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


type FileRecord = Record<string, string>

type TreeNode = {
  [key: string]: TreeNode | null
}

// Output type:
// - string = file
// - [folder, ...children]
export type TreeItem = string | [string, ...TreeItem[]]

export function convertFilesToTreeItems(
  files: FileRecord
): TreeItem[] {
  const tree: TreeNode = {}

  const sortedPaths = Object.keys(files).sort()

  // Build tree
  for (const filePath of sortedPaths) {
    const parts = filePath.split("/")
    let current: TreeNode = tree

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]

      if (!current[part]) {
        current[part] = {}
      }

      current = current[part] as TreeNode
    }

    const fileName = parts[parts.length - 1]
    current[fileName] = null
  }

  // Recursive converter
  function convertNode(node: TreeNode, name?: string): TreeItem | TreeItem[] {
    const entries = Object.entries(node)

    if (entries.length === 0) {
      return name ?? ""
    }

    const children: TreeItem[] = []

    for (const [key, value] of entries) {
      if (value === null) {
        // file
        children.push(key)
      } else {
        // folder
        const subTree = convertNode(value, key)

        if (Array.isArray(subTree)) {
          children.push([key, ...subTree])
        } else {
          children.push([key, subTree])
        }
      }
    }

    return children
  }

  const result = convertNode(tree)

  return Array.isArray(result) ? result : [result]
}



type SupportedLanguage =
  | "javascript"
  | "jsx"
  | "typescript"
  | "tsx"
  | "python"
  | "html"
  | "css"
  | "json"
  | "markdown"
  | "text";

const languageMap: Record<string, SupportedLanguage> = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  py: "python",
  html: "html",
  css: "css",
  json: "json",
  md: "markdown",
};

export function getLanguageFromExtension(filename: string): SupportedLanguage {
  const extension = filename.split(".").pop()?.toLowerCase();

  if (!extension) return "text";

  return languageMap[extension] ?? "text";
}