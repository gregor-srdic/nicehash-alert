import { CurrencyRates } from '../../utils';
import { CurrencyExchangeService } from '../../providers/currency-exchange-service';
import { Balance, NiceHashService } from '../../providers/nice-hash-service';
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { LocalNotifications } from '@ionic-native/local-notifications';
import 'rxjs/add/operator/throttle';
import 'rxjs/add/operator/sample';
import { Observable, Subscription, Subject } from 'rxjs';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  public stats: Stats;

  private logTag: string = 'HomePage';
  private updateBalanceActive: boolean = false;
  private updateBalanceInterval: number = 30000;
  private stallAlertTreshold: number = 3;
  private maxHistoryLength: number = 60;
  private currentStallCount: number = 0;
  private updateBalanceTimeout: any = null;

  private balanceHistory: Balance[];

  private currentBtcPriceInUsd: number;
  private usdExchangeRates: CurrencyRates;

  constructor(public navCtrl: NavController, private niceHash: NiceHashService, private currencyExchange: CurrencyExchangeService, private localNotifications: LocalNotifications) {
    this.balanceHistory = [];
    this.stats = {
      btc: 0,
      usd: 0,
      eur: 0
    };
    //this.niceHash.getBalanceHistory();
  }

  ionViewWillEnter() {
    console.debug(`${this.logTag}: ionViewWillEnter`);
    this.updateBalanceActive = true;
    this.continuousBalanceUpdate();
  }

  ionViewWillLeave() {
    console.debug(`${this.logTag}: ionViewWillEnter`);
    this.updateBalanceActive = false;
    if (this.updateBalanceTimeout) {
      window.clearTimeout(this.updateBalanceTimeout);
      this.updateBalanceTimeout = null;
    }
  }

  private continuousBalanceUpdate() {
    console.debug(`${this.logTag}: continuousBalanceUpdate`);
    this.getBalance().then(r => {
      if (this.updateBalanceActive && !this.updateBalanceTimeout)
        this.updateBalanceTimeout = window.setTimeout(() => this.continuousBalanceUpdate(), this.updateBalanceInterval);
    });
  }

  private getBalance(): Promise<any> {
    console.debug(`${this.logTag}: getBalance`);
    this.updateBalanceTimeout = null;
    return new Promise((resolve) => {
      Promise.all([
        this.niceHash.getCurrentBalance(),
        this.currencyExchange.getBtcExchangeRate().promise,
        this.currencyExchange.getUsdConversionRates().promise
      ]).then(
        ([cb, usdPrice, usdExchangeRates]) => {
          this.currentBtcPriceInUsd = usdPrice;
          this.usdExchangeRates = usdExchangeRates;
          if (cb && cb.totalAcceptedSpeed <= 0) {
            this.localNotifications.schedule({
              id: 1,
              title: 'Rig Alert',
              text: 'Mining speed failed to zero!',
            });
          }
          let l = this.balanceHistory.length;
          if (l == 0 || this.balanceHistory[l - 1].btc != cb.btc) {
            this.balanceHistory.unshift(cb);
            this.currentStallCount = 0;
            this.updateStats();
          } else {
            this.currentStallCount++;
          }
          if (this.balanceHistory.length > this.maxHistoryLength)
            this.balanceHistory.length = this.maxHistoryLength;
          resolve(true);
        },
        err => resolve(false)
        )
    });
  }

  private updateStats() {
    let l = this.balanceHistory.length - 1;
    if (l > 0) {
      this.stats.btc = ((this.balanceHistory[0].btc - this.balanceHistory[l].btc) * 24 * 3600 * 1000) / (this.balanceHistory[0].timestamp - this.balanceHistory[l].timestamp);
      this.stats.usd = this.currentBtcPriceInUsd ? this.stats.btc * this.currentBtcPriceInUsd : 0;
      this.stats.eur = this.stats.usd && this.usdExchangeRates && this.usdExchangeRates.rates.EUR ? this.stats.usd * this.usdExchangeRates.rates.EUR : 0;
    }
  }

}

export interface Stats {
  btc: number;
  usd: number;
  eur: number;
}