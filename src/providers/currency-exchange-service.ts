import { BuiltinConverter } from '@angular/compiler/src/compiler_util/expression_converter';
import { Timestamp } from 'rxjs/Rx';
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { AppConstants, Deferred, CurrencyRates, tryToGetItemFromLocalStorage, BtcExchangeRate } from '../utils';
import moment from 'moment';

@Injectable()
export class CurrencyExchangeService {

  constructor(public http: Http) { }

  public getBtcExchangeRate(): Deferred<BtcExchangeRate> {
    let btcExchangeRateDfd = new Deferred<BtcExchangeRate>(),
      d = new Date(),
      storedValue: BtcExchangeRate = tryToGetItemFromLocalStorage(AppConstants.LOCALSTORAGE_KEYS.btcExchangeRate, true);
    if (storedValue) {
      btcExchangeRateDfd.resolve(storedValue);
    }
    if (!storedValue || (d.getTime() - storedValue.timestamp > 15 * 60 * 1000)) {
      this.http.get(
        `https://api.coinmarketcap.com/v1/ticker/bitcoin/`,
        {}
      )
        .map(res => res.json())
        .subscribe(
        data => {
          let el = data.find(el => el.id == 'bitcoin');
          if (el) {
            if (!storedValue){
              storedValue = { value: parseFloat(el.price_usd), timestamp: d.getTime() };
              btcExchangeRateDfd.resolve(storedValue);
            }
            else {
              storedValue.value = parseFloat(el.price_usd);
              storedValue.timestamp = d.getTime();
            }
            window.localStorage.setItem(AppConstants.LOCALSTORAGE_KEYS.btcExchangeRate, JSON.stringify(storedValue));
            return;
          }
          btcExchangeRateDfd.resolve(null);
        },
        err => btcExchangeRateDfd.resolve(null)
        );
    }
    return btcExchangeRateDfd;
  }

  public getUsdConversionRates(): Deferred<CurrencyRates> {
    let currencyRatesDfd = new Deferred<CurrencyRates>(),
      dateToday = moment().format('YYYY-MM-DD'),
      storedRates: CurrencyRates = tryToGetItemFromLocalStorage(AppConstants.LOCALSTORAGE_KEYS.currencyConversionRates, true);
    if (storedRates) {
      storedRates.rates.USD = 1;
      currencyRatesDfd.resolve(storedRates);
      //return currencyRatesDfd;
    }
    if (!storedRates || storedRates.retreivedDate != dateToday) {
      this.http.get('https://api.fixer.io/latest?base=USD', {})
        .map(res => res.json())
        .subscribe(
        data => {
          if (data) {
            if (storedRates) {
              storedRates.rates = data.rates;
              data = storedRates;
            }
            data.retreivedDate = dateToday;
            data.rates.USD = 1;
            currencyRatesDfd.resolve(data);
            window.localStorage.setItem(AppConstants.LOCALSTORAGE_KEYS.currencyConversionRates, JSON.stringify(data));
            return;
          }
          currencyRatesDfd.resolve(null);
        },
        err => currencyRatesDfd.resolve(null));
    }
    return currencyRatesDfd;
  }

}