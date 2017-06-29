import { CurrencyRates, BtcExchangeRate, AppConstants } from '../../utils';
import { CurrencyExchangeService } from '../../providers/currency-exchange-service';
import { NiceHashService } from '../../providers/nice-hash-service';
import { Component } from '@angular/core';
import { NavController, Events } from 'ionic-angular';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {

  private settings: any;
  private availableCurrencies: string[];
  private btcExchangeRate: BtcExchangeRate;
  private usdExchangeRates: CurrencyRates;

  constructor(public navCtrl: NavController, private niceHash: NiceHashService, private currencyExchange: CurrencyExchangeService, private events: Events) {
  }

  ionViewWillEnter() {
    this.currencyExchange.getUsdConversionRates().promise.then(r => {
      this.usdExchangeRates = r;
      this.availableCurrencies = [];
      for (var key in r.rates)
        this.availableCurrencies.push(key);
    });
    this.currencyExchange.getBtcExchangeRate().promise.then(r => this.btcExchangeRate = r);
    this.settings = {
      address: this.niceHash.settings.address,
      silentMode: this.niceHash.settings.silentMode,
      currency: this.niceHash.settings.currency,
      darkTheme: this.niceHash.settings.darkTheme
    }
  }

  private updateSettings() {
    this.niceHash.settings.currency = this.settings.currency;
    this.niceHash.settings.silentMode = this.settings.silentMode;
    this.niceHash.saveSettingsToLocalStorage();
  }

  private toggleDarkTheme() {
    this.niceHash.settings.darkTheme = this.settings.darkTheme;
    this.niceHash.saveSettingsToLocalStorage();
    this.events.publish(AppConstants.APP_EVENTS.APP_THEME_UPDATE, { darkTheme: this.settings.darkTheme });
  }

  private openEditAddressModal() {
    this.niceHash.promptForAddress().promise.then(address => this.settings.address = address ? address : this.settings.address);
  }

}
