import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

@Component({
  selector: 'modal-prompt-for-address',
  templateUrl: 'prompt-for-address.html'
})
export class PromptForAddressModal {

  private address = '';

  constructor(private params: NavParams, private viewCtrl: ViewController, private barcodeScanner: BarcodeScanner) {
    this.address = params.get('address');
  }

  public openQrScanner() {
    this.barcodeScanner.scan().then((barcodeData) => {
      if (barcodeData && barcodeData.text) {
        this.address = barcodeData.text.replace('bitcoin:', '');
      }
    }, (err) => {
      console.warn(err);
    });
  }
  
  dismiss(save:boolean) {
      this.viewCtrl.dismiss(save ? this.address : null);
  }

}