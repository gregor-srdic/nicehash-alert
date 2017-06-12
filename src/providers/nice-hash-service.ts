import { Subject } from 'rxjs/Rx';
import { Deferred, NiceHashData, Balance } from '../utils';
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { LocalNotifications } from '@ionic-native/local-notifications';

@Injectable()
export class NiceHashService {

  private logTag: string = 'NiceHashService';
  private updateBalanceTimeout: any = null;
  
  public settings: NiceHashData = {
    address: '1AWjq6HEsZTxmr1bBi3zUq9fqoQF6eYpq8',
    updateBalanceActive: false,
    updateBalanceInterval: 30000,
    maxHistoryLength: 60,
    balanceHistory: [],
    updateSubject: new Subject<any>()
  };

  constructor(public http: Http, private localNotifications: LocalNotifications) { 
    this.startContinuousBalanceUpdate();
  }

  /*
  private getBalanceHistory(): Deferred<Balance[]>{
    let dfd = new Deferred<Balance[]>(),
        d = new Date();
    this.http.get(
        ` https://api.nicehash.com/api?method=stats.provider.ex&addr=${this.settings.address}&from=${d.getTime()}`,
        {}
      )
        .map(res => res.json())
        .subscribe(
        data => {
          if (data.result && data.result.past) {
            let balances = []
            data.result.past.forEach(pastElement => {
              
            });
            dfd.resolve(balances);
          }
        },
        err => dfd.reject(null)
        );
    return dfd;
  }
  */

  private getCurrentBalance(): Promise<Balance> {
    // https://api.nicehash.com/api?method=stats.provider&addr=${this.settings.address}
    return new Promise<Balance>((resolve, reject) => {
      this.http.get(
        ` https://api.nicehash.com/api?method=stats.provider&addr=${this.settings.address}`,
        {}
      )
        .map(res => res.json())
        .subscribe(
        data => {
          if (data.result && data.result.stats) {
            let btcBalance = 0,
              totalAcceptedSpeed = 0,
              totalRejectedSpeed = 0;
            data.result.stats.forEach(el => {
              btcBalance += parseFloat(el.balance);
              totalAcceptedSpeed += parseFloat(el.accepted_speed);
              totalRejectedSpeed += parseFloat(el.rejected_speed);
            });
            return resolve({
              timestamp: (new Date).getTime(),
              btc: btcBalance,
              totalAcceptedSpeed: totalAcceptedSpeed,
              totalRejectedSpeed: totalRejectedSpeed
            });
          }
          reject(null);
        },
        err => reject(null)
        );
    });
  }

  public startContinuousBalanceUpdate() {
    console.debug(`${this.logTag}: continuousBalanceUpdate`);
    this.settings.updateBalanceActive = true;
    this.updateBalance();
  }

  public stopContinuousBalanceUpdate() {
    this.settings.updateBalanceActive = false;
    if (this.updateBalanceTimeout) {
      window.clearTimeout(this.updateBalanceTimeout);
      this.updateBalanceTimeout = null;
    }
  }

  private updateBalance(): Deferred<any> {
    console.debug(`${this.logTag}: getBalance`);
    this.updateBalanceTimeout = null;
    let dfd = new Deferred<any>();
    this.getCurrentBalance().then(
      (cb) => {
        if (cb && cb.totalAcceptedSpeed <= 0) {
          this.localNotifications.schedule({
            id: 1,
            title: 'Rig Alert',
            text: 'Mining speed failed to zero!',
          });
        }
        let l = this.settings.balanceHistory.length;
        if (l == 0 || this.settings.balanceHistory[l - 1].btc != cb.btc)
          this.settings.balanceHistory.unshift(cb);
        if (this.settings.balanceHistory.length > this.settings.maxHistoryLength)
          this.settings.balanceHistory.length = this.settings.maxHistoryLength;
        this.settings.updateSubject.next(true);
        dfd.resolve(true);
      },
      err => dfd.resolve(false)
    );
    dfd.promise.then(r => {
      if (this.settings.updateBalanceActive && !this.updateBalanceTimeout)
        this.updateBalanceTimeout = window.setTimeout(() => this.updateBalance(), this.settings.updateBalanceInterval);
    });
    return dfd;
  }

}