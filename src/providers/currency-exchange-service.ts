import { BuiltinConverter } from '@angular/compiler/src/compiler_util/expression_converter';
import { Timestamp } from 'rxjs/Rx';
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { AppConstants, Deferred, CurrencyRates, tryToGetItemFromLocalStorage } from '../utils';
import moment from 'moment';

@Injectable()
export class CurrencyExchangeService {

  private btcValueUpdateTimestamp: number = 0;
  private btcValueUpdatePromise: Deferred<number> = null;

  constructor(public http: Http) { }

  public getBtcExchangeRate(): Deferred<number> {
    //https://api.coinmarketcap.com/v1/ticker/bitcoin/
    let d = new Date();
    if (!this.btcValueUpdatePromise || (d.getTime() - this.btcValueUpdateTimestamp > 15 * 60 * 1000)) {
      this.btcValueUpdatePromise = new Deferred<number>();
      this.http.get(
        `https://api.coinmarketcap.com/v1/ticker/bitcoin/`,
        {}
      )
        .map(res => res.json())
        .subscribe(
        data => {
          let el = data.find(el => el.id == 'bitcoin');
          if (el) {
            let btcUsdPrice = parseFloat(el.price_usd);
            this.btcValueUpdateTimestamp = d.getTime();
            this.btcValueUpdatePromise.resolve(btcUsdPrice);
          }
        },
        err => this.btcValueUpdatePromise.resolve(null)
        );
    }
    return this.btcValueUpdatePromise;
  }

  public getUsdConversionRates(): Deferred<CurrencyRates> {
    let currencyRatesDfd = new Deferred<CurrencyRates>(),
      dateToday = moment().format('YYYY-MM-DD'),
      storedRates: CurrencyRates = tryToGetItemFromLocalStorage(AppConstants.LOCALSTORAGE_KEYS.currencyConversionRates, true);
    if (storedRates && storedRates.retreivedDate == dateToday) {
      currencyRatesDfd.resolve(storedRates);
      return currencyRatesDfd;
    }
    this.http.get('https://api.fixer.io/latest?base=USD', {})
      .map(res => res.json())
      .subscribe(
      data => {
        if (data) {
          data.retreivedDate = dateToday;
          currencyRatesDfd.resolve(data);
          window.localStorage.setItem(AppConstants.LOCALSTORAGE_KEYS.currencyConversionRates, JSON.stringify(data));
          return;
        }
        currencyRatesDfd.resolve(null);
      },
      err => currencyRatesDfd.resolve(null));
    return currencyRatesDfd;
  }

}