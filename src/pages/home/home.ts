import { Balance, CurrencyRates, NiceHashData, Stats } from '../../utils';
import { CurrencyExchangeService } from '../../providers/currency-exchange-service';
import { NiceHashService } from '../../providers/nice-hash-service';
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import 'rxjs/add/operator/throttle';
import 'rxjs/add/operator/sample';
import { Observable, Subscription, Subject } from 'rxjs';
import {Moment} from 'moment';
import moment from 'moment';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  public stats: Stats;

  private logTag: string = 'HomePage';
  private niceHashData: NiceHashData = null;
  private lastUpdateTimestamp: Moment = null;

  private currentBtcPriceInUsd: number;
  private usdExchangeRates: CurrencyRates;

  constructor(public navCtrl: NavController, private niceHash: NiceHashService, private currencyExchange: CurrencyExchangeService) {
    this.niceHashData = this.niceHash.settings;
    this.stats = {
      btc: null,
      connection: false
    };
    this.niceHashData.updateSubject.subscribe(next => {
      this.lastUpdateTimestamp = moment();
      if (next) {
        this.stats.connection = true;
        this.updateStats();
      }
      else
        this.stats.connection = false;
    });
  }

  doRefresh(refresher) {
    this.niceHash.startContinuousBalanceUpdate(false).promise.then(r => refresher.complete());
  }

  private updateStats() {
    Promise.all([
      this.currencyExchange.getBtcExchangeRate().promise,
      this.currencyExchange.getUsdConversionRates().promise
    ]).
      then(([currentBtcPriceInUsd, usdExchangeRates]) => {
        this.currentBtcPriceInUsd = currentBtcPriceInUsd;
        this.usdExchangeRates = usdExchangeRates;
        let l = this.niceHashData.balanceHistory.length - 1;
        if (l == 0)
          this.stats.btc = this.niceHashData.profitabilityInBtc;
        else if (l > 0) 
          this.stats.btc = ((this.niceHashData.balanceHistory[0].btc - this.niceHashData.balanceHistory[l].btc) * 24 * 3600 * 1000) / (this.niceHashData.balanceHistory[0].timestamp - this.niceHashData.balanceHistory[l].timestamp);

      });
  }

}