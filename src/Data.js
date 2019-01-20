/* @flow */

import type { SegmentR, Word } from "@capnp-js/memory";
import type { BytesR } from "@capnp-js/bytes";

import type { ArenaR, AnyGutsR, WeakListCtorR } from "./index";

import type { NonboolListGutsR } from "./guts/nonboolList";

import { isNull } from "@capnp-js/memory";

import { RefedNonboolList } from "./guts/nonboolList";

type uint = number;

export default class Data {
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
    const guts = new RefedNonboolList(level, arena, p.object.segment, layout);
    return new this(guts);
  }

  static get(level: uint, arena: ArenaR, ref: null | Word<SegmentR>): null | this {
    //TODO: Remove RefedNonboolList.getMaybeRef and its analogues, then replace its callers with this logic.
    return ref === null || isNull(ref) ? null : this.deref(level, arena, ref);
  }

  constructor(guts: NonboolListGutsR) {
    this.guts = guts;
  }

  asBytes(): BytesR {
    const end = this.guts.layout.begin + this.guts.layout.length;
    return this.guts.segment.raw.subarray(this.guts.layout.begin, end);
  }
}
(Data: WeakListCtorR<NonboolListGutsR, Data>);
