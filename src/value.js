/* @flow */

import type { SegmentR, Word } from "@capnp-js/memory";

import type { ArenaR, AnyGutsR } from "./index";
import type { CtorR, StructCtorR, WeakListCtorR } from "./index";

import type { StructGutsR } from "./guts/struct";
import type { BoolListGutsR } from "./guts/boolList";
import type { NonboolListGutsR } from "./guts/nonboolList";
import type { CapGutsR } from "./guts/cap";

import { PointerTypeError } from "@capnp-js/internal-error";
import { isNull } from "@capnp-js/memory";
import { u3_mask } from "@capnp-js/tiny-uint";

import { RefedStruct } from "./guts/struct";
import { RefedBoolList } from "./guts/boolList";
import { RefedNonboolList } from "./guts/nonboolList";
import { Cap } from "./guts/cap";

type uint = number;

export class AnyValue {
  +guts: AnyGutsR;

  static intern(guts: AnyGutsR): this {
    return new this(guts);
  }

  static fromAny(guts: AnyGutsR): this {
    return new this(guts);
  }

  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
    const p = arena.pointer(ref);
    switch (p.typeBits) {
    case 0x00:
      const struct = new RefedStruct(level, arena, p.object.segment, arena.genericStructLayout(p));
      return new this(struct);
    case 0x01:
      const listTypeBits = u3_mask(p.hi, 0x07);
      if (listTypeBits === 0x01) {
        const bool = new RefedBoolList(level, arena, p.object.segment, arena.boolListLayout(p));
        return new this(bool);
      } else {
        const nonbool = new RefedNonboolList(level, arena, p.object.segment, arena.genericNonboolListLayout(p));
        return new this(nonbool);
      }
    default:
      (p.typeBits: 0x03);
      const cap = new Cap(arena.capLayout(p));
      return new this(cap);
    }
  }

  static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
    return isNull(ref) ? null : this.deref(level, arena, ref);
  }

  constructor(guts: AnyGutsR) {
    this.guts = guts;
  }

  getAs<GUTS: AnyGutsR, R: {+guts: GUTS}>(Ctor: CtorR<GUTS, R>): R {
    return Ctor.fromAny(this.guts);
  }
}
(AnyValue: CtorR<AnyGutsR, AnyValue>);

export class StructValue {
  +guts: StructGutsR;

  static intern(guts: StructGutsR): this {
    return new this(guts);
  }

  static fromAny(guts: AnyGutsR): this {
    return new this(RefedStruct.fromAny(guts));
  }

  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
    const p = arena.pointer(ref);
    const guts = new RefedStruct(level, arena, p.object.segment, arena.genericStructLayout(p));
    return new this(guts);
  }

  static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
    return isNull(ref) ? null : this.deref(level, arena, ref);
  }

  constructor(guts: StructGutsR) {
    this.guts = guts;
  }

  getAs<R: {+guts: StructGutsR}>(Ctor: StructCtorR<R>): R {
    return Ctor.intern(this.guts);
  }
}
(StructValue: CtorR<StructGutsR, StructValue>);

export class ListValue {
  +guts: BoolListGutsR | NonboolListGutsR;

  static intern(guts: BoolListGutsR | NonboolListGutsR): this {
    return new this(guts);
  }

  static fromAny(guts: AnyGutsR): this {
    if (guts.layout.tag === "bool list" || guts.layout.tag === "non-bool list") {
      return new this((guts: any)); // eslint-disable-line flowtype/no-weak-types
    } else {
      if (guts.layout.tag === "struct") {
         //TODO: This stretches the UnexpectedPointerType name. UnexpectedType works.
        throw new PointerTypeError(["list"], "struct");
      } else {
        //TODO: This stretches the UnexpectedPointerType name. UnexpectedType works.
        //TODO: Flow refinement needs to dig down to make this work:
        //(guts.layout.tag: "capability");
        throw new PointerTypeError(["list"], "capability");
      }
    }
  }

  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
    const p = arena.pointer(ref);
    const listTypeBits = u3_mask(p.hi, 0x07);
    if (listTypeBits === 0x01) {
      const guts = new RefedBoolList(level, arena, p.object.segment, arena.boolListLayout(p));
      return new this(guts);
    } else {
      const guts = new RefedNonboolList(level, arena, p.object.segment, arena.genericNonboolListLayout(p));
      return new this(guts);
    }
  }

  static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
    return isNull(ref) ? null : this.deref(level, arena, ref);
  }

  constructor(guts: BoolListGutsR | NonboolListGutsR) {
    this.guts = guts;
  }

  getAs<GUTS: BoolListGutsR | NonboolListGutsR, R: {+guts: GUTS}>(Ctor: WeakListCtorR<GUTS, R>): R {
    return Ctor.fromAny(this.guts);
  }
}
//TODO: Why isn't this WeakCtorR instead of CtorR. I think that I quit trying to forbid construction of ListValues, but didn't clean up the types that were intended to prevent it. Consider renaming "WeakListCtorR" to "ListCtorR".
(ListValue: CtorR<BoolListGutsR | NonboolListGutsR, ListValue>);

export class CapValue {
  +guts: CapGutsR;

  static intern(guts: CapGutsR): this {
    return new this(guts);
  }

  static fromAny(guts: AnyGutsR): this {
    return new this(Cap.fromAny(guts));
  }

  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
    const p = arena.pointer(ref);
    const cap = new Cap(arena.capLayout(p));
    return new this(cap);
  }

  static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
    return isNull(ref) ? null : this.deref(level, arena, ref);
  }

  constructor(guts: CapGutsR) {
    this.guts = guts;
  }
}
(CapValue: CtorR<CapGutsR, CapValue>);
