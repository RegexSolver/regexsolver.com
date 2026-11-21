/* A Term in an example payload: {type: "regex"|"fair", value: pattern|blob}. */
export type SnippetTerm = { type: string; value: string };

/* The example payload a snippet is generated from. Same shape LiveDemo builds
   and sections.tsx declares; a missing term/terms still silently yields a
   malformed snippet (empty args), which is why every field stays optional. */
export type SnippetExample = {
  term?: SnippetTerm;
  terms?: SnippetTerm[];
  min?: number;
  max?: number | null;
  limit?: number;
  offset?: number;
  pathOrder?: string;
  characterOrder?: string;
  seed?: number;
  minLength?: number;
  maxLength?: number;
  charset?: string;
};

export type SnippetOperation = { operationId: string };

export function generateShortSnippet(
  selectedLang: string,
  operation: SnippetOperation,
  example: SnippetExample,
): string {
  switch (selectedLang) {
    case "java":
      return generateCodeSnippetJava(operation, example, false).trimEnd();
    case "js":
      return generateCodeSnippetJavascript(operation, example, false).trimEnd();
    case "python":
      return generateCodeSnippetPython(operation, example, false).trimEnd();
  }
  return "";
}

export function generateFullSnippet(
  selectedLang: string,
  operation: SnippetOperation,
  example: SnippetExample,
): string {
  switch (selectedLang) {
    case "java":
      return generateCodeSnippetJava(operation, example, true).trimEnd();
    case "js":
      return generateCodeSnippetJavascript(operation, example, true).trimEnd();
    case "python":
      return generateCodeSnippetPython(operation, example, true).trimEnd();
  }
  return "";
}


/* One multi-operation snippet per feature-section page — the "full overview"
   counterpart of generateLandingSnippet. Printed results are either taken
   from vetted sources (lib/sections.tsx, the docs examples) or provable by hand
   (16^5, set identities); do not invent new ones. */
export type SectionSlug =
  | "regex-analysis"
  | "pattern-manipulation"
  | "strings-generation";

export function generateSectionSnippet(
  slug: SectionSlug,
  selectedLang: string,
): string {
  const snippets: Record<string, Record<string, string>> = {
    "regex-analysis": {
      js: `import { RegexSolverClient, Term } from 'regexsolver';

const client = new RegexSolverClient({ apiToken: process.env.REGEXSOLVER_API_TOKEN });

// Same language, different syntax?
await client.equivalent(Term.regex("(abcd|abef)"), Term.regex("ab(cd|ef)"));
// true

// Is every match of A also a match of B?
await client.subset(Term.regex("beta-[0-9]{4}"), Term.regex("(alpha|beta)-[0-9]{4}"));
// true

// Number of strings the pattern matches
await client.getCardinality(Term.regex("[a-f0-9]{5}"));
// 1048576

// Shortest and longest possible match
await client.getLength(Term.regex("(alpha|beta|prod)-[a-z0-9]{4}"));
// [9, 10]

// Every match of A is a match of B when A minus B is empty
const gap = await client.difference(Term.regex("(abcd|abef)"), Term.regex("ab(cd|ef)"));
await client.isEmpty(gap);
// true`,
      java: `import com.regexsolver.api.RegexSolverClient;
import com.regexsolver.api.Term;

public class Main {
    public static void main(String[] args) {
        RegexSolverClient client = RegexSolverClient.builder()
            .apiToken(System.getenv("REGEXSOLVER_API_TOKEN"))
            .build();

        // Same language, different syntax?
        client.equivalent(Term.regex("(abcd|abef)"), Term.regex("ab(cd|ef)"));
        // true

        // Is every match of A also a match of B?
        client.subset(Term.regex("beta-[0-9]{4}"), Term.regex("(alpha|beta)-[0-9]{4}"));
        // true

        // Number of strings the pattern matches
        client.getCardinality(Term.regex("[a-f0-9]{5}"));
        // 1048576

        // Shortest and longest possible match
        client.getLength(Term.regex("(alpha|beta|prod)-[a-z0-9]{4}"));
        // [9, 10]

        // Every match of A is a match of B when A minus B is empty
        Term gap = client.difference(Term.regex("(abcd|abef)"), Term.regex("ab(cd|ef)"));
        client.isEmpty(gap);
        // true
    }
}`,
      python: `import os
from regexsolver import RegexSolverClient, Term

client = RegexSolverClient(api_token=os.getenv("REGEXSOLVER_API_TOKEN"))

# Same language, different syntax?
client.equivalent(Term.regex(r"(abcd|abef)"), Term.regex(r"ab(cd|ef)"))
# True

# Is every match of A also a match of B?
client.subset(Term.regex(r"beta-[0-9]{4}"), Term.regex(r"(alpha|beta)-[0-9]{4}"))
# True

# Number of strings the pattern matches
client.get_cardinality(Term.regex(r"[a-f0-9]{5}"))
# 1048576

# Shortest and longest possible match
client.get_length(Term.regex(r"(alpha|beta|prod)-[a-z0-9]{4}"))
# (9, 10)

# Every match of A is a match of B when A minus B is empty
gap = client.difference(Term.regex(r"(abcd|abef)"), Term.regex(r"ab(cd|ef)"))
client.is_empty(gap)
# True`,
    },
    "pattern-manipulation": {
      js: `import { RegexSolverClient, Term } from 'regexsolver';

const client = new RegexSolverClient({ apiToken: process.env.REGEXSOLVER_API_TOKEN });

// Strings both patterns match, as one pattern
const both = await client.intersection(
  Term.regex("/api/v[12]/.*"),
  Term.regex(".*/users/[0-9]+"),
);
await client.getPattern(both);
// "/api/v[12]/(.*/)?users/[0-9]+"

// Strings A matches and B does not
const noGif = await client.difference(
  Term.regex(".*\\\\.(jpe?g|png|gif)"),
  Term.regex(".*\\\\.gif"),
);
await client.getPattern(noGif);
// ".*\\\\.(jpe?|pn)g"

// Strings the pattern does not match
const rejected = await client.complement(noGif);

// Results are terms and can be passed to the next call.
// A term and its complement have no string in common:
await client.isEmpty(await client.intersection(noGif, rejected));
// true`,
      java: `import com.regexsolver.api.RegexSolverClient;
import com.regexsolver.api.Term;

public class Main {
    public static void main(String[] args) {
        RegexSolverClient client = RegexSolverClient.builder()
            .apiToken(System.getenv("REGEXSOLVER_API_TOKEN"))
            .build();

        // Strings both patterns match, as one pattern
        Term both = client.intersection(
            Term.regex("/api/v[12]/.*"),
            Term.regex(".*/users/[0-9]+"));
        client.getPattern(both);
        // "/api/v[12]/(.*/)?users/[0-9]+"

        // Strings A matches and B does not
        Term noGif = client.difference(
            Term.regex(".*\\\\.(jpe?g|png|gif)"),
            Term.regex(".*\\\\.gif"));
        client.getPattern(noGif);
        // ".*\\.(jpe?|pn)g"

        // Strings the pattern does not match
        Term rejected = client.complement(noGif);

        // Results are terms and can be passed to the next call.
        // A term and its complement have no string in common:
        client.isEmpty(client.intersection(noGif, rejected));
        // true
    }
}`,
      python: `import os
from regexsolver import RegexSolverClient, Term

client = RegexSolverClient(api_token=os.getenv("REGEXSOLVER_API_TOKEN"))

# Strings both patterns match, as one pattern
both = client.intersection(Term.regex(r"/api/v[12]/.*"), Term.regex(r".*/users/[0-9]+"))
client.get_pattern(both)
# "/api/v[12]/(.*/)?users/[0-9]+"

# Strings A matches and B does not
no_gif = client.difference(Term.regex(r".*\\.(jpe?g|png|gif)"), Term.regex(r".*\\.gif"))
client.get_pattern(no_gif)
# ".*\\.(jpe?|pn)g"

# Strings the pattern does not match
rejected = client.complement(no_gif)

# Results are terms and can be passed to the next call.
# A term and its complement have no string in common:
client.is_empty(client.intersection(no_gif, rejected))
# True`,
    },
    "strings-generation": {
      js: `import { RegexSolverClient, Term } from 'regexsolver';

const client = new RegexSolverClient({ apiToken: process.env.REGEXSOLVER_API_TOKEN });
const term = Term.regex("(alpha|beta|prod)-[a-z0-9]{4}");

// Distinct strings the pattern matches
await client.generateStrings(term, 5, 0);
// ["beta-0000", "beta-0001", "beta-0002", "beta-0003", "beta-0004"]

// Page through the language with offset. Pages only line up on a
// deterministic term, so determinize once first.
const bits = await client.determinize(Term.regex("[01]{3}"));
const all = [];
for (let offset = 0; ; offset += 3) {
  const page = await client.generateStrings(bits, 3, offset);
  all.push(...page);
  if (page.length < 3) break;
}
// ["000", "001", "010"], then ["011", "100", "101"], then ["110", "111"]

// Only strings within a length window
await client.generateStrings(Term.regex("(ab|cde)*"), 5, 0, { minLength: 4, maxLength: 6 });
// ["abab", "cdeab", "abcde", "ababab", "cdecde"]

// Restrict generation to a character class
await client.generateStrings(Term.regex("[a-z]{3}"), 5, 0, { charset: "[a-c]" });

// Shuffled order, reproducible with a seed
await client.generateStrings(term, 5, 0, {
  pathOrder: "shuffled", characterOrder: "shuffled", seed: 42,
});`,
      java: `import com.regexsolver.api.RegexSolverClient;
import com.regexsolver.api.Term;
import com.regexsolver.api.GenerateStringsOptions;
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        RegexSolverClient client = RegexSolverClient.builder()
            .apiToken(System.getenv("REGEXSOLVER_API_TOKEN"))
            .build();
        Term term = Term.regex("(alpha|beta|prod)-[a-z0-9]{4}");

        // Distinct strings the pattern matches
        List<String> strings = client.generateStrings(term, 5, 0);
        // ["beta-0000", "beta-0001", "beta-0002", "beta-0003", "beta-0004"]

        // Page through the language with offset. Pages only line up on a
        // deterministic term, so determinize once first.
        Term bits = client.determinize(Term.regex("[01]{3}"));
        List<String> all = new ArrayList<>();
        for (int offset = 0; ; offset += 3) {
            List<String> page = client.generateStrings(bits, 3, offset);
            all.addAll(page);
            if (page.size() < 3) break;
        }
        // ["000", "001", "010"], then ["011", "100", "101"], then ["110", "111"]

        // Only strings within a length window
        GenerateStringsOptions window = GenerateStringsOptions.builder()
            .minLength(4)
            .maxLength(6);
        client.generateStrings(Term.regex("(ab|cde)*"), 5, 0, window);
        // ["abab", "cdeab", "abcde", "ababab", "cdecde"]

        // Restrict generation to a character class
        GenerateStringsOptions ascii = GenerateStringsOptions.builder()
            .charset("[a-c]");
        client.generateStrings(Term.regex("[a-z]{3}"), 5, 0, ascii);

        // Shuffled order, reproducible with a seed
        GenerateStringsOptions shuffled = GenerateStringsOptions.builder()
            .pathOrder(PathOrder.SHUFFLED)
            .characterOrder(CharacterOrder.SHUFFLED)
            .seed(42L);
        client.generateStrings(term, 5, 0, shuffled);
    }
}`,
      python: `import os
from regexsolver import RegexSolverClient, Term

client = RegexSolverClient(api_token=os.getenv("REGEXSOLVER_API_TOKEN"))
term = Term.regex(r"(alpha|beta|prod)-[a-z0-9]{4}")

# Distinct strings the pattern matches
client.generate_strings(term, 5, 0)
# ['beta-0000', 'beta-0001', 'beta-0002', 'beta-0003', 'beta-0004']

# Page through the language with offset. Pages only line up on a
# deterministic term, so determinize once first.
bits = client.determinize(Term.regex(r"[01]{3}"))
all_strings = []
offset = 0
while True:
    page = client.generate_strings(bits, 3, offset)
    all_strings.extend(page)
    if len(page) < 3:
        break
    offset += 3
# ['000', '001', '010'], then ['011', '100', '101'], then ['110', '111']

# Only strings within a length window
client.generate_strings(Term.regex(r"(ab|cde)*"), 5, 0, min_length=4, max_length=6)
# ['abab', 'cdeab', 'abcde', 'ababab', 'cdecde']

# Restrict generation to a character class
client.generate_strings(Term.regex(r"[a-z]{3}"), 5, 0, charset="[a-c]")

# Shuffled order, reproducible with a seed
client.generate_strings(term, 5, 0, path_order="shuffled", character_order="shuffled", seed=42)`,
    },
  };
  return snippets[slug]?.[selectedLang] ?? "";
}

/* The landing page's one code block: install-to-first-result. The hero shows
   every operation as a one-line call, so this one shows what those leave out —
   the client, and a result used as the input of the next call. The printed
   pattern is the vetted intersection example from lib/sections.tsx; the
   difference is non-empty because "/api/v1/x" is in A and not in B. */
export function generateLandingSnippet(selectedLang: string): string {
  switch (selectedLang) {
    case "java":
      return `import com.regexsolver.api.RegexSolverClient;
import com.regexsolver.api.Term;

public class Main {
    public static void main(String[] args) {
        RegexSolverClient client = RegexSolverClient.builder()
            .apiToken(System.getenv("REGEXSOLVER_API_TOKEN"))
            .build();

        Term a = Term.regex("/api/v[12]/.*");
        Term b = Term.regex(".*/users/[0-9]+");

        // Strings both patterns match. The result is a term.
        Term both = client.intersection(a, b);

        // Read it back as a regex when you need one
        client.getPattern(both);
        // /api/v[12]/(.*/)?users/[0-9]+

        // Or pass it on: does A match anything B does not?
        Term onlyA = client.difference(a, b);
        client.isEmpty(onlyA);
        // false
    }
}`;
    case "js":
      return `import { RegexSolverClient, Term } from 'regexsolver';

const client = new RegexSolverClient({ apiToken: process.env.REGEXSOLVER_API_TOKEN });

const a = Term.regex("/api/v[12]/.*");
const b = Term.regex(".*/users/[0-9]+");

// Strings both patterns match. The result is a term.
const both = await client.intersection(a, b);

// Read it back as a regex when you need one
await client.getPattern(both);
// "/api/v[12]/(.*/)?users/[0-9]+"

// Or pass it on: does A match anything B does not?
const onlyA = await client.difference(a, b);
await client.isEmpty(onlyA);
// false`;
    case "python":
      return `import os
from regexsolver import RegexSolverClient, Term

client = RegexSolverClient(api_token=os.getenv("REGEXSOLVER_API_TOKEN"))

a = Term.regex(r"/api/v[12]/.*")
b = Term.regex(r".*/users/[0-9]+")

# Strings both patterns match. The result is a term.
both = client.intersection(a, b)

# Read it back as a regex when you need one
client.get_pattern(both)
# "/api/v[12]/(.*/)?users/[0-9]+"

# Or pass it on: does A match anything B does not?
only_a = client.difference(a, b)
client.is_empty(only_a)
# False`;
  }
  return "";
}

/**
 * @deprecated Use generateShortSnippet or generateFullSnippet
 */
export function generateCodeSnippet(
  selectedLang: string,
  operation: SnippetOperation,
  example: SnippetExample,
): string {
  return generateShortSnippet(selectedLang, operation, example);
}

// --- Common Helpers ---

function escapeValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// generateStrings options: emitted only when present in the example, so
// snippets never render `undefined` for absent fields.
const STRINGS_OPTION_KEYS = [
  "pathOrder",
  "characterOrder",
  "seed",
  "minLength",
  "maxLength",
  "charset",
] as const;
const STRING_TYPED_OPTIONS: readonly string[] = [
  "pathOrder",
  "characterOrder",
  "charset",
];
const PYTHON_OPTION_KEYS: Record<string, string> = {
  pathOrder: "path_order",
  characterOrder: "character_order",
  seed: "seed",
  minLength: "min_length",
  maxLength: "max_length",
  charset: "charset",
};

function stringsOptions(example: SnippetExample): Array<[string, unknown]> {
  return STRINGS_OPTION_KEYS.filter(
    (k) => example?.[k] !== undefined && example?.[k] !== null,
  ).map((k) => [k, example[k]]);
}

function javaStringsOption(key: string, value: unknown): string {
  switch (key) {
    case "pathOrder":
      return `.pathOrder(PathOrder.${String(value).toUpperCase()})`;
    case "characterOrder":
      return `.characterOrder(CharacterOrder.${String(value).toUpperCase()})`;
    case "seed":
      return `.seed(${value}L)`;
    case "charset":
      return `.charset("${escapeValue(String(value))}")`;
    default:
      return `.${key}(${value})`;
  }
}

// --- Java ---

function generateTermJava(name: string, type: string, value: string): string {
  return `Term ${name} = Term.${type}("${escapeValue(value)}");\n`;
}

function generateTermsVarsAndArgsJava(example: SnippetExample) {
  let vars = "";
  let args = "";
  if (example?.terms) {
    const names: string[] = [];
    example.terms.forEach((t, i) => {
      const name = `term${i + 1}`;
      vars += generateTermJava(name, t.type, t.value);
      names.push(name);
    });
    args = names.join(", ");
  } else if (example?.term) {
    vars += generateTermJava("term", example.term.type, example.term.value);
    args = "term";
  }
  return { vars, args };
}

function wrapJavaCall(call: string, full: boolean): string {
  return full ? `System.out.println(${call});` : `${call};`;
}

function generateCodeSnippetJava(operation: SnippetOperation, example: SnippetExample, full: boolean): string {
  let snippet = "";
  const indent = full ? "        " : "";
  const stringsOpts =
    operation.operationId === "strings" ? stringsOptions(example) : [];

  if (full) {
    snippet += "import com.regexsolver.api.RegexSolverClient;\n";
    snippet += "import com.regexsolver.api.Term;\n";
    if (stringsOpts.length > 0) {
      snippet += "import com.regexsolver.api.GenerateStringsOptions;\n";
      if (stringsOpts.some(([k]) => k === "pathOrder"))
        snippet += "import com.regexsolver.api.PathOrder;\n";
      if (stringsOpts.some(([k]) => k === "characterOrder"))
        snippet += "import com.regexsolver.api.CharacterOrder;\n";
    }
    snippet += "\n";
    snippet += "public class Main {\n";
    snippet += "    public static void main(String[] args) {\n";
    snippet += "        RegexSolverClient client = RegexSolverClient.builder()\n";
    snippet += '            .apiToken(System.getenv("REGEXSOLVER_API_TOKEN"))\n';
    snippet += "            .build();\n\n";
  }

  const { vars, args } = generateTermsVarsAndArgsJava(example);
  if (full) {
    snippet += vars.split("\n").map(line => line.length > 0 ? indent + line : "").join("\n");
  } else {
    snippet += vars;
  }
  if (vars.length > 0) snippet += "\n";

  let pre = "";
  let call = "";
  switch (operation.operationId) {
    case "cardinality":
      call = wrapJavaCall(`client.getCardinality(${args})`, full);
      break;
    case "dot":
      call = wrapJavaCall(`client.getDot(${args})`, full);
      break;
    case "empty":
      call = wrapJavaCall(`client.isEmpty(${args})`, full);
      break;
    case "empty_string":
      call = wrapJavaCall(`client.isEmptyString(${args})`, full);
      break;
    case "total":
      call = wrapJavaCall(`client.isTotal(${args})`, full);
      break;
    case "deterministic":
      call = wrapJavaCall(`client.isDeterministic(${args})`, full);
      break;
    case "equivalent":
      call = wrapJavaCall(`client.equivalent(${args})`, full);
      break;
    case "length":
      call = wrapJavaCall(`client.getLength(${args})`, full);
      break;
    case "pattern":
      call = wrapJavaCall(`client.getPattern(${args})`, full);
      break;
    case "subset":
      call = wrapJavaCall(`client.subset(${args})`, full);
      break;
    case "concat":
      call = wrapJavaCall(`client.concat(${args})`, full);
      break;
    case "difference":
      call = wrapJavaCall(`client.difference(${args})`, full);
      break;
    case "intersection":
      call = wrapJavaCall(`client.intersection(${args})`, full);
      break;
    case "repeat": {
      const maxArg =
        example.max !== undefined && example.max !== null
          ? `, ${example.max}`
          : `, null`;
      call = wrapJavaCall(`client.repeat(${args}, ${example.min}${maxArg})`, full);
      break;
    }
    case "union":
      call = wrapJavaCall(`client.union(${args})`, full);
      break;
    case "complement":
      call = wrapJavaCall(`client.complement(${args})`, full);
      break;
    case "determinize":
      call = wrapJavaCall(`client.determinize(${args})`, full);
      break;
    case "strings": {
      let callArgs = `${args}, ${example?.limit ?? 10}, ${example?.offset ?? 0}`;
      if (stringsOpts.length > 0) {
        pre =
          "GenerateStringsOptions options = GenerateStringsOptions.builder()\n" +
          stringsOpts
            .map(([k, v]) => `        ${javaStringsOption(k, v)}`)
            .join("\n") +
          ";";
        callArgs += ", options";
      }
      call = wrapJavaCall(`client.generateStrings(${callArgs})`, full);
      break;
    }
    case "limits":
      call = wrapJavaCall(`client.getAccountLimits()`, full);
      break;
  }

  if (pre.length > 0) {
    snippet +=
      pre
        .split("\n")
        .map((line) => indent + line)
        .join("\n") + "\n\n";
  }
  snippet += indent + call + "\n";

  if (full) {
    snippet += "    }\n";
    snippet += "}\n";
  }

  return snippet;
}

// --- JavaScript ---

function generateTermJavascript(
  name: string,
  type: string,
  value: string,
): string {
  return `const ${name} = Term.${type}("${escapeValue(value)}");\n`;
}

function generateTermsVarsAndArgsJavascript(example: SnippetExample) {
  let vars = "";
  let args = "";
  if (example?.terms) {
    const names: string[] = [];
    example.terms.forEach((t, i) => {
      const name = `term${i + 1}`;
      vars += generateTermJavascript(name, t.type, t.value);
      names.push(name);
    });
    args = names.join(", ");
  } else if (example?.term) {
    vars += generateTermJavascript(
      "term",
      example.term.type,
      example.term.value,
    );
    args = "term";
  }
  return { vars, args };
}

function wrapJavascriptCall(call: string, full: boolean): string {
  return full ? `console.log(${call});` : `${call};`;
}

function generateCodeSnippetJavascript(operation: SnippetOperation, example: SnippetExample, full: boolean): string {
  let snippet = "";

  if (full) {
    snippet += "import { RegexSolverClient, Term } from 'regexsolver';\n\n";
    snippet += "const client = new RegexSolverClient({\n";
    snippet += "  apiToken: process.env.REGEXSOLVER_API_TOKEN,\n";
    snippet += "});\n\n";
  }

  const { vars, args } = generateTermsVarsAndArgsJavascript(example);
  snippet += vars;
  if (vars.length > 0) snippet += "\n";

  let call = "";
  switch (operation.operationId) {
    case "cardinality":
      call = wrapJavascriptCall(`await client.getCardinality(${args})`, full);
      break;
    case "dot":
      call = wrapJavascriptCall(`await client.getDot(${args})`, full);
      break;
    case "empty":
      call = wrapJavascriptCall(`await client.isEmpty(${args})`, full);
      break;
    case "empty_string":
      call = wrapJavascriptCall(`await client.isEmptyString(${args})`, full);
      break;
    case "total":
      call = wrapJavascriptCall(`await client.isTotal(${args})`, full);
      break;
    case "deterministic":
      call = wrapJavascriptCall(`await client.isDeterministic(${args})`, full);
      break;
    case "equivalent":
      call = wrapJavascriptCall(`await client.equivalent(${args})`, full);
      break;
    case "length":
      call = wrapJavascriptCall(`await client.getLength(${args})`, full);
      break;
    case "pattern":
      call = wrapJavascriptCall(`await client.getPattern(${args})`, full);
      break;
    case "subset":
      call = wrapJavascriptCall(`await client.subset(${args})`, full);
      break;
    case "concat":
      call = wrapJavascriptCall(`await client.concat(${args})`, full);
      break;
    case "difference":
      call = wrapJavascriptCall(`await client.difference(${args})`, full);
      break;
    case "intersection":
      call = wrapJavascriptCall(`await client.intersection(${args})`, full);
      break;
    case "repeat": {
      const maxArgJs =
        example.max !== undefined && example.max !== null
          ? `, ${example.max}`
          : `, null`;
      call = wrapJavascriptCall(`await client.repeat(${args}, ${example.min}${maxArgJs})`, full);
      break;
    }
    case "union":
      call = wrapJavascriptCall(`await client.union(${args})`, full);
      break;
    case "complement":
      call = wrapJavascriptCall(`await client.complement(${args})`, full);
      break;
    case "determinize":
      call = wrapJavascriptCall(`await client.determinize(${args})`, full);
      break;
    case "strings": {
      let callArgs = `${args}, ${example?.limit ?? 10}, ${example?.offset ?? 0}`;
      const opts = stringsOptions(example);
      if (opts.length > 0) {
        const rendered = opts
          .map(([k, v]) =>
            STRING_TYPED_OPTIONS.includes(k)
              ? `${k}: "${escapeValue(String(v))}"`
              : `${k}: ${v}`,
          )
          .join(", ");
        callArgs += `, { ${rendered} }`;
      }
      call = wrapJavascriptCall(`await client.generateStrings(${callArgs})`, full);
      break;
    }
    case "limits":
      call = wrapJavascriptCall(`await client.getAccountLimits()`, full);
      break;
  }

  snippet += call + "\n";

  return snippet;
}

// --- Python ---

function generateTermPython(name: string, type: string, value: string): string {
  if (type === "regex") {
    // A raw string cannot end with an odd number of backslashes
    const isSafeForRaw = !value.endsWith("\\");

    if (isSafeForRaw) {
      if (!value.includes('"')) {
        return `${name} = Term.regex(r"${value}")\n`;
      }
      if (!value.includes("'")) {
        return `${name} = Term.regex(r'${value}')\n`;
      }
      if (!value.includes('"""')) {
        return `${name} = Term.regex(r"""${value}""")\n`;
      }
    }
  }

  // Fallback to standard escaping if raw strings are unsafe or contain all delimiters
  return `${name} = Term.${type}("${escapeValue(value)}")\n`;
}

function generateTermsVarsAndArgsPython(example: SnippetExample) {
  let vars = "";
  let args = "";
  if (example?.terms) {
    const names: string[] = [];
    example.terms.forEach((t, i) => {
      const name = `term${i + 1}`;
      vars += generateTermPython(name, t.type, t.value);
      names.push(name);
    });
    args = names.join(", ");
  } else if (example?.term) {
    vars += generateTermPython("term", example.term.type, example.term.value);
    args = "term";
  }
  return { vars, args };
}

function wrapPythonCall(call: string, full: boolean): string {
  return full ? `print(${call})` : call;
}

function generateCodeSnippetPython(operation: SnippetOperation, example: SnippetExample, full: boolean): string {
  let snippet = "";
  if (full) {
    snippet += "import os\n";
    snippet += "from regexsolver import RegexSolverClient, Term\n\n";
    snippet += 'client = RegexSolverClient(api_token=os.getenv("REGEXSOLVER_API_TOKEN"))\n\n';
  }

  const { vars, args } = generateTermsVarsAndArgsPython(example);
  snippet += vars;
  if (vars.length > 0) snippet += "\n";

  let call = "";
  switch (operation.operationId) {
    case "cardinality":
      call = wrapPythonCall(`client.get_cardinality(${args})`, full);
      break;
    case "dot":
      call = wrapPythonCall(`client.get_dot(${args})`, full);
      break;
    case "empty":
      call = wrapPythonCall(`client.is_empty(${args})`, full);
      break;
    case "empty_string":
      call = wrapPythonCall(`client.is_empty_string(${args})`, full);
      break;
    case "total":
      call = wrapPythonCall(`client.is_total(${args})`, full);
      break;
    case "deterministic":
      call = wrapPythonCall(`client.is_deterministic(${args})`, full);
      break;
    case "equivalent":
      call = wrapPythonCall(`client.equivalent(${args})`, full);
      break;
    case "length":
      call = wrapPythonCall(`client.get_length(${args})`, full);
      break;
    case "pattern":
      call = wrapPythonCall(`client.get_pattern(${args})`, full);
      break;
    case "subset":
      call = wrapPythonCall(`client.subset(${args})`, full);
      break;
    case "concat":
      call = wrapPythonCall(`client.concat(${args})`, full);
      break;
    case "difference":
      call = wrapPythonCall(`client.difference(${args})`, full);
      break;
    case "intersection":
      call = wrapPythonCall(`client.intersection(${args})`, full);
      break;
    case "repeat": {
      const maxArgPy =
        example.max !== undefined && example.max !== null
          ? `, ${example.max}`
          : `, None`;
      call = wrapPythonCall(`client.repeat(${args}, ${example.min}${maxArgPy})`, full);
      break;
    }
    case "union":
      call = wrapPythonCall(`client.union(${args})`, full);
      break;
    case "complement":
      call = wrapPythonCall(`client.complement(${args})`, full);
      break;
    case "determinize":
      call = wrapPythonCall(`client.determinize(${args})`, full);
      break;
    case "strings": {
      let callArgs = `${args}, ${example?.limit ?? 10}, ${example?.offset ?? 0}`;
      for (const [k, v] of stringsOptions(example)) {
        callArgs += STRING_TYPED_OPTIONS.includes(k)
          ? `, ${PYTHON_OPTION_KEYS[k]}="${escapeValue(String(v))}"`
          : `, ${PYTHON_OPTION_KEYS[k]}=${v}`;
      }
      call = wrapPythonCall(`client.generate_strings(${callArgs})`, full);
      break;
    }
    case "limits":
      call = wrapPythonCall(`client.get_account_limits()`, full);
      break;
  }

  snippet += call + "\n";
  return snippet;
}
