/* @flow */

import type { SegmentB, Word } from "@capnp-js/memory";
import type { CapLayout } from "@capnp-js/layout";

import type { ArenaB } from "@capnp-js/builder-core";

import type { AnyGutsR } from "../index";

import { PointerTypeError } from "@capnp-js/internal-error";
import { int32 } from "@capnp-js/write-data";

type uint = number;

export interface CapGutsR {
  +layout: CapLayout;

  set(level: uint, arena: ArenaB, ref: Word<SegmentB>): void;
}

export class Cap implements CapGutsR {
  +layout: CapLayout;

  static fromAny(guts: AnyGutsR): CapGutsR {
    if (guts.layout.tag === "cap") {
      return (guts: any); // eslint-disable-line flowtype/no-weak-types
    } else {
      if (guts.layout.tag === "struct") {
        throw new PointerTypeError(["capability"], "struct");
      } else if (guts.layout.tag === "bool list") {
        throw new PointerTypeError(["capability"], "list");
      } else {
        //TODO: Get flow to dig down to refine this: (guts.layout.tag: "non-bool list");
        throw new PointerTypeError(["capability"], "list");
      }
    }
  }

  constructor(layout: CapLayout) {
    this.layout = layout;
  }

  set(level: uint, arena: ArenaB, ref: Word<SegmentB>): void {
    //TODO: Clobber `cap` from @capnp-js/write-pointers
    int32(0x03, ref.segment.raw, ref.position);
    int32(this.layout.index, ref.segment.raw, ref.position+4);
  }
}
