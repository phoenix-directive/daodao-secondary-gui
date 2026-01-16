import { find, findLast, flatMap, sumBy } from "lodash-es";

import { getDecimalInfo } from "@/hooks/helpers/asset-helpers";
import { notEmpty, selectMany, toNumb } from "@/hooks/helpers/helpers";
import { LcdEvent } from "./terra-tx.model";

interface ChainEvent {
  type: string;
  attributes: EventAttribute[];
}

export interface SwapInfo {
  offer_asset: string;
  ask_asset: string;
  offer_amount: number;
  return_amount: number;
  spread_amount: number;
  commission_amount: number;
}

class EventAttribute {
  constructor(public key: string, public value: string) {}

  public static fromBase64(key: string, value: string) {
    return new EventAttribute(
      Buffer.from(key, "base64").toString(),
      value && Buffer.from(value, "base64").toString()
    );
  }

  public static fromBytes(key: Uint8Array, value: Uint8Array) {
    return new EventAttribute(
      new TextDecoder().decode(key),
      new TextDecoder().decode(value)
    );
  }

  public static fromByteValues(key: string, value: string) {
    return new EventAttribute(
      key,
      new TextDecoder().decode(value as unknown as Uint8Array)
    );
  }

  toString() {
    return this.key + "=" + this.value;
  }
}

export class ChainEventsReader {
  log(context?: string) {
    console.groupCollapsed(`Simulation Events ${context}`);
    console.log(JSON.stringify(this.events));
    console.log(this.events);
    console.groupEnd();
  }

  public static fromClearTxsLogs(events: LcdEvent[]) {
    return new ChainEventsReader(
      events.map((ev) => ({
        type: ev.type,
        attributes: ev.attributes.map(
          (attribute) => new EventAttribute(attribute.key, attribute.value)
        ),
      }))
    );
  }

  constructor(public events: ChainEvent[]) {}

  last(type: string, attribute: string) {
    const attributes = findLast(
      this.events,
      (a) => a.type === type
    )?.attributes;
    return findLast(attributes, (a) => a.key === attribute)?.value ?? "";
  }

  getAttributeValues(prop: string, texts: string[] = []) {
    return flatMap(this.events, (event) =>
      flatMap(event.attributes.filter((attribute) => attribute.key === prop))
    )
      .map((a, index) => {
        const text = texts[index];
        if (text) {
          return `${text}: ${a.value}`;
        }
        return a?.value;
      })
      .filter(notEmpty)
      .join(", ");
  }

  getByEvent<T = Record<string, string>>(type: string): T {
    const ev = findLast(this.events, (a) => a.type === type);
    return this.toObject(ev?.attributes ?? []) as any as T;
  }

  getByEventContract<T = Record<string, string>>(
    type: string,
    contract: string
  ): T {
    const ev = findLast(
      this.events,
      (a) =>
        a.type === type &&
        a.attributes.some(
          (b) =>
            (b.key === "_contract_address" || b.key === "_contract_addr") &&
            b.value === contract
        )
    );

    if (!ev) {
      return this.getByEvent(type);
    }

    return this.toObject(ev?.attributes ?? []) as any as T;
  }

  sumByEventAndAttribute(type: string, attribute: string) {
    const events = this.events.filter((a) => a.type === type);
    const attributes = selectMany(events, (event) =>
      event.attributes.filter((a) => a.key == attribute)
    );

    return sumBy(attributes, (attribute) => +attribute.value);
  }

  getByFirstAction<T = Record<string, string>>(
    type: string,
    action: string
  ): T {
    const ev = find(
      this.events,
      (a) =>
        a.type === type &&
        a.attributes.some(
          (attribute) =>
            attribute.key === "action" && attribute.value === action
        )
    );
    return this.toObject(ev?.attributes ?? []) as any as T;
  }

  getByAction<T = Record<string, string>>(type: string, action: string): T {
    const ev = findLast(
      this.events,
      (a) =>
        a.type === type &&
        a.attributes.some(
          (attribute) =>
            attribute.key === "action" && attribute.value === action
        )
    );
    return this.toObject(ev?.attributes ?? []) as any as T;
  }

  getByActionAndActionType<T = Record<string, string>>(
    type: string,
    action: string,
    actiontype: string
  ): T {
    const ev = findLast(
      this.events,
      (a) =>
        a.type === type &&
        a.attributes.some(
          (attribute) =>
            attribute.key === "action" && attribute.value === action
        ) &&
        a.attributes.some(
          (attribute) =>
            attribute.key === "type" && attribute.value === actiontype
        )
    );
    return this.toObject(ev?.attributes ?? []) as any as T;
  }

  getAllByAction<T = Record<string, string>>(
    type: string,
    action: string
  ): T[] {
    const ev = this.events
      .filter(
        (a) =>
          a.type === type &&
          a.attributes.some(
            (attribute) =>
              attribute.key === "action" && attribute.value === action
          )
      )
      .map((ev) => this.toObject(ev?.attributes ?? []) as any as T);
    return ev;
  }

  getAllByType<T = Record<string, string>>(type: string): T[] {
    const ev = this.events
      .filter((a) => a.type === type)
      .map((ev) => this.toObject(ev?.attributes ?? []) as any as T);
    return ev;
  }

  getAllTransfers(receiver: string) {
    const cw20 = this.getAllByAction<{
      from: string;
      to: string;
      _contract_address: string;
      amount: string;
    }>("wasm", "transfer")
      .filter((a) => a.to === receiver)
      .map((a) => ({
        token: a._contract_address,
        from: a.from,
        to: a.to,
        uamount: toNumb(a.amount),
        info: getDecimalInfo(a._contract_address),
      }));

    const native = this.getAllByType<{
      sender: string;
      recipient: string;
      amount: string;
    }>("transfer")
      .filter((a) => a.recipient === receiver)
      .map((a) => {
        const balance = ChainEventsReader.readBalance(a.amount)[0];
        return {
          token: balance.denom,
          from: a.sender,
          to: a.recipient,
          uamount: balance.amount,
          info: getDecimalInfo(balance.denom),
        };
      });

    return [...cw20, ...native];
  }

  getLastByType<T = Record<string, string>>(type: string): T {
    const all = this.events.filter((a) => a.type === type);
    const ev = all[all.length - 1];
    return this.toObject(ev?.attributes ?? []) as any as T;
  }

  packageActions<T = Record<string, string>>(type: string): T[] {
    const events = this.events.filter((a) => a.type === type);
    if (!events) {
      return [];
    }

    let current = {} as any;
    const results: T[] = [];
    let first = true;

    for (const ev of events) {
      for (const attribute of ev.attributes) {
        if (attribute.key === "_contract_address") {
          if (!first) {
            results.push(current);
            current = {} as any;
          }
          first = false;
        }

        current[attribute.key as any] = attribute.value;
      }

      results.push(current);
    }
    return results;
  }

  readSwaps(): SwapInfo[] {
    const events = this.getAllByAction<SwapInfo>("wasm", "swap");
    return events.map(
      (a) =>
        <SwapInfo>{
          ask_asset: a.ask_asset,
          offer_amount: +a.offer_amount,
          offer_asset: a.offer_asset,
          return_amount: +a.return_amount,
          spread_amount: +a.spread_amount,
          commission_amount: +a.commission_amount,
        }
    );
  }

  toObject(attributes: EventAttribute[]) {
    return attributes.reduce((prev, current) => {
      prev[current.key] = prev[current.key]
        ? prev[current.key] + ", " + current.value
        : current.value;
      return prev;
    }, <Record<string, string>>{});
  }

  static readBalance(text: string) {
    if (!text) {
      return [];
    }
    const coins = text.split(",");

    return coins.map((coin) => {
      const index = /[a-z]/i.exec(coin)?.index || 0;

      const coinpart = [coin.substring(0, index), coin.substring(index)];
      const amount = +(coinpart[0] || 0);
      const denom = coinpart[1] || "";

      const info = getDecimalInfo(denom);
      return { amount, denom, info };
    });
  }

  static readBalanceNew(text: string) {
    if (!text) {
      return [];
    }
    const coins = text.split(",");

    return coins.map((coin) => {
      const index = coin.lastIndexOf(":");
      const start = coin.indexOf(":");

      const coinpart = [
        coin.substring(start + 1, index),
        coin.substring(index + 1),
      ];
      const denom = coinpart[0] || "";
      const amount = +(coinpart[1] || 0);
      const info = getDecimalInfo(denom);
      return { amount: amount / info.factor, denom, info };
    });
  }
}
