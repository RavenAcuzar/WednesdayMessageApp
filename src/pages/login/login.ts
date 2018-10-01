import { Component } from '@angular/core';
import {  NavController, NavParams, AlertController, Events } from 'ionic-angular';
import { Http, RequestOptions, Headers, URLSearchParams } from "@angular/http";
import { Storage } from '@ionic/storage';
import { IS_LOGGED_IN_KEY, USER_ID_KEY } from '../../app/app.constants';
import { AppStateService } from '../../app/sevices/app_state.service';
import { HomePage } from '../home/home';
import { GoogleAnalyticsService } from '../../app/sevices/analytics.service';

/**
 * Generated class for the LoginPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

 
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {
  private loginForm: {
    email: string,
    password: string
  } = {
    email: '',
    password: ''
  }
  options;
  hideError=true;
  constructor(public navCtrl: NavController, public navParams: NavParams,
    private http:Http, private alertCtrl:AlertController, private storage:Storage,
    private event:Events, private gaSvc:GoogleAnalyticsService) {
      this.options = new RequestOptions({
        headers: new Headers({
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      });
  }
  login(){
    let body = new URLSearchParams();
    body.set('action', 'checklogin');
    body.set('email', this.loginForm.email);
    body.set('password', this.loginForm.password);
    this.http.post('http://cums.the-v.net/site.aspx',body,this.options)
    .subscribe(resp=>{
      if(resp.json()[0].Data !=""){
        this.storage.set(IS_LOGGED_IN_KEY, true)
        .then(()=>{
          this.storage.set(USER_ID_KEY, resp.json()[0].Data)
          .then(()=>{
            this.gaSvc.gaEventTracker('Login','Logged In','User logged in');
            AppStateService.publishAppStateChange(this.event);
            this.navCtrl.setRoot(HomePage);
          })
        }) 
      }
      else{
        this.hideError = false;
      }
    }, error=>{
      let alert = this.alertCtrl.create({
        title: 'Something went wrong!',
        message: 'An error occured while trying to login. Please try again.',
        buttons: [{
          text: 'OK',
          handler: () => {
            alert.dismiss();
            return false;
          }
        }
        ]
      })
      alert.present();
    })
  }

  ionViewDidLoad() {
    this.gaSvc.gaTrackPageEnter('Login');
  }

}
