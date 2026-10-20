// AC9 gate (docs/context §N1): proves BobuttonsProvider restyles the tree
// when the `theme` prop changes WITHOUT remounting anything underneath it.
// Renders a probe child that increments a counter in useEffect([], ...) on
// mount only, swaps the theme prop on the same root, and asserts the counter
// is still 1 (no remount) while the resolved theme class on <body> changed.
// Catches both a `key={theme}` regression and a future Tamagui release that
// re-reads `defaultTheme` as initial-only.
import { describe, expect, it } from "vitest";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { BobuttonsProvider } from "./BobuttonsProvider.js";

describe("BobuttonsProvider theme switching", () => {
  it("restyles without remounting when the theme prop changes", async () => {
    let mountCount = 0;

    function Probe(): React.ReactElement {
      React.useEffect(() => {
        mountCount += 1;
      }, []);
      return <></>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <BobuttonsProvider theme="default">
          <Probe />
        </BobuttonsProvider>
      );
    });
    expect(mountCount).toBe(1);
    const classAfterFirstRender = document.body.className;

    act(() => {
      root.render(
        <BobuttonsProvider theme="ocean">
          <Probe />
        </BobuttonsProvider>
      );
    });

    expect(mountCount).toBe(1); // no remount
    expect(document.body.className).not.toBe(classAfterFirstRender);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
