// AC21 Slice 1: the single-import entry — `Button` only, not the whole
// package. Exercised two ways by scripts/check-scratch-install.mjs: (1) the
// bundler/node16 typechecks above walk its import graph; (2) it is bundled
// with esbuild and the resulting byte size is logged, so a future
// tree-shaking regression is visible (review finding, low — this used to be
// typecheck-only with a "real bundler measurement is a follow-up" comment).
import { Button } from "bobuttons";

void Button;
