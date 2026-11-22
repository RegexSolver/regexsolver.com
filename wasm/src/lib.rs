//! The live demo's engine: runs one operation of the demo form on
//! [`regexsolver`] and returns the result the page renders, as JSON.
//!
//! The page runs it in a Web Worker (`site/public/engine/worker.js`), so a
//! long operation never blocks the UI, and a worker that does not answer in
//! time can be terminated.

use std::{cell::RefCell, collections::HashMap, ops::Bound, time::Duration};

use regexsolver::{
    Term,
    cardinality::Cardinality,
    error::EngineError,
    execution_profile::ExecutionProfileBuilder,
    fast_automaton::{CharacterOrder, GenerationOptions, PathOrder},
    neural_synthesis::{Device, NeuralSynthesizer},
};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Time after which an operation gives up, in milliseconds. The worker's own
/// deadline is longer: it only catches what the engine cannot check (a single
/// step running away).
const EXECUTION_TIMEOUT_MS: u64 = 10_000;

/// Largest automaton an operation may build. Keeps memory bounded: the page
/// runs on the visitor's machine.
const MAX_NUMBER_OF_STATES: usize = 20_000;

#[wasm_bindgen]
extern "C" {
    /// `performance.now()`, available in workers as on the main thread.
    #[wasm_bindgen(js_namespace = performance, js_name = now)]
    fn performance_now() -> f64;
}

/// `wasm32-unknown-unknown` has no clock of its own: the timeout reads the
/// host's monotonic one.
fn clock() -> Duration {
    Duration::from_secs_f64(performance_now() / 1000.0)
}

thread_local! {
    /// The neural synthesis models loaded so far, by name.
    static SYNTHESIZERS: RefCell<HashMap<String, NeuralSynthesizer>> =
        RefCell::new(HashMap::new());
}

/// Loads a neural synthesis model (a learned model that proposes simpler
/// patterns for an automaton) from its `config.json` and `model.safetensors`,
/// under `name`, the name a request's `format` gives.
#[wasm_bindgen(js_name = loadModel)]
pub fn load_model(name: &str, config: &[u8], weights: Vec<u8>) -> Result<(), JsError> {
    let synthesizer = NeuralSynthesizer::from_bytes(config, weights, Device::Cpu)
        .map_err(|err| JsError::new(&err.to_string()))?;
    SYNTHESIZERS.with(|cell| cell.borrow_mut().insert(name.to_string(), synthesizer));
    Ok(())
}

/// The demo form's state, as the page sends it.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Request {
    operation: String,
    regex1: String,
    regex2: Option<String>,
    min: Option<u32>,
    max: Option<u32>,
    limit: Option<usize>,
    offset: Option<usize>,
    path_order: Option<String>,
    character_order: Option<String>,
    /// How an operation that returns a term returns it: `"automaton"` (its
    /// graph), `"state_elimination"` (the default) or the name of a loaded
    /// model.
    format: Option<String>,
}

/// An error, with the message the page shows.
struct Failure(String);

impl From<EngineError> for Failure {
    fn from(err: EngineError) -> Self {
        Failure(describe(&err))
    }
}

/// What the page renders: `type` picks the presentation.
#[derive(Serialize)]
struct Response {
    #[serde(rename = "type")]
    kind: &'static str,
    value: serde_json::Value,
}

/// Runs the operation `request` (the demo form's JSON) describes and returns
/// its result as `{"type": …, "value": …}` JSON.
#[wasm_bindgen]
pub fn run(request: &str) -> Result<String, JsError> {
    let request: Request =
        serde_json::from_str(request).map_err(|err| JsError::new(&err.to_string()))?;
    let profile = ExecutionProfileBuilder::new()
        .execution_timeout(EXECUTION_TIMEOUT_MS)
        .max_number_of_states(MAX_NUMBER_OF_STATES)
        .clock(clock)
        .build();
    let response = profile
        .run(|| execute(&request))
        .map_err(|Failure(message)| JsError::new(&message))?;
    serde_json::to_string(&response).map_err(|err| JsError::new(&err.to_string()))
}

fn execute(request: &Request) -> Result<Response, Failure> {
    let a = Term::from_pattern(&request.regex1)?;
    let b = || Term::from_pattern(request.regex2.as_deref().unwrap_or_default());
    Ok(match request.operation.as_str() {
        "cardinality" => {
            let value = match a.cardinality()? {
                Cardinality::Integer(n) => format!("<Cardinality::Integer({n})>"),
                Cardinality::Infinite => "<Cardinality::Infinite>".to_string(),
                Cardinality::BigInteger => "<Cardinality::BigInteger>".to_string(),
            };
            response("cardinality", value)
        }
        "length" => {
            let (min, max) = a.length();
            let show = |n: Option<u32>| n.map_or("null".to_string(), |n| n.to_string());
            response(
                "length",
                format!("<Length: min={}, max={}>", show(min), show(max)),
            )
        }
        "equivalent" => response("boolean", a.equivalent(&b()?)?.to_string()),
        "subset" => response("boolean", a.subset(&b()?)?.to_string()),
        // The pattern's minimal automaton: as a term, a pattern converts as
        // is, without state elimination or a model.
        "convert" => term(a.minimize()?, request)?,
        "concat" => term(a.concat([&b()?])?, request)?,
        "union" => term(a.union([&b()?])?, request)?,
        "intersection" => term(a.intersection([&b()?])?, request)?,
        "difference" => term(a.difference(&b()?)?, request)?,
        "symmetric_difference" => term(a.symmetric_difference([&b()?])?, request)?,
        "complement" => term(a.complement()?, request)?,
        "repeat" => {
            let min = Bound::Included(request.min.unwrap_or(0));
            let max = request.max.map_or(Bound::Unbounded, Bound::Included);
            term(a.repeat((min, max))?, request)?
        }
        "strings" => {
            let options = GenerationOptions::new()
                .with_paths(match request.path_order.as_deref() {
                    Some("interleave") => PathOrder::Interleave,
                    Some("shuffled") => PathOrder::Shuffled,
                    _ => PathOrder::Sweep,
                })
                .with_characters(match request.character_order.as_deref() {
                    Some("shuffled") => CharacterOrder::Shuffled,
                    _ => CharacterOrder::Ascending,
                });
            let strings = a.generate_strings(
                request.limit.unwrap_or(10),
                request.offset.unwrap_or(0),
                options,
            )?;
            Response {
                kind: "strings",
                value: serde_json::json!(strings),
            }
        }
        // The page only sends the operations above.
        other => return Err(Failure(format!("Unknown operation `{other}`."))),
    })
}

fn response(kind: &'static str, value: String) -> Response {
    Response {
        kind,
        value: serde_json::Value::String(value),
    }
}

/// A term an operation returns, in the request's `format`: the graph of its
/// minimal automaton, or a pattern by state elimination or by a model (which
/// proposes simpler patterns, each checked against the automaton).
fn term(term: Term, request: &Request) -> Result<Response, Failure> {
    Ok(match request.format.as_deref() {
        Some("automaton") => response("dot", term.minimize()?.to_automaton()?.to_dot()),
        None | Some("state_elimination") => response("regex", term.to_pattern()?),
        Some(model) => SYNTHESIZERS.with(|cell| match cell.borrow().get(model) {
            Some(synthesizer) => Ok(response("regex", term.to_pattern_with(synthesizer)?)),
            // The worker loads the model before it sends the request.
            None => Err(Failure(format!("The model {model} is not loaded."))),
        })?,
    })
}

fn describe(err: &EngineError) -> String {
    match err {
        EngineError::OperationTimeOutError => "The operation took too much time.".to_string(),
        EngineError::AutomatonHasTooManyStates => {
            "The operation built an automaton with too many states.".to_string()
        }
        _ => {
            let message = err.to_string();
            let mut chars = message.chars();
            match chars.next() {
                Some(first) => first.to_uppercase().chain(chars).collect(),
                None => message,
            }
        }
    }
}
