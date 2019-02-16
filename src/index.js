/* @flow */

import type {
  Bytes,
  NonboolListEncoding,
  StructLayout,
  BoolListLayout,
  NonboolListLayout,
  CapLayout,
} from "@capnp-js/layout";

import type {
  SegmentLookup,
  Pointer,
  Word,
  SegmentR,
  SegmentB,
} from "@capnp-js/memory";

import type { ArenaB } from "@capnp-js/builder-core";

import type { StructGutsR } from "./guts/struct";
import type { BoolListGutsR } from "./guts/boolList";
import type { NonboolListGutsR } from "./guts/nonboolList";
import type { CapGutsR } from "./guts/cap";

type uint = number;
type u29 = number;
type u30 = number;

export type { StructGutsR } from "./guts/struct";
export type { BoolListGutsR } from "./guts/boolList";
export type { NonboolListGutsR } from "./guts/nonboolList";
export type { CapGutsR } from "./guts/cap";

export type AnyGutsR = StructGutsR | BoolListGutsR | NonboolListGutsR | CapGutsR;

export interface ArenaR extends SegmentLookup<SegmentR> {
  pointer(ref: Word<SegmentR>): Pointer<SegmentR>;

  //TODO: Shouldn't I expose a layout method for AnyValue to use, allowing users to interject their own safety mechanics?
  specificStructLayout(p: Pointer<SegmentR>, compiledBytes: Bytes): StructLayout;
  genericStructLayout(p: Pointer<SegmentR>): StructLayout;
  boolListLayout(p: Pointer<SegmentR>): BoolListLayout;
  blobLayout(p: Pointer<SegmentR>): NonboolListLayout;
  specificNonboolListLayout(p: Pointer<SegmentR>, compiledEncoding: NonboolListEncoding): NonboolListLayout;
  genericNonboolListLayout(p: Pointer<SegmentR>): NonboolListLayout;
  capLayout(p: Pointer<SegmentR>): CapLayout;

  /* Copy methods appear on both reader arenas and builder arenas because the
   * data source imposes copying policies. */

  /* For each of the following, copy an object from `segment` with shape
   * `layout` into `targetArena`, and write a pointer to the copied object at
   * `target`. Each method returns the start of the copied object. */
  structCopy(layout: StructLayout, segment: SegmentR, level: uint,
             targetArena: ArenaB, target: Word<SegmentB>): void;
  boolListCopy(layout: BoolListLayout, segment: SegmentR, level: uint,
               targetArena: ArenaB, target: Word<SegmentB>): void;
  nonboolListCopy(layout: NonboolListLayout, segment: SegmentR, level: uint,
                  targetArena: ArenaB, target: Word<SegmentB>): void;
}

export interface CtorR<GUTS: AnyGutsR, R: {+guts: GUTS}> {
  intern(guts: GUTS): R;
  fromAny(guts: AnyGutsR): R;
  deref(level: uint, arena: ArenaR, ref: Word<SegmentR>): R;
  get(level: uint, arena: ArenaR, ref: Word<SegmentR>): null | R;
}

export type WeakStructCtorR<R: {+guts: StructGutsR}> = CtorR<StructGutsR, R>;
export interface StructCtorR<R: {+guts: StructGutsR}> extends CtorR<StructGutsR, R> {
  compiledBytes(): Bytes;
  empty(): R;
}
export type WeakListCtorR<GUTS: BoolListGutsR | NonboolListGutsR, R: {+guts: GUTS}> = CtorR<GUTS, R>;

//TODO: Consider adding an iterator interface to lists.
export interface DataListR<T> {
  +guts: BoolListGutsR | NonboolListGutsR;
  length(): u29 | u30;
  get(index: u29 | u30): T;
  map<U, THIS>(fn: (value: T, index: u29 | u30, list: DataListR<T>) => U, thisArg?: THIS): Array<U>;
  forEach<THIS>(fn: (value: T, index: u29 | u30, list: DataListR<T>) => mixed, thisArg?: THIS): void;
  reduce<U>(fn: (previous: U, current: T, index: u29 | u30, list: DataListR<T>) => U, acc: U): U;
}

export interface StructListR<R: {+guts: StructGutsR}> {
  +guts: NonboolListGutsR;
  length(): u29 | u30;
  get(index: u29 | u30): R;
  map<T, THIS>(fn: (value: R, index: u29 | u30, list: StructListR<R>) => T, thisArg?: THIS): Array<T>;
  forEach<THIS>(fn: (value: R, index: u29 | u30, list: StructListR<R>) => mixed, thisArg?: THIS): void;
  reduce<T>(fn: (previous: T, current: R, index: u29 | u30, list: StructListR<R>) => T, acc: T): T;
}

export type StructListCtorR<R: {+guts: StructGutsR}> = WeakListCtorR<NonboolListGutsR, StructListR<R>>;

export interface ListListR<GUTS: BoolListGutsR | NonboolListGutsR, R: {+guts: GUTS}> {
  +guts: NonboolListGutsR;
  length(): u29 | u30;
  has(index: u29 | u30): boolean; //TODO: Grep for `boolean` and convert to `bool`?
  get(index: u29 | u30): null | R;
  map<T, THIS>(fn: (value: null | R, index: u29 | u30, list: ListListR<GUTS, R>) => T, thisArg?: THIS): Array<T>;
  forEach<THIS>(fn: (value: null | R, index: u29 | u30, list: ListListR<GUTS, R>) => mixed, thisArg?: THIS): void;
  reduce<T>(fn: (previous: T, current: null | R, index: u29 | u30, list: ListListR<GUTS, R>) => T, acc: T): T;
}

export type ListListCtorR<GUTS: BoolListGutsR | NonboolListGutsR, R: {+guts: GUTS}> = WeakListCtorR<NonboolListGutsR, ListListR<GUTS, R>>;

export { AnyValue, StructValue, ListValue, CapValue } from "./value";
export { RefedStruct } from "./guts/struct";
export { RefedBoolList } from "./guts/boolList";
export { RefedNonboolList } from "./guts/nonboolList";
export * from "./list";
export { default as Data } from "./Data";
export { default as Text } from "./Text";
