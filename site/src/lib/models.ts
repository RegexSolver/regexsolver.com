/* The neural synthesis models the demo can use, all on the Hugging Face Hub.
   Each is pinned to a commit so a model update cannot change the demo's
   answers unannounced; the Hub serves them with CORS. `bytes` is the size of
   model.safetensors, shown before the download. The crate's README lists
   them; add a model here when it gets one. */

export type Model = {
  name: string;
  commit: string;
  bytes: number;
};

export const MODELS: Model[] = [
  {
    name: "kleene2-9m-b16-t128",
    commit: "1a68f66c474109b11ea82768683aa584fb3047b8",
    bytes: 36_668_040,
  },
  {
    name: "kleene2-5m-b16-t128",
    commit: "8005e30a59c07dc721caba63c7ef67df99aa1ea7",
    bytes: 20_773_128,
  },
  {
    name: "kleene1-9m-b16-t128",
    commit: "535888b3ac5673c15416c95bcf0d9d837e526360",
    bytes: 36_668_040,
  },
];

/* Where a model's files are: <url>config.json, <url>model.safetensors. */
export const modelUrl = (model: Model) =>
  `https://huggingface.co/alexvbrdn/${model.name}/resolve/${model.commit}/`;

export const findModel = (name: string) => MODELS.find((m) => m.name === name);

export const megabytes = (bytes: number) => `${(bytes / 1e6).toFixed(0)} MB`;
