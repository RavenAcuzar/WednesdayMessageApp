import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { IonicStorageModule } from "@ionic/storage";
import { SQLite } from "@ionic-native/sqlite";
import { Network } from "@ionic-native/network";
import { ScreenOrientation } from "@ionic-native/screen-orientation";

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { LoginPage } from '../pages/login/login';
import { NowPlayingPage } from '../pages/now-playing/now-playing';
import { PlaylistPage } from '../pages/playlist/playlist';
import { SearchPage } from '../pages/search/search';
import { HttpModule } from '@angular/http';
import { VideoService } from './sevices/video.service';
import { PlaylistService } from './sevices/playlist.service';
import { ConnectionService } from './sevices/network.service';
import { GoogleAnalyticsService } from './sevices/analytics.service';
import { GoogleAnalytics } from '@ionic-native/google-analytics';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    LoginPage,
    NowPlayingPage,
    PlaylistPage,
    SearchPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot(),
    HttpModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    LoginPage,
    NowPlayingPage,
    PlaylistPage,
    SearchPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    SQLite,
    Network,
    VideoService,
    PlaylistService,
    ConnectionService,
    ScreenOrientation,
    GoogleAnalytics,
    GoogleAnalyticsService,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
