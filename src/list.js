/* @flow */

import type { Int64 } from "@capnp-js/int64";
import type { UInt64 } from "@capnp-js/uint64";

import type { SegmentR, Word } from "@capnp-js/memory";

import type {
  ArenaR,
  AnyGutsR,
  StructCtorR,
  WeakListCtorR,
  PointerElementCtorR,
  DataListR,
  StructListCtorR,
  PointerListCtorR,
  StructListR,
  PointerListR,
} from "./index";

import type { StructGutsR } from "./guts/struct";
import type { BoolListGutsR } from "./guts/boolList";
import type { NonboolListGutsR } from "./guts/nonboolList";
import type { CapGutsR } from "./guts/cap";

import * as decode from "@capnp-js/read-data";
import { inject as injectI64 } from "@capnp-js/int64";
import { inject as injectU64 } from "@capnp-js/uint64";

import { isNull } from "@capnp-js/memory";
import { listEncodings } from "@capnp-js/layout";
import { u3_mask } from "@capnp-js/tiny-uint";

import { RefedBoolList } from "./guts/boolList";
import { RefedNonboolList } from "./guts/nonboolList";

type uint = number;
type u29 = number;
type u30 = number;

export function structs<R: {+guts: StructGutsR}>(Element: StructCtorR<R>): StructListCtorR<R> {
  const compiledEncoding = {
    flag: 0x07,
    bytes: Element.compiledBytes(),
  };

  return class Structs implements StructListR<R> {
    +guts: NonboolListGutsR;

    static intern(guts: NonboolListGutsR): this {
      return new this(guts);
    }

    static fromAny(guts: AnyGutsR): this {
      return new this(RefedNonboolList.narrow(guts));
    }

    static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
      const guts = RefedNonboolList.deref(level, arena, ref, compiledEncoding);
      return new this(guts);
    }

    static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
      return isNull(ref) ? null : this.deref(level, arena, ref);
    }

    constructor(guts: NonboolListGutsR) {
      this.guts = guts;
    }

    length(): u29 | u30 {
      return this.guts.layout.length;
    }

    get(index: u29 | u30): R {
      if (index < 0 || this.guts.layout.length <= index) {
        throw new RangeError();
      }

      const stride = this.guts.stride();
      const dataSection = this.guts.layout.begin + index * stride;
      const guts = this.guts.inlineStruct(dataSection, dataSection + stride);
      return Element.intern(guts);
    }

    map<T, THIS>(fn: (value: R, index: u29 | u30, list: this) => T, thisArg?: THIS): Array<T> {
      let arr = [];
      const stride = this.guts.stride();
      for (let i=0, dataSection=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                                   dataSection+=stride) {
        const guts = this.guts.inlineStruct(dataSection, dataSection + stride);
        arr.push(fn.call(thisArg, Element.intern(guts), i, this));
      }

      return arr;
    }

    forEach<THIS>(fn: (value: R, index: u29 | u30, list: this) => mixed, thisArg?: THIS): void {
      const stride = this.guts.stride();
      for (let i=0, dataSection=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                                   dataSection+=stride) {
        const guts = this.guts.inlineStruct(dataSection, dataSection + stride);
        fn.call(thisArg, Element.intern(guts), i, this);
      }
    }

    reduce<T>(fn: (previous: T, current: R, index: u29 | u30, list: this) => T, acc: T): T {
      const stride = this.guts.stride();
      for (let i=0, dataSection=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                                   dataSection+=stride) {
        const guts = this.guts.inlineStruct(dataSection, dataSection + stride);
        acc = fn(acc, Element.intern(guts), i, this);
      }

      return acc;
    }
  };
}

export function pointers<GUTS: BoolListGutsR | NonboolListGutsR | CapGutsR, R: {+guts: GUTS}>(Element: PointerElementCtorR<GUTS, R>): PointerListCtorR<GUTS, R> {
  return class Pointers implements PointerListR<GUTS, R> {
    +guts: NonboolListGutsR;

    static intern(guts: NonboolListGutsR): this {
      return new this(guts);
    }

    static fromAny(guts: AnyGutsR): this {
      return new this(RefedNonboolList.narrow(guts));
    }

    static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
      const guts = RefedNonboolList.deref(level, arena, ref, listEncodings[0x06]);
      return new this(guts);
    }

    static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
      return isNull(ref) ? null : this.deref(level, arena, ref);
    }

    constructor(guts: NonboolListGutsR) {
      this.guts = guts;
    }

    length(): u29 | u30 {
      return this.guts.layout.length;
    }

    get(index: u29 | u30): null | R {
      if (index < 0 || this.guts.layout.length <= index) {
        throw new RangeError();
      }

      const ref = {
        segment: this.guts.segment,
        position: this.guts.pointersBegin() + index * this.guts.stride(),
      };

      return Element.get(this.guts.level, this.guts.arena, ref);
    }

    map<T, THIS>(fn: (value: null | R, index: u29 | u30, list: this) => T, thisArg?: THIS): Array<T> {
      let arr = [];
      const ref = {
        segment: this.guts.segment,
        position: this.guts.pointersBegin(),
      };
      const stride = this.guts.stride();
      for (let i=0; i<this.guts.layout.length; ++i,
                                               ref.position+=stride) {
        const element = Element.get(this.guts.level, this.guts.arena, ref);
        arr.push(fn.call(thisArg, element, i, this));
      }

      return arr;
    }

    forEach<THIS>(fn: (value: null | R, index: u29 | u30, list: this) => mixed, thisArg?: THIS): void {
      const ref = {
        segment: this.guts.segment,
        position: this.guts.pointersBegin(),
      };
      const stride = this.guts.stride();
      for (let i=0; i<this.guts.layout.length; ++i,
                                               ref.position+=stride) {
        const element = Element.get(this.guts.level, this.guts.arena, ref);
        fn.call(thisArg, element, i, this);
      }
    }

    reduce<T>(fn: (previous: T, current: null | R, index: u29 | u30, list: this) => T, acc: T): T {
      const ref = {
        segment: this.guts.segment,
        position: this.guts.pointersBegin(),
      };
      const stride = this.guts.stride();
      for (let i=0; i<this.guts.layout.length; ++i,
                                               ref.position+=stride) {
        const element = Element.get(this.guts.level, this.guts.arena, ref);
        acc = fn(acc, element, i, this);
      }

      return acc;
    }
  };
}

export class VoidList implements DataListR<void> {
  +guts: NonboolListGutsR;

  static intern(guts: NonboolListGutsR): this {
    return new this(guts);
  }

  static fromAny(guts: AnyGutsR): this {
    return new this(RefedNonboolList.narrow(guts));
  }

  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
    const guts = RefedNonboolList.deref(level, arena, ref, listEncodings[0x00]);
    return new this(guts);
  }

  static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
    return isNull(ref) ? null : this.deref(level, arena, ref);
  }

  constructor(guts: NonboolListGutsR) {
    this.guts = guts;
  }

  length(): u29 | u30 {
    return this.guts.layout.length;
  }

  get(index: u29 | u30): void {
    if (index < 0 || this.guts.layout.length <= index) {
      throw new RangeError();
    }
  }

  map<T, THIS>(fn: (value: void, index: u29 | u30, list: this) => T, thisArg?: THIS): Array<T> {
    let arr = [];
    for (let i=0; i<this.guts.layout.length; ++i) {
      arr.push(fn.call(thisArg, undefined, i, this));
    }

    return arr;
  }

  forEach<THIS>(fn: (value: void, index: u29 | u30, list: this) => mixed, thisArg?: THIS): void {
    for (let i=0; i<this.guts.layout.length; ++i) {
      fn.call(thisArg, undefined, i, this);
    }
  }

  reduce<T>(fn: (previous: T, current: void, index: u29 | u30, list: this) => T, acc: T): T {
    for (let i=0; i<this.guts.layout.length; ++i) {
      acc = fn(acc, undefined, i, this);
    }

    return acc;
  }
}
(VoidList: WeakListCtorR<NonboolListGutsR, VoidList>);

export class BoolList implements DataListR<boolean> {
  +guts: BoolListGutsR;

  static intern(guts: BoolListGutsR): this {
    return new this(guts);
  }

  static fromAny(guts: AnyGutsR): this {
    return new this(RefedBoolList.narrow(guts));
  }

  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
    const guts = RefedBoolList.deref(level, arena, ref);
    return new this(guts);
  }

  static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
    return isNull(ref) ? null : this.deref(level, arena, ref);
  }

  constructor(guts: BoolListGutsR) {
    this.guts = guts;
  }

  length(): u29 {
    return this.guts.layout.length;
  }

  get(index: u29): boolean {
    if (index < 0 || this.guts.layout.length <= index) {
      throw new RangeError();
    }

    return !!decode.bit(this.guts.segment.raw, this.guts.layout.begin + (index>>>3), u3_mask(index, 0x07));
  }

  map<T, THIS>(fn: (value: boolean, index: u29, list: this) => T, thisArg?: THIS): Array<T> {
    let arr = [];
    for (let index=0; index<this.guts.layout.length; ++index) {
      const b = !!decode.bit(this.guts.segment.raw, this.guts.layout.begin + (index>>>3), u3_mask(index, 0x07));
      arr.push(fn.call(thisArg, b, index, this));
    }

    return arr;
  }

  forEach<THIS>(fn: (value: boolean, index: u29, list: this) => mixed, thisArg?: THIS): void {
    for (let index=0; index<this.guts.layout.length; ++index) {
      const b = !!decode.bit(this.guts.segment.raw, this.guts.layout.begin + (index>>>3), u3_mask(index, 0x07));
      fn.call(thisArg, b, index, this);
    }
  }

  reduce<T>(fn: (previous: T, current: boolean, index: u29, list: this) => T, acc: T): T {
    for (let index=0; index<this.guts.layout.length; ++index) {
      const b = !!decode.bit(this.guts.segment.raw, this.guts.layout.begin + (index>>>3), u3_mask(index, 0x07));
      acc = fn(acc, b, index, this);
    }

    return acc;
  }
}
(BoolList: WeakListCtorR<BoolListGutsR, BoolList>);

type i8 = number;

export class Int8List implements DataListR<i8> {
  +guts: NonboolListGutsR;

  static intern(guts: NonboolListGutsR): this {
    return new this(guts);
  }

  static fromAny(guts: AnyGutsR): this {
    return new this(RefedNonboolList.narrow(guts));
  }

  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
    //TODO: Why no analog to `derefSubword` and `derefInline` on `RefedNonboolList`?
    const guts = RefedNonboolList.deref(level, arena, ref, listEncodings[0x02]);
    return new this(guts);
  }

  static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
    return isNull(ref) ? null : this.deref(level, arena, ref);
  }

  constructor(guts: NonboolListGutsR) {
    this.guts = guts;
  }

  length(): u29 | u30 {
    return this.guts.layout.length;
  }

  get(index: u29 | u30): i8 {
    if (index < 0 || this.guts.layout.length <= index) {
      throw new RangeError();
    }

    return decode.int8(this.guts.segment.raw, this.guts.layout.begin + index * this.guts.stride());
  }

  map<T, THIS>(fn: (value: i8, index: u29 | u30, list: this) => T, thisArg?: THIS): Array<T> {
    let arr = [];
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      arr.push(fn.call(thisArg, decode.int8(this.guts.segment.raw, p), i, this));
    }

    return arr;
  }

  forEach<THIS>(fn: (value: i8, index: u29 | u30, list: this) => mixed, thisArg?: THIS): void {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      fn.call(thisArg, decode.int8(this.guts.segment.raw, p), i, this);
    }
  }

  reduce<T>(fn: (previous: T, current: i8, index: u29 | u30, list: this) => T, acc: T): T {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      acc = fn(acc, decode.int8(this.guts.segment.raw, p), i, this);
    }

    return acc;
  }
}
(Int8List: WeakListCtorR<NonboolListGutsR, Int8List>);

type i16 = number;

export class Int16List implements DataListR<i16> {
  +guts: NonboolListGutsR;

  static intern(guts: NonboolListGutsR): this {
    return new this(guts);
  }

  static fromAny(guts: AnyGutsR): this {
    return new this(RefedNonboolList.narrow(guts));
  }

  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
    const guts = RefedNonboolList.deref(level, arena, ref, listEncodings[0x03]);
    return new this(guts);
  }

  static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
    return isNull(ref) ? null : this.deref(level, arena, ref);
  }

  constructor(guts: NonboolListGutsR) {
    this.guts = guts;
  }

  length(): u29 | u30 {
    return this.guts.layout.length;
  }

  get(index: u29 | u30): i16 {
    if (index < 0 || this.guts.layout.length <= index) {
      throw new RangeError();
    }

    return decode.int16(this.guts.segment.raw, this.guts.layout.begin + index * this.guts.stride());
  }

  map<T, THIS>(fn: (value: i16, index: u29 | u30, list: this) => T, thisArg?: THIS): Array<T> {
    let arr = [];
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      arr.push(fn.call(thisArg, decode.int16(this.guts.segment.raw, p), i, this));
    }

    return arr;
  }

  forEach<THIS>(fn: (value: i16, index: u29 | u30, list: this) => mixed, thisArg?: THIS): void {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      fn.call(thisArg, decode.int16(this.guts.segment.raw, p), i, this);
    }
  }

  reduce<T>(fn: (previous: T, current: i16, index: u29 | u30, list: this) => T, acc: T): T {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      acc = fn(acc, decode.int16(this.guts.segment.raw, p), i, this);
    }

    return acc;
  }
}
(Int16List: WeakListCtorR<NonboolListGutsR, Int16List>);

type i32 = number;

export class Int32List implements DataListR<i32> {
  +guts: NonboolListGutsR;

  static intern(guts: NonboolListGutsR): this {
    return new this(guts);
  }

  static fromAny(guts: AnyGutsR): this {
    return new this(RefedNonboolList.narrow(guts));
  }

  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
    const guts = RefedNonboolList.deref(level, arena, ref, listEncodings[0x04]);
    return new this(guts);
  }

  static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
    return isNull(ref) ? null : this.deref(level, arena, ref);
  }

  constructor(guts: NonboolListGutsR) {
    this.guts = guts;
  }

  length(): u29 | u30 {
    return this.guts.layout.length;
  }

  get(index: u29 | u30): i32 {
    if (index < 0 || this.guts.layout.length <= index) {
      throw new RangeError();
    }

    return decode.int32(this.guts.segment.raw, this.guts.layout.begin + index * this.guts.stride());
  }

  map<T, THIS>(fn: (value: i32, index: u29 | u30, list: this) => T, thisArg?: THIS): Array<T> {
    let arr = [];
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      arr.push(fn.call(thisArg, decode.int32(this.guts.segment.raw, p), i, this));
    }

    return arr;
  }

  forEach<THIS>(fn: (value: i32, index: u29 | u30, list: this) => mixed, thisArg?: THIS): void {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      fn.call(thisArg, decode.int32(this.guts.segment.raw, p), i, this);
    }
  }

  reduce<T>(fn: (previous: T, current: i32, index: u29 | u30, list: this) => T, acc: T): T {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      acc = fn(acc, decode.int32(this.guts.segment.raw, p), i, this);
    }

    return acc;
  }
}
(Int32List: WeakListCtorR<NonboolListGutsR, Int32List>);

export class Int64List implements DataListR<Int64> {
  +guts: NonboolListGutsR;

  static intern(guts: NonboolListGutsR): this {
    return new this(guts);
  }

  static fromAny(guts: AnyGutsR): this {
    return new this(RefedNonboolList.narrow(guts));
  }

  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
    const guts = RefedNonboolList.deref(level, arena, ref, listEncodings[0x05]);
    return new this(guts);
  }

  static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
    return isNull(ref) ? null : this.deref(level, arena, ref);
  }

  constructor(guts: NonboolListGutsR) {
    this.guts = guts;
  }

  length(): u29 | u30 {
    return this.guts.layout.length;
  }

  get(index: u29 | u30): Int64 {
    if (index < 0 || this.guts.layout.length <= index) {
      throw new RangeError();
    }

    const p = this.guts.layout.begin + index * this.guts.stride();
    return injectI64(
      decode.int32(this.guts.segment.raw, p+4),
      decode.int32(this.guts.segment.raw, p),
    );
  }

  map<T, THIS>(fn: (value: Int64, index: u29 | u30, list: this) => T, thisArg?: THIS): Array<T> {
    let arr = [];
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      const value = injectI64(
        decode.int32(this.guts.segment.raw, p+4),
        decode.int32(this.guts.segment.raw, p),
      );
      arr.push(fn.call(thisArg, value, i, this));
    }

    return arr;
  }

  forEach<THIS>(fn: (value: Int64, index: u29 | u30, list: this) => mixed, thisArg?: THIS): void {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      const value = injectI64(
        decode.int32(this.guts.segment.raw, p+4),
        decode.int32(this.guts.segment.raw, p),
      );
      fn.call(thisArg, value, i, this);
    }
  }

  reduce<T>(fn: (previous: T, current: Int64, index: u29 | u30, list: this) => T, acc: T): T {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      const current = injectI64(
        decode.int32(this.guts.segment.raw, p+4),
        decode.int32(this.guts.segment.raw, p),
      );
      acc = fn(acc, current, i, this);
    }

    return acc;
  }
}
(Int64List: WeakListCtorR<NonboolListGutsR, Int64List>);

type u8 = number;

export class UInt8List implements DataListR<u8> {
  +guts: NonboolListGutsR;

  static intern(guts: NonboolListGutsR): this {
    return new this(guts);
  }

  static fromAny(guts: AnyGutsR): this {
    return new this(RefedNonboolList.narrow(guts));
  }

  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
    const guts = RefedNonboolList.deref(level, arena, ref, listEncodings[0x02]);
    return new this(guts);
  }

  static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
    return isNull(ref) ? null : this.deref(level, arena, ref);
  }

  constructor(guts: NonboolListGutsR) {
    this.guts = guts;
  }

  length(): u29 | u30 {
    return this.guts.layout.length;
  }

  get(index: u29 | u30): u8 {
    if (index < 0 || this.guts.layout.length <= index) {
      throw new RangeError();
    }

    return decode.uint8(this.guts.segment.raw, this.guts.layout.begin + index * this.guts.stride());
  }

  map<T, THIS>(fn: (value: u8, index: u29 | u30, list: this) => T, thisArg?: THIS): Array<T> {
    let arr = [];
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      arr.push(fn.call(thisArg, decode.uint8(this.guts.segment.raw, p), i, this));
    }

    return arr;
  }

  forEach<THIS>(fn: (value: u8, index: u29 | u30, list: this) => mixed, thisArg?: THIS): void {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      fn.call(thisArg, decode.uint8(this.guts.segment.raw, p), i, this);
    }
  }

  reduce<T>(fn: (previous: T, current: u8, index: u29 | u30, list: this) => T, acc: T): T {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      acc = fn(acc, decode.uint8(this.guts.segment.raw, p), i, this);
    }

    return acc;
  }
}
(UInt8List: WeakListCtorR<NonboolListGutsR, UInt8List>);

type u16 = number;

export class UInt16List implements DataListR<u16> {
  +guts: NonboolListGutsR;

  static intern(guts: NonboolListGutsR): this {
    return new this(guts);
  }

  static fromAny(guts: AnyGutsR): this {
    return new this(RefedNonboolList.narrow(guts));
  }

  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
    const guts = RefedNonboolList.deref(level, arena, ref, listEncodings[0x03]);
    return new this(guts);
  }

  static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
    return isNull(ref) ? null : this.deref(level, arena, ref);
  }

  constructor(guts: NonboolListGutsR) {
    this.guts = guts;
  }

  length(): u29 | u30 {
    return this.guts.layout.length;
  }

  get(index: u29 | u30): u16 {
    if (index < 0 || this.guts.layout.length <= index) {
      throw new RangeError();
    }

    return decode.uint16(this.guts.segment.raw, this.guts.layout.begin + index * this.guts.stride());
  }

  map<T, THIS>(fn: (value: u16, index: u29 | u30, list: this) => T, thisArg?: THIS): Array<T> {
    let arr = [];
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      arr.push(fn.call(thisArg, decode.uint16(this.guts.segment.raw, p), i, this));
    }

    return arr;
  }

  forEach<THIS>(fn: (value: u16, index: u29 | u30, list: this) => mixed, thisArg?: THIS): void {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      fn.call(thisArg, decode.uint16(this.guts.segment.raw, p), i, this);
    }
  }

  reduce<T>(fn: (previous: T, current: u16, index: u29 | u30, list: this) => T, acc: T): T {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      acc = fn(acc, decode.uint16(this.guts.segment.raw, p), i, this);
    }

    return acc;
  }
}
(UInt16List: WeakListCtorR<NonboolListGutsR, UInt16List>);

type u32 = number;

export class UInt32List implements DataListR<u32> {
  +guts: NonboolListGutsR;

  static intern(guts: NonboolListGutsR): this {
    return new this(guts);
  }

  static fromAny(guts: AnyGutsR): this {
    return new this(RefedNonboolList.narrow(guts));
  }

  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
    const guts = RefedNonboolList.deref(level, arena, ref, listEncodings[0x04]);
    return new this(guts);
  }

  static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
    return isNull(ref) ? null : this.deref(level, arena, ref);
  }

  constructor(guts: NonboolListGutsR) {
    this.guts = guts;
  }

  length(): u29 | u30 {
    return this.guts.layout.length;
  }

  get(index: u29 | u30): u32 {
    if (index < 0 || this.guts.layout.length <= index) {
      throw new RangeError();
    }

    return decode.int32(this.guts.segment.raw, this.guts.layout.begin + index * this.guts.stride()) >>> 0;
  }

  map<T, THIS>(fn: (value: u32, index: u29 | u30, list: this) => T, thisArg?: THIS): Array<T> {
    let arr = [];
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      arr.push(fn.call(thisArg, decode.int32(this.guts.segment.raw, p) >>> 0, i, this));
    }

    return arr;
  }

  forEach<THIS>(fn: (value: u32, index: u29 | u30, list: this) => mixed, thisArg?: THIS): void {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      fn.call(thisArg, decode.int32(this.guts.segment.raw, p) >>> 0, i, this);
    }
  }

  reduce<T>(fn: (previous: T, current: u32, index: u29 | u30, list: this) => T, acc: T): T {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      acc = fn(acc, decode.int32(this.guts.segment.raw, p) >>> 0, i, this);
    }

    return acc;
  }
}
(UInt32List: WeakListCtorR<NonboolListGutsR, UInt32List>);

export class UInt64List implements DataListR<UInt64> {
  +guts: NonboolListGutsR;

  static intern(guts: NonboolListGutsR): this {
    return new this(guts);
  }

  static fromAny(guts: AnyGutsR): this {
    return new this(RefedNonboolList.narrow(guts));
  }

  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
    const guts = RefedNonboolList.deref(level, arena, ref, listEncodings[0x05]);
    return new this(guts);
  }

  static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
    return isNull(ref) ? null : this.deref(level, arena, ref);
  }

  constructor(guts: NonboolListGutsR) {
    this.guts = guts;
  }

  length(): u29 | u30 {
    return this.guts.layout.length;
  }

  get(index: u29 | u30): UInt64 {
    if (index < 0 || this.guts.layout.length <= index) {
      throw new RangeError();
    }

    const p = this.guts.layout.begin + index * this.guts.stride();
    return injectU64(
      decode.int32(this.guts.segment.raw, p+4),
      decode.int32(this.guts.segment.raw, p),
    );
  }

  map<T, THIS>(fn: (value: UInt64, index: u29 | u30, list: this) => T, thisArg?: THIS): Array<T> {
    let arr = [];
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      const value = injectU64(
        decode.int32(this.guts.segment.raw, p+4),
        decode.int32(this.guts.segment.raw, p),
      );
      arr.push(fn.call(thisArg, value, i, this));
    }

    return arr;
  }

  forEach<THIS>(fn: (value: UInt64, index: u29 | u30, list: this) => mixed, thisArg?: THIS): void {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      const value = injectU64(
        decode.int32(this.guts.segment.raw, p+4),
        decode.int32(this.guts.segment.raw, p),
      );
      fn.call(thisArg, value, i, this);
    }
  }

  reduce<T>(fn: (previous: T, current: UInt64, index: u29 | u30, list: this) => T, acc: T): T {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      const current = injectU64(
        decode.int32(this.guts.segment.raw, p+4),
        decode.int32(this.guts.segment.raw, p),
      );
      acc = fn(acc, current, i, this);
    }

    return acc;
  }
}
(UInt64List: WeakListCtorR<NonboolListGutsR, UInt64List>);

type f32 = number;

export class Float32List implements DataListR<f32> {
  +guts: NonboolListGutsR;

  static intern(guts: NonboolListGutsR): this {
    return new this(guts);
  }

  static fromAny(guts: AnyGutsR): this {
    return new this(RefedNonboolList.narrow(guts));
  }

  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
    const guts = RefedNonboolList.deref(level, arena, ref, listEncodings[0x04]);
    return new this(guts);
  }

  static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
    return isNull(ref) ? null : this.deref(level, arena, ref);
  }

  constructor(guts: NonboolListGutsR) {
    this.guts = guts;
  }

  length(): u29 | u30 {
    return this.guts.layout.length;
  }

  get(index: u29 | u30): f32 {
    if (index < 0 || this.guts.layout.length <= index) {
      throw new RangeError();
    }

    const bytes = decode.int32(this.guts.segment.raw, this.guts.layout.begin + index * this.guts.stride());
    return decode.float32(bytes);
  }

  map<T, THIS>(fn: (value: f32, index: u29 | u30, list: this) => T, thisArg?: THIS): Array<T> {
    let arr = [];
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      arr.push(fn.call(thisArg, decode.float32(decode.int32(this.guts.segment.raw, p)), i, this));
    }

    return arr;
  }

  forEach<THIS>(fn: (value: f32, index: u29 | u30, list: this) => mixed, thisArg?: THIS): void {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      fn.call(thisArg, decode.float32(decode.int32(this.guts.segment.raw, p)), i, this);
    }
  }

  reduce<T>(fn: (previous: T, current: f32, index: u29 | u30, list: this) => T, acc: T): T {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      acc = fn(acc, decode.float32(decode.int32(this.guts.segment.raw, p)), i, this);
    }

    return acc;
  }
}
(Float32List: WeakListCtorR<NonboolListGutsR, Float32List>);

type f64 = number;

export class Float64List implements DataListR<f64> {
  +guts: NonboolListGutsR;

  static intern(guts: NonboolListGutsR): this {
    return new this(guts);
  }

  static fromAny(guts: AnyGutsR): this {
    return new this(RefedNonboolList.narrow(guts));
  }

  static deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): this {
    const guts = RefedNonboolList.deref(level, arena, ref, listEncodings[0x05]);
    return new this(guts);
  }

  static get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | this {
    return isNull(ref) ? null : this.deref(level, arena, ref);
  }

  constructor(guts: NonboolListGutsR) {
    this.guts = guts;
  }

  length(): u29 | u30 {
    return this.guts.layout.length;
  }

  get(index: u29 | u30): f64 {
    if (index < 0 || this.guts.layout.length <= index) {
      throw new RangeError();
    }

    const p = this.guts.layout.begin + index * this.guts.stride();
    const bytes = injectI64(
      decode.int32(this.guts.segment.raw, p+4),
      decode.int32(this.guts.segment.raw, p),
    );

    return decode.float64(bytes);
  }

  map<T, THIS>(fn: (value: f64, index: u29 | u30, list: this) => T, thisArg?: THIS): Array<T> {
    let arr = [];
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      const bytes = injectI64(
        decode.int32(this.guts.segment.raw, p+4),
        decode.int32(this.guts.segment.raw, p),
      );
      const value = decode.float64(bytes);
      arr.push(fn.call(thisArg, value, i, this));
    }

    return arr;
  }

  forEach<THIS>(fn: (value: f64, index: u29 | u30, list: this) => mixed, thisArg?: THIS): void {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      const bytes = injectI64(
        decode.int32(this.guts.segment.raw, p+4),
        decode.int32(this.guts.segment.raw, p),
      );
      const value = decode.float64(bytes);
      fn.call(thisArg, value, i, this);
    }
  }

  reduce<T>(fn: (previous: T, current: f64, index: u29 | u30, list: this) => T, acc: T): T {
    const stride = this.guts.stride();
    for (let i=0, p=this.guts.layout.begin; i<this.guts.layout.length; ++i,
                                                                       p+=stride) {
      const bytes = injectI64(
        decode.int32(this.guts.segment.raw, p+4),
        decode.int32(this.guts.segment.raw, p),
      );
      const current = decode.float64(bytes);
      acc = fn(acc, current, i, this);
    }

    return acc;
  }
}
(Float64List: WeakListCtorR<NonboolListGutsR, Float64List>);
