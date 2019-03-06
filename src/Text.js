/* @flow */

import type { BytesR } from "@capnp-js/bytes";
import type { SegmentR, Word } from "@capnp-js/memory";

import type { ArenaR, AnyGutsR, WeakListCtorR } from "./index";

import type { NonboolListGutsR } from "./guts/nonboolList";

import { getSubarray } from "@capnp-js/bytes";
import { isNull } from "@capnp-js/memory";
import { decode } from "@capnp-js/utf8";

import { RefedNonboolList } from "./guts/nonboolList";

type uint = number;

export default class Text {
  +guts: NonboolListGutsR;

  static intern(guts: NonboolListGutsR): this {
    return new this(guts);
  }

  static fromAny(guts: AnyGutsR): this {
    return new this(RefedNonboolList.narrow(guts));
  }

  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
    const p = arena.pointer(ref);
    const layout = arena.blobLayout(p);
    if (layout.length === 0) {
      throw {}; //TODO: Proper error message
                //TODO: Shouldn't I be imposing on arena.blobLayout to reject strings that lack a null terminus?
    } else {
      const guts = new RefedNonboolList(level, arena, p.object.segment, layout);
      return new this(guts);
    }
  }

  static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
    return isNull(ref) ? null : this.deref(level, arena, ref);
  }

  constructor(guts: NonboolListGutsR) {
    this.guts = guts;
  }

  asBytesNull(): BytesR {
    const end = this.guts.layout.begin + this.guts.layout.length;
    return getSubarray(this.guts.layout.begin, end, this.guts.segment.raw);
  }

  asBytes(): BytesR {
    const end = this.guts.layout.begin + this.guts.layout.length;
    return getSubarray(this.guts.layout.begin, end-1, this.guts.segment.raw);
  }

  toString(): string {
    const utf8 = decode(this.asBytes());
    if (utf8 instanceof Error) {
      throw utf8;
    }

    return utf8;
  }
}
(Text: WeakListCtorR<NonboolListGutsR, Text>);
