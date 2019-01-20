/* @flow */

import type { Bytes, StructLayout } from "@capnp-js/layout";
import type { SegmentR, SegmentB, Word } from "@capnp-js/memory";
import type { ArenaB } from "@capnp-js/builder-core";

import type { ArenaR, AnyGutsR } from "../index";

import { uint16 as decodeTag } from "@capnp-js/read-data";
import { fixedWidthStructCopy } from "@capnp-js/copy-pointers";
import { PointerTypeError } from "@capnp-js/internal-error";
import { IncorrectTagError } from "@capnp-js/programmer-error";

type uint = number;
type u16 = number;
type u19 = number;

export interface StructGutsR {
  +level: uint;
  +arena: ArenaR;
  +segment: SegmentR;
  +layout: StructLayout;

  getTag(offset: u19): u16;
  checkTag(field: u16, offset: u19): void;
  pointersWord(offset: u19): null | Word<SegmentR>;
  set(level: uint, arena: ArenaB, ref: Word<SegmentB>): void;
  setFixedWidth(level: uint, arena: ArenaB, object: Word<SegmentB>, bytes: Bytes): void;
}

export class InlineStruct implements StructGutsR {
  +level: uint;
  +arena: ArenaR;
  +segment: SegmentR;
  +layout: StructLayout;

  static fromAny(guts: AnyGutsR): StructGutsR {
    if (guts.layout.tag === "struct") {
      return (guts: any); // eslint-disable-line flowtype/no-weak-types
    } else {
      //TODO: Flow doesn't dig down with this refinement even though it's
      //      unique. Circumvent for now, but try to get it fixed.
      if (guts.layout.tag === "bool list") {
        throw new PointerTypeError(["struct"], "list");
      } else if (guts.layout.tag === "non-bool list") {
        throw new PointerTypeError(["struct"], "list");
      } else {
        (guts.layout.tag: "cap");
        throw new PointerTypeError(["struct"], "capability");
      }
    }
  }

  static empty(arena: ArenaR): StructGutsR {
    return new InlineStruct(0, arena, arena.segment(0), {
      tag: "struct",
      bytes: { data: 0, pointers: 0 },
      dataSection: 0,
      pointersSection: 0,
      end: 0,
    });
  }

  constructor(level: uint, arena: ArenaR, segment: SegmentR, layout: StructLayout) {
    this.level = level;
    this.arena = arena;
    this.segment = segment;
    this.layout = layout;
  }

  getTag(offset: u19): u16 {
    /* If the tag's offset lands out of bounds, then use 0. */
    const position = this.layout.dataSection + offset;
    if (position + 2 <= this.layout.pointersSection) {
      return decodeTag(this.segment.raw, position);
    } else {
      return 0;
    }
  }

  checkTag(fieldTag: u16, offset: u19): void {
    const currentTag = this.getTag(offset);
    if (currentTag !== fieldTag) {
      throw new IncorrectTagError(currentTag, fieldTag);
    }
  }

  pointersWord(offset: u19): null | Word<SegmentR> {
    const position = this.layout.pointersSection + offset;
    if (position < this.layout.end) {
      return {
        segment: this.segment,
        position,
      };
    } else {
      return null;
    }
  }

  set(level: uint, arena: ArenaB, ref: Word<SegmentB>): void {
    this.arena.structCopy(this.layout, this.segment, level, arena, ref);
  }

  setFixedWidth(level: uint, arena: ArenaB, object: Word<SegmentB>, bytes: Bytes): void {
    fixedWidthStructCopy(this.arena, this.layout, this.segment, level, arena, object, bytes);
  }
}

export class RefedStruct extends InlineStruct implements StructGutsR {
  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>, compiledBytes: Bytes): this {
    const p = arena.pointer(ref);
    return new this(level, arena, p.object.segment, arena.specificStructLayout(p, compiledBytes));
  }

  constructor(level: uint, arena: ArenaR, segment: SegmentR, layout: StructLayout) {
    super(level+1, arena, segment, layout);
  }
}
