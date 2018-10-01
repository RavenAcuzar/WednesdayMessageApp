import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, Events, AlertController, ToastController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { AppStateService } from './sevices/app_state.service';
import { Storage } from '@ionic/storage';
import { IS_LOGGED_IN_KEY, USER_ID_KEY } from './app.constants';
import { PlaylistPage } from '../pages/playlist/playlist';
import { SearchPage } from '../pages/search/search';
import { LoginPage } from '../pages/login/login';
import { Network } from '@ionic-native/network';
import { ConnectionService } from './sevices/network.service';
import { GoogleAnalyticsService } from './sevices/analytics.service';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = HomePage;

  pages: Array<{title: string, component: any, icon:any}>;
  appState: boolean;
  constructor(public platform: Platform, public statusBar: StatusBar, public splashScreen: SplashScreen,
    private events: Events, private storage:Storage, private alertCtrl:AlertController, private network: Network,
    private toastCtrl: ToastController, private connectionSrvc: ConnectionService,
  private gaSvc:GoogleAnalyticsService) {
    this.initializeApp();
    this.updateMenu();
    events.subscribe(AppStateService.UPDATE_MENU_STATE_EVENT, _ => {
      this.updateMenu();
    })
    // used for an example of ngFor and navigation

  }
  updateMenu(){
    this.storage.get(IS_LOGGED_IN_KEY).then(loggedIn=>{
      if(loggedIn){
        this.appState = loggedIn;
        this.pages = [
          { title: 'Home', component: HomePage, icon:'md-home' },
          { title: 'Playlist', component: PlaylistPage, icon:'md-albums' },
          { title: 'Search', component: SearchPage, icon:'md-search' }
        ];
      }
      else{
        this.appState = loggedIn;
        this.pages = [
          { title: 'Home', component: HomePage, icon:'md-home' }
        ];
      }
    })
  }
  
  logoutAlert() {
    let alert = this.alertCtrl.create({
      title: 'Are you sure you want to Log out?',
      buttons: [{
        text: 'Logout',
        handler: () => {
          console.log('Logout clicked');
          this.storage.set(IS_LOGGED_IN_KEY, false).then(() => {  
            this.storage.set(USER_ID_KEY,null).then(()=>{  
              this.gaSvc.gaEventTracker('Logout','Logged Out', 'User logged out');
              AppStateService.publishAppStateChange(this.events);
              this.nav.setRoot(HomePage);
            });
          });
          alert.dismiss();
          return false;
        }
      },
      {
        text: 'Cancel',
        handler: () => {
          console.log('Cancel clicked');
          alert.dismiss();
          return false;
        }
      }
      ]
    })
    alert.present();
  }

  login(){
    this.nav.push(LoginPage);
  }
  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      if (this.network.type === "none") {
        let toast = this.toastCtrl.create({
          message: "You're Offline. Check your internet connection.",
          position: 'bottom'
        });
        toast.present();
        this.connectionSrvc.setActiveToast(toast);
      }
      this.connectionSrvc.checkNetworkConnection();
    });
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(page.component);
  }
}
