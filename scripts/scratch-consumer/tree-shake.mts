// Single-import entry (`Button` only). check-scratch-install.mjs bundles it with
// esbuild and logs the size, so a tree-shaking regression is visible.
import { Button } from "bobuttons";

void Button;
