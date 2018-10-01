import { Component } from '@angular/core';
import {  NavController, NavParams, AlertController, LoadingController } from 'ionic-angular';
import { Http, RequestOptions, Headers, URLSearchParams } from "@angular/http";
import { Storage } from "@ionic/storage"
import { IS_LOGGED_IN_KEY } from '../../app/app.constants';
import { NowPlayingPage } from '../now-playing/now-playing';
import { LoginPage } from '../login/login';
import { GoogleAnalyticsService } from '../../app/sevices/analytics.service';

/**
 * Generated class for the SearchPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

 
@Component({
  selector: 'page-search',
  templateUrl: 'search.html',
})
export class SearchPage {
  SearchResults = [];
  keyword = '';
  hideResults = true;
  options;
  constructor(public navCtrl: NavController,
    private alertCtrl: AlertController,
    public navParams: NavParams,
    private http: Http,
    private storage: Storage,
    private loading: LoadingController,
    private gaSvc:GoogleAnalyticsService) {
      this.options = new RequestOptions({
        headers: new Headers({
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      });
  }
  onInput(){
    let req
    let loader = this.loading.create({ content: "Loading...", enableBackdropDismiss: true });
    loader.onDidDismiss(() => {
      req.unsubscribe();
    });
    let body = new URLSearchParams();
      body.set('action', 'App_Search');
      body.set('keyword', this.keyword);
    loader.present().then(()=>{
      req=this.http.post('http://cums.the-v.net/site.aspx',body,this.options)
          .subscribe(resp=>{
            console.log(resp.json())
            this.SearchResults = resp.json();
            this.SearchResults.map(vid=>{
              vid.id = vid.URL.substring(16,vid.URL.length);
              vid.image = vid.image.substring(78,vid.image.length);
              if(vid.videoPrivacy=="private"){
                vid.noLock = false;
              }else{
                vid.noLock = true;
              }
            })
            loader.dismiss();
            this.hideResults = false;
          },
        error=>{
          //error request
          loader.dismiss();
          let alert = this.alertCtrl.create({
            title: 'Network Connection Error!',
            message: "Make sure your device is connected to the internet." ,
            buttons: [
              {
                text: 'Login',
                role: 'cancel', 
                handler: () => {
                  this.navCtrl.push(LoginPage);
                }
              },{
              text: 'Cancel',
              role: 'cancel', 
              handler: () => {
              }
            }]
          });
          alert.present();
          
        })
    })
  }

  ionViewDidLoad() {
    this.gaSvc.gaTrackPageEnter('Search');
  }
  playVideo(id:string){
    this.storage.get(IS_LOGGED_IN_KEY).then(loggedIn=>{
      if(loggedIn){
        this.navCtrl.push(NowPlayingPage,{
          id:id
        });
      }
      else{
        let alert = this.alertCtrl.create({
          title: 'Oops!',
          message: 'Please Login to view video.',
          buttons: [
            {
              text: 'Login',
              role: 'cancel', 
              handler: () => {
                this.navCtrl.push(LoginPage);
              }
            },{
            text: 'Cancel',
            role: 'cancel', 
            handler: () => {
            }
          }]
        });
        alert.present();
      }
    })
  }

}
