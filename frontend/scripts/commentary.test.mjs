// Tests for the shared commentary validator (mirrors engine/tests/test_commentary_style.py).
// Run: npm run test:commentary   (Node 22+, no extra dependencies)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanCommentary,
  endsIncomplete,
  generateCommentary,
  PROBLEM_CUT_OFF,
  validateCommentary,
} from "../src/lib/commentary.ts";

const GOOD =
  "The fine print around those first four service missions is the most interesting part of this RFP. " +
  "NASA is effectively saying it will buy seats and cargo space from whoever wins, at set prices.\n\n" +
  "The $325 million per crew launch and $300 million per cargo flight are the numbers I keep coming back to. " +
  "It's a hedge, and a pragmatic one.\n\n" +
  "What I'd want to know next is how serious the bidders really are.";
const CUT = GOOD.split(" ").slice(0, -4).join(" "); // "...how serious" (cut off)

test("good commentary passes", () => {
  assert.deepEqual(validateCommentary(GOOD), []);
});

test("complete endings pass", () => {
  for (const end of [
    "It works.",
    "Does it?",
    "Finally!",
    'He called it "a mess."',
    "He called it “a mess.”",
    "(Nobody said it would be easy.)",
    "I'm sure of that.",
  ]) {
    assert.equal(endsIncomplete(GOOD + "\n\n" + end), false, end);
  }
});

test("cut-off endings fail", () => {
  for (const text of [
    CUT,
    GOOD.slice(0, -1) + "ing",
    GOOD + "\n\nAnd the rest is",
    GOOD + "\n\nWe'll see where it goes...",
    GOOD + "\n\nWe'll see where it goes…",
    GOOD + "\n\nIt's the kind of thing that happens to the.",
    GOOD + "\n\nNobody wants to admit it, but",
  ]) {
    assert.equal(endsIncomplete(text), true, text);
    assert.ok(validateCommentary(text).includes(PROBLEM_CUT_OFF), text);
  }
});

test("cleaner trims a cut-off last sentence", () => {
  assert.equal(cleanCommentary(CUT), GOOD.split("\n\n").slice(0, -1).join("\n\n"));
  assert.equal(cleanCommentary(GOOD + "\n\nAnd the rest is"), GOOD);
  assert.equal(cleanCommentary("This is the first full sentence here. Then it just stops"), "This is the first full sentence here.");
});

test("cleaner strips a leaked JSON tail", () => {
  assert.equal(cleanCommentary(GOOD + '", "confidence": 0.88}\n```'), GOOD);
});

function fakeFetch(replies) {
  const calls = [];
  globalThis.fetch = async (_url, init) => {
    calls.push(JSON.parse(init.body));
    const [content, finish_reason = "stop"] = replies.shift();
    return new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason }] }), { status: 200 });
  };
  return calls;
}

const opts = { apiKey: "x", model: "m", system: "s", user: "u" };

test("retries once when the draft is cut off", async () => {
  const calls = fakeFetch([[CUT], [GOOD]]);
  const r = await generateCommentary({ ...opts, mode: "new" });
  assert.equal(calls.length, 2);
  assert.equal(r.text, GOOD);
  assert.equal(r.passed, true);
  assert.match(calls[1].messages.at(-1).content, /stopped mid-sentence/);
});

test("finish_reason length counts as a failure", async () => {
  const calls = fakeFetch([[GOOD, "length"], [GOOD]]);
  const r = await generateCommentary({ ...opts, mode: "new" });
  assert.equal(calls.length, 2);
  assert.equal(r.passed, true);
});

test("both attempts cut off: new article saves the trimmed text, replace keeps the old", async () => {
  fakeFetch([[CUT, "length"], [CUT, "length"]]);
  const r = await generateCommentary({ ...opts, mode: "new" });
  assert.equal(r.passed, false);
  assert.ok(r.text && !endsIncomplete(r.text));
  fakeFetch([[CUT, "length"], [CUT, "length"]]);
  const k = await generateCommentary({ ...opts, mode: "replace", existing: GOOD });
  assert.equal(k.text, null); // caller keeps the existing commentary
});
