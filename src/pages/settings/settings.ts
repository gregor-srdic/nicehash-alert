import { CurrencyRates } from '../../utils';
import { CurrencyExchangeService } from '../../providers/currency-exchange-service';
import { NiceHashService } from '../../providers/nice-hash-service';
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {

  private settings: any;
  private availableCurrencies: string[];

  constructor(public navCtrl: NavController, private niceHash: NiceHashService, private currencyExchange: CurrencyExchangeService) {
  }

  ionViewWillEnter() {
    this.currencyExchange.getUsdConversionRates().promise.then(r => {
      this.availableCurrencies = [];
      for (var key in r.rates)
        this.availableCurrencies.push(key);
    });
    this.settings = {
      address: this.niceHash.settings.address,
      silentMode: this.niceHash.settings.silentMode,
      currency: this.niceHash.settings.currency
    }
  }

  private updateSettings() {
    this.niceHash.settings.currency = this.settings.currency;
    this.niceHash.settings.silentMode = this.settings.silentMode;
    this.niceHash.saveSettingsToLocalStorage();
  }

  private openEditAddressModal() {
    this.niceHash.promptForAddress().promise.then(address => this.settings.address = address ? address : this.settings.address);
  }

}
