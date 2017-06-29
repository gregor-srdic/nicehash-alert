import { PromptForAddressModal } from '../pages/modals/prompt-for-address';
import { Observable, Subject } from 'rxjs/Rx';
import { AppConstants, Balance, Deferred, NiceHashData, AlgoData, AlgorithmsMap, tryToGetItemFromLocalStorage } from '../utils';
import { Injectable, NgZone } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { Insomnia } from '@ionic-native/insomnia';
import { ModalController, Modal, Events } from 'ionic-angular';

@Injectable()
export class NiceHashService {

  private logTag: string = 'NiceHashService';
  private updateBalanceTimeout: any = null;

  public settings: NiceHashData = {
    address: '',
    updateBalanceActive: false,
    updateBalanceInterval: 30000,
    maxHistoryLength: 60,
    balanceHistory: [],
    updateSubject: new Subject<any>(),
    promptForAddressModal: null,
    profitabilityInBtc: 0,
    updateCountDown: null,
    currency: 'USD',
    silentMode: false,
    alertActive: false,
    connectionError: false,
    darkTheme: false
  };

  constructor(public http: Http, private localNotifications: LocalNotifications, private insomnia: Insomnia, private modalCtrl: ModalController, private zone: NgZone, private events: Events) {
    this.readSettingsFromLocalStorage();
    this.startContinuousBalanceUpdate(false);
  }

  private getProfitability(): Deferred<number> {
    let dfd = new Deferred<number>(),
      d = new Date();
    if (!this.settings.address || this.settings.profitabilityInBtc) {
      dfd.resolve(this.settings.profitabilityInBtc);
      return dfd;
    }
    let oneHourAgo = Math.round(d.getTime() / 1000) - 3600;
    this.http.get(
      ` https://api.nicehash.com/api?method=stats.provider.ex&from=${oneHourAgo}&addr=${this.settings.address}`,
      {}
    )
      .map(res => res.json())
      .subscribe(
      data => {
        dfd.resolve(this.parsePastProfitabilityData(data, oneHourAgo * 1000));
      },
      err => dfd.resolve(-1)
      );
    return dfd;
  }

  private getCurrentBalance(): Promise<Balance> {
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
              totalRejectedSpeed = 0,
              algos: AlgoData[] = [];
            data.result.stats.forEach(el => {
              btcBalance += parseFloat(el.balance);
              totalAcceptedSpeed += parseFloat(el.accepted_speed);
              totalRejectedSpeed += parseFloat(el.rejected_speed);
              algos.push({
                name: AlgorithmsMap[el.algo],
                acceptedSpeed: parseFloat(el.accepted_speed),
                rejectedSpeed: parseFloat(el.rejected_speed)
              });
            });
            return resolve({
              timestamp: (new Date).getTime(),
              btc: btcBalance,
              totalAcceptedSpeed: totalAcceptedSpeed,
              totalRejectedSpeed: totalRejectedSpeed,
              algos: algos
            });
          }
          reject(null);
        },
        err => reject(null)
        );
    });
  }

  private updateBalance(): Deferred<any> {
    console.debug(`${this.logTag}: getBalance`);
    this.updateBalanceTimeout = null;
    this.settings.updateCountDown = null;
    let dfd = new Deferred<any>();
    if (!this.settings.address) {
      dfd.resolve(false);
      this.promptForAddress();
    } else {
      this.getCurrentBalance().then(
        (cb) => {
          if (!cb)
            return dfd.resolve(false);
          this.settings.connectionError = false;
          if (cb.totalAcceptedSpeed <= 0) {
            console.debug(`${this.logTag}: totalAcceptedSpeed failed to 0`);
            this.settings.alertActive = true;
            let notificationConfig: any = {
              id: 1,
              title: 'Rig Alert',
              text: 'Mining stopped!!!',
              led: 'FF0000'
            };
            if (this.settings.silentMode)
              notificationConfig.sound = null;
            this.localNotifications.schedule(notificationConfig);
          } else {
            this.settings.alertActive = false;
            this.localNotifications.cancel(1);
          }
          let l = this.settings.balanceHistory.length;
          if (l == 0 || this.settings.balanceHistory[l - 1].btc != cb.btc)
            this.settings.balanceHistory.unshift(cb);
          if (this.settings.balanceHistory.length > this.settings.maxHistoryLength)
            this.settings.balanceHistory.length = this.settings.maxHistoryLength;
          this.settings.updateSubject.next(true);
          dfd.resolve(true);
        },
        err => {
          this.settings.connectionError = true;
          this.settings.updateSubject.next(false);
          dfd.resolve(false);
        }
      );
    }
    dfd.promise.then(r => {
      if (this.settings.updateBalanceActive && !this.updateBalanceTimeout) {
        let duration = r ? this.settings.updateBalanceInterval : 50000;
        this.updateBalanceTimeout = window.setTimeout(() => this.updateBalance(), duration);
        duration = duration / 1000;
        this.settings.updateCountDown = Observable.timer(0, 1000).map(value => (value * 100) / duration).takeWhile(value => value < 100);
      }
    });
    return dfd;
  }

  private readSettingsFromLocalStorage() {
    let settings = tryToGetItemFromLocalStorage(AppConstants.LOCALSTORAGE_KEYS.niceHashSettings, true);
    if (!settings)
      return;
    if (settings.address !== undefined)
      this.settings.address = settings.address;
    if (settings.currency !== undefined)
      this.settings.currency = settings.currency;
    if (settings.silentMode !== undefined)
      this.settings.silentMode = settings.silentMode;
    if(settings.darkTheme !== undefined)
      this.settings.darkTheme = settings.darkTheme;
    if(this.settings.darkTheme)
      this.events.publish(AppConstants.APP_EVENTS.APP_THEME_UPDATE,{darkTheme:this.settings.darkTheme});
  }

  private parsePastProfitabilityData(data, pastTime) {
    let profitability = 0;
    if (data.result && data.result.current) {
      data.result.current.forEach(el => profitability += parseFloat(el.profitability));
      this.settings.profitabilityInBtc = profitability;
    }
    if (data.result && data.result.past && this.settings.balanceHistory.length == 0) {
      let firstInfo = null,
        lastInfo = null,
        pastBtc = 0;
      data.result.past.forEach(algo => {
        if (algo.data && algo.data.length > 0) {
          algo.data.forEach(algoProfit => {
            let ts = algoProfit[0] * 300 * 1000,
              btc = parseFloat(algoProfit[2]);
            if (!firstInfo || ts < firstInfo.ts)
              firstInfo = {
                ts: ts,
                btc: btc
              };
            else if (ts == firstInfo.ts)
              firstInfo.btc += btc;
            if (!lastInfo || ts > lastInfo.ts)
              lastInfo = {
                ts: ts,
                btc: btc
              };
            else if (ts == lastInfo.ts)
              lastInfo.btc += btc;
          });
        }
      });
      if (firstInfo && lastInfo) {
        pastBtc = lastInfo.btc - firstInfo.btc;
        pastTime = firstInfo.ts;
      }
      if (data.result.payments)
        data.result.payments.forEach(p => pastBtc += parseFloat(p.amount));
      let firstBalance: Balance = {
        btc: lastInfo.btc - pastBtc,
        timestamp: pastTime,
        totalAcceptedSpeed: -1,
        totalRejectedSpeed: 0,
        algos: []
      }
      this.settings.balanceHistory.push(firstBalance);
    }
    return profitability;
  }

  public saveSettingsToLocalStorage() {
    let settings = {
      address: this.settings.address,
      currency: this.settings.currency,
      silentMode: this.settings.silentMode,
      darkTheme: this.settings.darkTheme
    };
    window.localStorage.setItem(AppConstants.LOCALSTORAGE_KEYS.niceHashSettings, JSON.stringify(settings));
  }

  public startContinuousBalanceUpdate(isRetry: boolean, dfd?: Deferred<any>): Deferred<any> {
    if (!dfd)
      dfd = new Deferred<any>();
    console.debug(`${this.logTag}: startContinuousBalanceUpdate`);
    if (this.updateBalanceTimeout) {
      window.clearTimeout(this.updateBalanceTimeout);
      this.updateBalanceTimeout = null;
    }
    this.settings.updateCountDown = null;
    this.getProfitability().promise.then(
      profitability => {
        if (profitability < 0) {
          this.settings.connectionError = true;
          let duration = 3000;
          this.settings.updateCountDown = Observable.timer(0, 1000).map(value => (value * 100) / duration).takeWhile(value => value < 100);
          return window.setTimeout(() => this.startContinuousBalanceUpdate(true, dfd), duration);
        }
        this.settings.connectionError = false;
        this.settings.updateBalanceActive = true;
        this.insomnia.keepAwake();
        this.updateBalance().promise.then(r => dfd.resolve(r));
      }
    );
    return dfd;
  }

  public stopContinuousBalanceUpdate() {
    console.debug(`${this.logTag}: stopContinuousBalanceUpdate`);
    this.settings.updateBalanceActive = false;
    this.insomnia.allowSleepAgain();
    if (this.updateBalanceTimeout) {
      window.clearTimeout(this.updateBalanceTimeout);
      this.updateBalanceTimeout = null;
    }
    this.settings.updateCountDown = null;
  }

  public promptForAddress(): Deferred<string> {
    let dfd = new Deferred<string>();
    if (!this.settings.promptForAddressModal) {
      this.settings.promptForAddressModal = this.modalCtrl.create(PromptForAddressModal, { address: this.settings.address });
      this.settings.promptForAddressModal.onDidDismiss((address) => {
        this.settings.promptForAddressModal = null;
        if (address) {
          this.settings.address = address;
          this.saveSettingsToLocalStorage();
          this.stopContinuousBalanceUpdate();
          this.settings.balanceHistory = [];
          this.settings.profitabilityInBtc = 0;
          this.startContinuousBalanceUpdate(false);
          dfd.resolve(address);
        }
        dfd.resolve(null);
      });
      this.settings.promptForAddressModal.present();
    } else {
      dfd.resolve(null);
    }
    return dfd;
  }

}