/* Rust snippets calling the regexsolver crate, in the idiom of its README:
   the same call as the live demo (generated), and the home page's example
   (hand-written, after the README's own).

   Printed results come from running the snippets against the crate. Do not
   invent new ones. */

/* A Term in an example payload: {type: "regex", value: pattern}. */
export type SnippetTerm = { type: string; value: string };

/* The example payload a snippet is generated from. Same shape Demo builds;
   a missing term/terms yields a snippet without patterns, which is why every
   field stays optional. */
export type SnippetExample = {
  term?: SnippetTerm;
  terms?: SnippetTerm[];
  min?: number;
  max?: number | null;
  limit?: number;
  offset?: number;
  pathOrder?: string;
  characterOrder?: string;
  /** "automaton", "state_elimination" or a model name (lib/models.ts). */
  format?: string;
};

export type SnippetOperation = { operationId: string };

/* The operations that return a term, printed in the example's `format`. */
const COMPUTE = new Set([
  "concat",
  "union",
  "intersection",
  "difference",
  "symmetric_difference",
  "complement",
  "repeat",
]);

/* A Rust string literal for a pattern: raw when it holds a backslash or a
   quote, so the pattern reads as typed. */
const literal = (pattern: string): string => {
  if (!/[\\"]/.test(pattern)) return `"${pattern}"`;
  let hashes = "";
  while (pattern.includes(`"${hashes}`)) hashes += "#";
  return `r${hashes}"${pattern}"${hashes}`;
};

const pascal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* The generation options argument, as short as the example allows. */
const generationOptions = (example: SnippetExample): string => {
  const paths = `PathOrder::${pascal(example.pathOrder ?? "sweep")}`;
  if ((example.characterOrder ?? "ascending") === "ascending") return paths;
  return `GenerationOptions::from((${paths}, CharacterOrder::${pascal(example.characterOrder!)}))`;
};

const repeatRange = (example: SnippetExample): string => {
  const min = example.min ?? 0;
  return example.max === null || example.max === undefined
    ? `${min}..`
    : `${min}..=${example.max}`;
};

/* The pattern declarations, then the operation as an expression of a (and b). */
const parts = (operation: SnippetOperation, example: SnippetExample) => {
  const patterns = example.terms
    ? example.terms.map((t) => t.value)
    : example.term
      ? [example.term.value]
      : [];
  const declarations = patterns.map(
    (p, i) => `let ${i === 0 ? "a" : "b"}: Term = ${literal(p)}.parse()?;`,
  );
  const expression: Record<string, string> = {
    cardinality: "a.cardinality()?",
    length: "a.length()",
    equivalent: "a.equivalent(&b)?",
    subset: "a.subset(&b)?",
    concat: "a.concat([&b])?",
    union: "a.union([&b])?",
    intersection: "a.intersection([&b])?",
    difference: "a.difference(&b)?",
    symmetric_difference: "a.symmetric_difference([&b])?",
    complement: "a.complement()?",
    repeat: `a.repeat(${repeatRange(example)})?`,
    strings: `a.generate_strings(${example.limit ?? 10}, ${example.offset ?? 0}, ${generationOptions(example)})?`,
  };
  return {
    declarations,
    expression: expression[operation.operationId] ?? "",
  };
};

/* A complete program printing the result, for the live demo. */
export function generateFullSnippet(
  operation: SnippetOperation,
  example: SnippetExample,
): string {
  const id = operation.operationId;
  const { declarations, expression } = parts(operation, example);
  const imports = ["use regexsolver::Term;"];
  // The model `format` names, loaded from the Hub.
  const synthesizer = () => {
    imports.push(
      "use regexsolver::neural_synthesis::{Device, NeuralSynthesizer};",
    );
    return [
      "let synthesizer = NeuralSynthesizer::from_hub(",
      `    "alexvbrdn/${example.format}",`,
      "    Device::best_available(),",
      ")?;",
    ];
  };
  let body: string[];
  if (COMPUTE.has(id) && example.format === "automaton") {
    body = [
      `let result = ${expression};`,
      `println!("{}", result.minimize()?.to_automaton()?.to_dot());`,
    ];
  } else if (COMPUTE.has(id) && example.format !== "state_elimination") {
    body = [
      `let result = ${expression};`,
      "",
      ...synthesizer(),
      `println!("{}", result.to_pattern_with(&synthesizer)?);`,
    ];
  } else if (COMPUTE.has(id)) {
    body = [
      `let result = ${expression};`,
      `println!("{}", result.to_pattern()?);`,
    ];
  } else if (id === "strings") {
    const options = generationOptions(example);
    imports.push(
      options.startsWith("GenerationOptions")
        ? "use regexsolver::fast_automaton::{CharacterOrder, GenerationOptions, PathOrder};"
        : "use regexsolver::fast_automaton::PathOrder;",
    );
    body = [`println!("{:?}", ${expression});`];
  } else if (id === "convert" && example.format === "automaton") {
    body = [`println!("{}", a.minimize()?.to_automaton()?.to_dot());`];
  } else if (id === "convert" && example.format !== "state_elimination") {
    body = [
      ...synthesizer(),
      `println!("{}", a.minimize()?.to_pattern_with(&synthesizer)?);`,
    ];
  } else if (id === "convert") {
    body = [`println!("{}", a.minimize()?.to_pattern()?);`];
  } else {
    body = [`println!("{:?}", ${expression});`];
  }
  return `${imports.join("\n")}

fn main() -> Result<(), Box<dyn std::error::Error>> {
${[...declarations, "", ...body]
  .map((line) => (line ? `    ${line}` : ""))
  .join("\n")}
    Ok(())
}`;
}

/* What state elimination writes for the words example (the README's). */
const STATE_ELIMINATION_ING =
  "[a-qs-z]*(i|r((i?|ing?|([a-hj-qs-z]|i[a-mo-qs-z]|in([a-fh-qs-z]|g[a-qs-z]))[a-qs-z]*)r)*(i{2}|ing?i|([a-hj-qs-z]|i[a-mo-qs-z]|in([a-fh-qs-z]|g[a-qs-z]))[a-qs-z]*i))ng";

/* The home page's example: the README's, then both conversions back to a
   pattern. */
export function generateLandingSnippet(): string {
  return `use regexsolver::{Term, fast_automaton::PathOrder};
use regexsolver::neural_synthesis::{Device, NeuralSynthesizer};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let a: Term = "(ab|xy){2}".parse()?;
    let b: Term = ".*xy".parse()?;

    // Which strings match BOTH patterns? Get the answer as a pattern:
    let both = a.intersection([&b])?;
    println!("{}", both.to_pattern()?);
    // (ab|xy)xy

    // Test a concrete string against the result (matching is anchored):
    println!("{}", both.is_match("abxy")?);
    // true

    // ...and sample them:
    println!("{:?}", both.generate_strings(2, 0, PathOrder::Sweep)?);
    // ["xyxy", "abxy"]

    // Words ending in "ing", except those ending in "ring":
    let ing: Term = "[a-z]*ing".parse()?;
    let ring: Term = "[a-z]*ring".parse()?;
    let words = ing.difference(&ring)?;

    // State elimination
    println!("{}", words.to_pattern()?);
    // ${STATE_ELIMINATION_ING}

    // Neural synthesis: a learned model proposes a simpler pattern, checked
    // against the automaton (feature \`neural-synthesis-hub\`).
    let synthesizer = NeuralSynthesizer::from_hub(
        NeuralSynthesizer::DEFAULT_HUB_MODEL,
        Device::best_available(),
    )?;
    println!("{}", words.to_pattern_with(&synthesizer)?);
    // ([a-z]*[a-qs-z])?ing
    Ok(())
}`;
}

/* The tabs CustomCodeTabs takes, for a Rust snippet. */
export const rustTab = (code: string) => [
  { label: "Rust", value: "rust", language: "rust", code },
];
