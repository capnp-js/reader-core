/* @flow */

import type { NonboolListEncoding, NonboolListLayout } from "@capnp-js/layout";
import type { SegmentR, SegmentB, Word } from "@capnp-js/memory";
import type { ArenaB } from "@capnp-js/builder-core";

import type { ArenaR, AnyGutsR } from "../index";

import type { StructGutsR } from "./struct";

import { PointerTypeError, ListAlignmentError } from "@capnp-js/internal-error";

import { InlineStruct } from "./struct";

type uint = number;
type u20 = number;

export interface NonboolListGutsR {
  +level: uint;
  +arena: ArenaR;
  +segment: SegmentR;
  +layout: NonboolListLayout;

  stride(): u20;
  pointersBegin(): uint;
  set(level: uint, arena: ArenaB, ref: Word<SegmentB>): void;
  inlineStruct(dataSection: uint, end: uint): StructGutsR;
}

export class InlineNonboolList implements NonboolListGutsR {
  +level: uint;
  +arena: ArenaR;
  +segment: SegmentR;
  +layout: NonboolListLayout;

  static narrow(guts: AnyGutsR): NonboolListGutsR {
    if (guts.layout.tag === "non-bool list") {
      return (guts: any); // eslint-disable-line flowtype/no-weak-types
    } else {
      //TODO: Flow doesn't dig down with this refinement even though it's
      //      unique. Circumvent for now, but try to get it fixed.
      if (guts.layout.tag === "struct") {
        throw new PointerTypeError(["list"], "struct");
      } else if (guts.layout.tag === "bool list") {
        throw new ListAlignmentError("byte aligned", "bit aligned");
      } else {
        //TODO: Get flow to dig down with its refinement: (guts.layout.tag: "capability");
        throw new PointerTypeError(["list"], "capability");
      }
    }
  }

  constructor(level: uint, arena: ArenaR, segment: SegmentR, layout: NonboolListLayout) {
    this.level = level;
    this.arena = arena;
    this.segment = segment;
    this.layout = layout;
  }

  stride(): u20 {
    return this.layout.encoding.bytes.data + this.layout.encoding.bytes.pointers;
  }

  pointersBegin(): uint {
    return this.layout.begin + this.layout.encoding.bytes.data;
  }

  set(level: uint, arena: ArenaB, ref: Word<SegmentB>): void {
    this.arena.nonboolListCopy(this.layout, this.segment, level, arena, ref);
  }

  inlineStruct(dataSection: uint, end: uint): StructGutsR {
    return new InlineStruct(this.level, this.arena, this.segment, {
      tag: "struct",
      bytes: this.layout.encoding.bytes,
      dataSection,
      pointersSection: dataSection + this.layout.encoding.bytes.data,
      end,
    });
  }
}

export class RefedNonboolList extends InlineNonboolList implements NonboolListGutsR {
  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>, compiledEncoding: NonboolListEncoding): this {
    const p = arena.pointer(ref);
    const layout = arena.specificNonboolListLayout(p, compiledEncoding);
    return new this(level, arena, p.object.segment, layout);
  }

  constructor(level: uint, arena: ArenaR, segment: SegmentR, layout: NonboolListLayout) {
    super(level+1, arena, segment, layout);
  }
}
