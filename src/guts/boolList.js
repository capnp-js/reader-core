/* @flow */

import type { BoolListLayout } from "@capnp-js/layout";
import type { SegmentR, SegmentB, Word } from "@capnp-js/memory";
import type { ArenaB } from "@capnp-js/builder-core";

import type { ArenaR, AnyGutsR } from "../index";

import { PointerTypeError, ListAlignmentError } from "@capnp-js/internal-error";

type uint = number;

export interface BoolListGutsR {
  +level: uint;
  +arena: ArenaR;
  +segment: SegmentR;
  +layout: BoolListLayout;

  set(level: uint, arena: ArenaB, ref: Word<SegmentB>): void;
}

export class InlineBoolList implements BoolListGutsR {
  +level: uint;
  +arena: ArenaR;
  +segment: SegmentR;
  +layout: BoolListLayout;

  static narrow(guts: AnyGutsR): BoolListGutsR {
    if (guts.layout.tag === "bool list") {
      return (guts: any); // eslint-disable-line flowtype/no-weak-types
    } else {
      if (guts.layout.tag === "struct") {
        throw new PointerTypeError(["list"], "struct");
      } else if (guts.layout.tag === "non-bool list") {
        throw new ListAlignmentError("bit aligned", "byte aligned");
      } else {
        (guts.layout.tag: "cap");
        throw new PointerTypeError(["list"], "capability");
      }
    }
  }

  constructor(level: uint, arena: ArenaR, segment: SegmentR, layout: BoolListLayout) {
    this.level = level;
    this.arena = arena;
    this.segment = segment;
    this.layout = layout;
  }

  set(level: uint, arena: ArenaB, ref: Word<SegmentB>): void {
    this.arena.boolListCopy(this.layout, this.segment, level, arena, ref);
  }
}

export class RefedBoolList extends InlineBoolList implements BoolListGutsR {
  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
    const p = arena.pointer(ref);
    return new this(level, arena, p.object.segment, arena.boolListLayout(p));
  }

  constructor(level: uint, arena: ArenaR, segment: SegmentR, layout: BoolListLayout) {
    super(level+1, arena, segment, layout);
  }
}
