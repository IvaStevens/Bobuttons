// jsdom contract tests for the four opt-in icon packs. Imports the pack
// sources directly (not dist/), so this runs without a build; the built
// bundles are covered by scripts/check-icon-packs.mjs --artifacts.
import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as animal from "./animal.js";
import * as basic from "./basic.js";
import * as food from "./food.js";
import * as shapes from "./shapes.js";
import { animalIcons } from "./animal.js";
import type { AnimalIconName } from "./animal.js";
import { basicIcons } from "./basic.js";
import { foodIcons } from "./food.js";
import { shapesIcons } from "./shapes.js";

function render(element: React.ReactElement): { svg: SVGSVGElement; html: string } {
  const html = renderToStaticMarkup(element);
  const host = document.createElement("div");
  host.innerHTML = html;
  const svg = host.querySelector("svg");
  if (!svg) throw new Error("no <svg> rendered");
  return { svg: svg as SVGSVGElement, html };
}

describe("pack contents", () => {
  it("each pack has exactly the icons the ticket lists", () => {
    expect(Object.keys(animalIcons)).toHaveLength(15);
    expect(Object.keys(basicIcons)).toHaveLength(11);
    expect(Object.keys(foodIcons)).toHaveLength(28);
    expect(Object.keys(shapesIcons)).toHaveLength(15);
  });

  it("does not leak another pack's icons through a pack", () => {
    expect("cat" in animalIcons).toBe(true);
    expect("cat" in basicIcons).toBe(false);
    expect("cat" in foodIcons).toBe(false);
    expect("cat" in shapesIcons).toBe(false);
    expect("pizza" in animalIcons).toBe(false);
    expect("menu" in shapesIcons).toBe(false);
  });
});

describe("size", () => {
  it("defaults to 24", () => {
    const { svg } = render(<animal.Cat />);
    expect(svg.getAttribute("width")).toBe("24");
    expect(svg.getAttribute("height")).toBe("24");
  });
  it("applies a numeric size", () => {
    const { svg } = render(<animal.Cat size={32} />);
    expect(svg.getAttribute("width")).toBe("32");
    expect(svg.getAttribute("height")).toBe("32");
  });
  it("passes a string size straight through", () => {
    const { svg } = render(<animal.Cat size="2em" />);
    expect(svg.getAttribute("width")).toBe("2em");
  });
});

describe("colour and fill", () => {
  it("uses currentColor when no colour is passed", () => {
    const { svg } = render(<basic.Star />);
    expect(svg.getAttribute("stroke")).toBe("currentColor");
    for (const el of svg.querySelectorAll("path, circle, rect, ellipse")) {
      // jsdom lower-cases CSS keywords in style.stroke.
      expect((el as SVGElement).style.stroke.toLowerCase()).toBe("currentcolor");
    }
  });
  it("passes a colour through unchanged, including a CSS variable", () => {
    const { svg } = render(<basic.Star color="var(--primary)" />);
    expect(svg.getAttribute("stroke")).toBe("var(--primary)");
    for (const el of svg.querySelectorAll("path")) {
      expect((el as SVGElement).style.stroke).toBe("var(--primary)");
    }
  });
  it("sets an inline fill:none on every element, for every tag a pack uses", () => {
    // An inline style is what beats BobuttonsProvider's
    // `[data-bobuttons-icon] svg path { fill: currentColor }` rule.
    const packs = [animalIcons, basicIcons, foodIcons, shapesIcons];
    const tagsSeen = new Set<string>();
    for (const pack of packs) {
      for (const Component of Object.values(pack)) {
        const { svg } = render(<Component />);
        const els = svg.querySelectorAll("path, circle, rect, ellipse");
        expect(els.length).toBeGreaterThan(0);
        for (const el of els) {
          tagsSeen.add(el.tagName.toLowerCase());
          expect((el as SVGElement).style.fill).toBe("none");
        }
      }
    }
    expect(tagsSeen.has("path")).toBe(true);
    expect(tagsSeen.has("circle")).toBe(true);
  });
  it("is hidden from assistive tech", () => {
    const { svg } = render(<animal.Cat />);
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("icons shared by two packs render identically", () => {
  const pairs: Array<[string, React.ComponentType, React.ComponentType]> = [
    ["fish", animal.Fish, food.Fish],
    ["shrimp", animal.Shrimp, food.Shrimp],
    ["circle", basic.Circle, shapes.Circle],
    ["star", basic.Star, shapes.Star],
  ];
  it.each(pairs)("%s", (_name, A, B) => {
    expect(renderToStaticMarkup(<A />)).toBe(renderToStaticMarkup(<B />));
  });
});

describe("unknown names", () => {
  it("is a compile-time error to import a name the pack does not have", () => {
    // @ts-expect-error — "Dragon" is not an animal icon.
    expect(animal.Dragon).toBeUndefined();
  });

  it("is a compile-time error to index the record with a bad literal key", () => {
    // @ts-expect-error — "dragon" is not an AnimalIconName.
    expect(animalIcons["dragon"]).toBeUndefined();
  });

  it("a non-literal unknown key looks up as undefined (no Proxy, no placeholder)", () => {
    const name: string = "dragon";
    const lookup = (animalIcons as Record<string, unknown>)[name];
    expect(lookup).toBeUndefined();
  });

  it("the `in` guard narrows a runtime string to the exported union", () => {
    const name: string = "cat";
    if (name in animalIcons) {
      const known: AnimalIconName = name as AnimalIconName;
      expect(typeof animalIcons[known]).toBe("function");
    } else {
      throw new Error("expected `cat` to be known");
    }
    expect("dragon" in animalIcons).toBe(false);
  });

  it("rendering an unknown lookup unguarded throws in the consumer's tree", () => {
    const Missing = (animalIcons as Record<string, React.ComponentType | undefined>)["dragon"] as React.ComponentType;
    // Asserted as *a* throw, not a message, so it is not coupled to React internals.
    expect(() => renderToStaticMarkup(React.createElement(Missing))).toThrow();
  });
});
