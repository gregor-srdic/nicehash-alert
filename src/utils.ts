import { Observable, Subject } from 'rxjs/Rx';
import { Modal } from 'ionic-angular';

export class AppConstants {
  public static LOCALSTORAGE_KEYS = {
    currencyConversionRates: 'currencyConversionRates',
    btcExchangeRate: 'btcExchangeRate',
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
export interface BtcExchangeRate {
  value: number;
  timestamp: number;
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
export interface AlgoData {
  acceptedSpeed: number;
  rejectedSpeed: number;
  name: string;
}
export interface Balance {
  timestamp: number;
  btc: number;
  totalAcceptedSpeed: number;
  totalRejectedSpeed: number;
  algos: AlgoData[];
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
  connectionError: boolean;
}
export interface Stats {
  btc: number;
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
export var AlgorithmsMap = {
  '0': 'Scrypt',
  '1': 'SHA256',
  '2': 'ScryptNf',
  '3': 'X11',
  '4': 'X13',
  '5': 'Keccak',
  '6': 'X15',
  '7': 'Nist5',
  '8': 'NeoScrypt',
  '9': 'Lyra2RE',
  '10': 'WhirlpoolX',
  '11': 'Qubit',
  '12': 'Quark',
  '13': 'Axiom',
  '14': 'Lyra2REv2',
  '15': 'ScryptJaneNf16',
  '16': 'Blake256r8',
  '17': 'Blake256r14',
  '18': 'Blake256r8vnl',
  '19': 'Hodl',
  '20': 'DaggerHashimoto',
  '21': 'Decred',
  '22': 'CryptoNight',
  '23': 'Lbry',
  '24': 'Equihash',
  '25': 'Pascal',
  '26': 'X11Gost',
  '27': 'Sia',
  '28': 'Blake2s'
}