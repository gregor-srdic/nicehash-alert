import { Deferred } from '../utils';
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class NiceHashService {

  constructor(public http: Http) { }

  public getBalanceHistory(): Deferred<Balance[]>{
    let dfd = new Deferred<Balance[]>(),
        d = new Date();
    this.http.get(
        ` https://api.nicehash.com/api?method=stats.provider.ex&addr=1AWjq6HEsZTxmr1bBi3zUq9fqoQF6eYpq8&from=${d.getTime()}`,
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

  public getCurrentBalance(): Promise<Balance> {
    // https://api.nicehash.com/api?method=stats.provider&addr=1AWjq6HEsZTxmr1bBi3zUq9fqoQF6eYpq8
    return new Promise<Balance>((resolve, reject) => {
      this.http.get(
        ` https://api.nicehash.com/api?method=stats.provider&addr=1AWjq6HEsZTxmr1bBi3zUq9fqoQF6eYpq8`,
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

}

export interface Balance {
  timestamp: number;
  btc: number;
  totalAcceptedSpeed: number;
  totalRejectedSpeed: number;
}