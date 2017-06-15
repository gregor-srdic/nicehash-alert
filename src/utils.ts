import { Observable, Subject } from 'rxjs/Rx';
import { Modal } from 'ionic-angular';

export class AppConstants {
  public static LOCALSTORAGE_KEYS = {
    currencyConversionRates: 'currencyConversionRates',
    niceHashSettings: 'niceHashSettings'
  };
}
export class Deferred<T> {
  promise: Promise<T>;
  resolve: Function;
  reject: Function;
  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
export interface CurrencyRates {
  retreivedDate: string;
  base: string;
  date: string;
  rates: {
    AUD: number;
    BGN: number;
    BRL: number;
    CAD: number;
    CNY: number;
    CZK: number;
    DKK: number;
    EUR: number;
    GBP: number;
    HKD: number;
    HRK: number;
    HUF: number;
    IDR: number;
    ILS: number;
    INR: number;
    JPY: number;
    KRW: number;
    MXN: number;
    MYR: number;
    NOK: number;
    NZD: number;
    PHP: number;
    PLN: number;
    RON: number;
    RUB: number;
    SEK: number;
    SGD: number;
    THB: number;
    TRY: number;
    USD: number;
    ZAR: number;
  };
}
export interface Balance {
  timestamp: number;
  btc: number;
  totalAcceptedSpeed: number;
  totalRejectedSpeed: number;
}
export interface NiceHashData {
  address: string;
  updateBalanceActive: boolean;
  updateBalanceInterval: number;
  maxHistoryLength: number;
  balanceHistory: Balance[];
  updateSubject: Subject<any>;
  promptForAddressModal: Modal;
  profitabilityInBtc: number;
  updateCountDown: Observable<number>;
  currency: string;
  silentMode: boolean;
  alertActive: boolean;
}
export interface Stats {
  btc: number;
  connection: boolean;
}
export function tryToGetItemFromLocalStorage(key: string, parseJson: boolean): any {
  let item;
  try {
    let storedValue = window.localStorage.getItem(key);
    item = storedValue && parseJson ? JSON.parse(storedValue) : storedValue;
  } catch (e) {
    console.warn('Browser does not support Local Storage');
  }
  return item;
}