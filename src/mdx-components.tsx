import type { MDXComponents } from "mdx/types";
import Cite from "@/components/inequality/Cite";
import GlossaryTerm from "@/components/inequality/GlossaryTerm";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { Cite, GlossaryTerm, ...components };
}
