"use client";

import { Page } from "../components/Page";
import { Demo } from "../components/Demo";

export const DemoPage = () => (
  <Page>
    <h1 className="display text-(length:--t-h2)">Demo</h1>
    <p className="mt-4 mb-10 leading-relaxed text-muted-foreground">
      Runs in your browser, on regexsolver compiled to WebAssembly: nothing is
      sent anywhere. A result can be shown as its automaton, or as a pattern
      by state elimination or by a neural synthesis model, downloaded from
      Hugging Face on first use. The address bar keeps the inputs, so a demo
      can be shared by its link.
    </p>
    <Demo syncUrl />
  </Page>
);
