# Agent Instructions

## Repository workflow

- Immediately before every push, run the repository's complete test suite and every lint, format,
  static-analysis, and architecture check. In the main Unity repository this includes, at minimum,
  `dotnet csharpier check Assets/`, `./build.sh lint`, and `./build.sh test`.
- Do not push when any test or check fails. Known, pre-existing, flaky, or allegedly unrelated
  failures still block the push. If source changes after validation, rerun the complete validation.
- Never claim a revision is validated unless every required check completed successfully against
  the exact worktree state being pushed.

## Strategic AI work

Treat strategic-AI execution as a performance-critical game loop. Do not add behavior,
instrumentation, or diagnostics to an AI or simulation hot path without first identifying its
execution frequency and asymptotic cost.

Mandatory rules:

- Before stating a cause, identify the inspected code path or controlled measurement that proves
  it. If neither exists, write "cause not established" and present possible explanations only as
  hypotheses. Never describe correlation, a single simulation delta, or a plausible mechanism as a
  diagnosis. Do not use words such as "confirmed," "caused," "because," or "the problem is" for a
  causal claim unless the supporting evidence is stated in the same response.
- Inspect the relevant implementation before proposing or editing AI behavior. Do not design from
  memory, assumptions, or a single simulation outcome.
- Establish a measured baseline before a performance-affecting change. Record identical seeds,
  tick counts, wall-clock duration, and gameplay outcomes before and after the change.
- Never perform a whole scene-graph scan once per tick merely for reporting or diagnostics.
- Never put a scene-graph query inside a loop over officers, fleets, planets, missions, units, or
  buildings. Resolve the collection once and index it by the required identifier.
- Do not repeatedly call `GetSceneNodesByType`, `GetSceneNodesByOwnerInstanceID`, LINQ materializers,
  sorting, or allocation-heavy projections in nested loops or per-candidate evaluation.
- Build one turn-scoped assessment/index and reuse it across planners, scorers, and phases. Prefer
  dictionaries, sets, cached aggregates, and existing `AITurnContext`/assessment data.
- Runtime facts should be captured from existing events/results whenever possible. Diagnostics
  should subscribe to lifecycle events instead of polling the entire graph.
- When polling is unavoidable, sample at an explicit coarse interval and document why the sample is
  representative. Keep expensive diagnostic instrumentation opt-in and out of normal simulations.
- Diagnostic code must not materially change simulation runtime. A regression greater than 10%
  requires optimization or explicit user approval before proceeding.
- A per-faction AI turn should target 150 ms and must remain below 300 ms at the 99th percentile in
  representative late-game saves. Do not hide spikes by running the AI less frequently.
- Profile late-game state, not only early turns. At minimum check an established turn-1000 or
  turn-2000 save when changing planner enumeration, candidate generation, scoring, or graph access.
- Candidate pruning must preserve the highest-quality candidates. Do not use arbitrary iteration
  caps that discard superior choices based on traversal order.
- Avoid scattered boolean gates and consumer-specific exceptions. Put shared allocation,
  reservation, risk, and eligibility policy at a single documented architectural boundary.
- Do not patch successive symptoms without confirming the underlying ownership/data-flow problem.
  After one failed targeted fix, stop and map every path through the affected system before editing
  again.
- Do not introduce new gameplay behavior while fixing performance or adding instrumentation.
- Simulation results must include enough detail to detect behavioral regressions: faction planets,
  acquisitions/losses, assaults and success, fleets, capital ships, starfighters, regiments,
  special forces, manufacturing by category, personnel captures/deaths, and victory state.
- Before claiming an AI change is ready, run the relevant tests, run deterministic before/after
  simulations with identical content and seeds, report timing and gameplay deltas separately, and
  call out small sample sizes or invalid/crashed seeds.
- Persistent simulation save jobs must use the faction instance IDs `FNEMP1` for the Empire and
  `FNALL1` for the Alliance in `PlayerFactionId`. Never use display names such as `Empire` or
  `Alliance`; `HeadlessSimulationRunner.SaveSimulation` resolves factions by instance ID, and an
  invalid value fails after all ticks complete but before the summary is written. Verify the job
  payload before queuing a batch.

Code-review questions that must be answered for every AI hot-path change:

1. How often does this execute per tick and per faction?
2. How many scene-graph traversals, sorts, enumerations, and allocations does it perform?
3. Does any query occur inside another entity or candidate loop?
4. Can the required data come from the turn assessment, an index, or an event instead?
5. What are the before/after median, p90, and p99 timings in late-game state?
6. Did identical-seed gameplay outcomes remain acceptable?

## C# documentation and tests

- Add XML documentation comments to every C# method and constructor, regardless of access
  modifier. This explicitly includes private methods, private constructors, Unity lifecycle methods,
  and private test helpers. Document parameters and return values when present.
- Place tests in the corresponding test project and directory, mirroring the production area and
  namespace. Name each test file and fixture `<Subject>Tests`.
- Name test methods `<MemberUnderTest>_<Scenario>_<ExpectedBehavior>`. Keep each test focused on one
  observable behavior. Put setup/teardown before test cases and private helpers after all test cases.
- Test private behavior through the subject's public contract. Do not invoke private methods through
  reflection or widen production visibility solely for a test; extract a meaningful collaborator
  only when it independently owns behavior worth testing.

## Pull requests

- Write pull-request titles in capitalized present-progressing form, such as “Adding ...” or “Fixing ...”.
- Begin every pull-request description bullet with a capitalized present-progressing verb.

## Evidence before explanation

- Inspect before you vomit words without understanding.
- Before running or queuing a simulation, verify Unity has finished compiling and its loaded assemblies are newer than every modified C# source file. A successful `dotnet` or lint build does not prove the open Unity editor loaded those changes. Never report simulation results without verifying the run used the intended build.

## Branch names

- Never use slashes in branch names. Use hyphens to separate words.
- Keep branch names terse: use the fewest words that identify the work, normally two or three. Avoid sentence-like names such as `strengthening-test-lint-rules`.

- Before answering any request for a recommendation, approach, fix, design, or how to proceed, perform a fresh task-specific code scan in the current turn. Inspect the concrete implementation, callers, tests, data flow, and ownership boundaries directly relevant to the question; do not rely on an earlier scan, conversation memory, architectural intuition, or a cursory search. State the inspected code paths and the evidence that supports the recommendation. If the evidence is incomplete, continue inspecting or say "cause not established" instead of recommending from assumptions.

## Behavioral evidence

- Never mention the original game in production code, comments, identifiers, configuration,
  documentation, or user-visible text.
- Production code and user-visible text must describe only this codebase's behavior and intent.
- Never invent or approximate established behavior. Trace every relevant condition, transition,
  configured value, formula, callback, side effect, failure path, message, cleanup step, and saved
  state before editing.
- Support every implemented branch with inspected code or data. Plausibility, observed outcomes,
  current tests, and prior claims are not proof.
- If any required behavior remains unknown, stop and report the gap. Do not add defaults,
  generalized rules, thresholds, eligibility conditions, or temporary behavior without explicit
  approval.
- Before claiming an exact match, audit for both missing behavior and behavior that exists only in
  the new code. Report every unresolved area.

## Prohibited external references

- Never mention, cite, name, allude to, quote, or include evidence from the original game or any
  recovered or disassembled source in any persistent artifact.
- This prohibition applies to source code, comments, identifiers, tests, fixtures, configuration,
  documentation, agent notes, commit messages, branch names, pull-request titles, descriptions,
  comments, and reviews, issue text and comments, release notes, and user-visible text.
- This rule overrides any instruction to document provenance or cite behavioral evidence in a
  persistent artifact. State only the verified behavior or conclusion without naming external
  provenance.
- Such material may be inspected locally only when necessary to verify behavior. Keep that analysis
  transient; never write or publish it in the repository, Git history, GitHub, or any other project
  artifact.
