import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController } from 'ionic-angular';
import { Http, RequestOptions, Headers, URLSearchParams } from "@angular/http";
import { NowPlayingPage } from '../now-playing/now-playing';
import { Storage } from '@ionic/storage';
import { IS_LOGGED_IN_KEY } from '../../app/app.constants';
import { LoginPage } from '../login/login';
import { SQLite, SQLiteObject } from "@ionic-native/sqlite";
import { openSqliteDb } from '../../app/app.utils';
import { GoogleAnalyticsService } from '../../app/sevices/analytics.service';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  latest = {};
  vids = [];
  options;
  page = 1;
  hideView = true;
  constructor(public navCtrl: NavController, private http: Http, private loadCtrl: LoadingController,
    private storage: Storage, private alertCtrl: AlertController, private sql: SQLite,
    private gaSvc:GoogleAnalyticsService) {
    this.options = new RequestOptions({
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    });
  }
  ionViewDidLoad() {
    this.loadVideos();
    this.gaSvc.gaTrackPageEnter('Home');
  }
  loadVideos() {
    let load: any = this.loadCtrl.create({
      spinner: "crescent",
      content: "Loading...",
      enableBackdropDismiss: true
    });
    load.present();
    let body = new URLSearchParams();
    body.set('action', 'Video_GetSearch');
    body.set('keyword', 'Wednesday Message');
    body.set('count', '4');
    body.set('page', this.page.toString());
    this.http.post('http://cums.the-v.net/site.aspx', body, this.options)
      .subscribe(resp => {
        this.latest = resp.json()[0];
        this.vids = resp.json();
        this.vids.shift();
      },
        err => {
          this.loadContentFromDB();
          load.dismiss();
          this.hideView = false;
        },
        () => {
          this.saveContentToDB(this.latest,this.vids);
          load.dismiss();
          this.hideView = false;
        });
  }
  loadMore() {
    this.storage.get(IS_LOGGED_IN_KEY).then(loggedIn => {
      if (loggedIn) {
        this.page++;
        let body = new URLSearchParams();
        body.set('action', 'Video_GetSearch');
        body.set('keyword', 'Wednesday Message');
        body.set('count', '4');
        body.set('page', this.page.toString());
        this.http.post('http://cums.the-v.net/site.aspx', body, this.options)
          .subscribe(resp => {
            this.vids = this.vids.concat(resp.json());
          },
            err => {

              //show error message
            },
            () => {
              this.hideView = false;
            });
      }
      else {
        let alert = this.alertCtrl.create({
          title: 'Oops!',
          message: 'Please Login to load more videos.',
          buttons: [
            {
              text: 'Login',
              role: 'cancel',
              handler: () => {
                this.navCtrl.push(LoginPage);
              }
            }, {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
              }
            }]
        });
        alert.present();
      }
    });
  }
  playVideo(id, restricted?) {
    if (restricted) {
      this.storage.get(IS_LOGGED_IN_KEY).then(loggedIn => {
        if (loggedIn) {
          this.navCtrl.push(NowPlayingPage, {
            id: id
          })
        }
        else {
          let alert = this.alertCtrl.create({
            title: 'Oops!',
            message: 'Please Login to view other videos.',
            buttons: [
              {
                text: 'Login',
                role: 'cancel',
                handler: () => {
                  this.navCtrl.push(LoginPage);
                }
              }, {
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
    else {
      this.navCtrl.push(NowPlayingPage, {
        id: id
      })
    }
  }
  private prepareDB() {
    return openSqliteDb(this.sql).then(db => {
      return new Promise<SQLiteObject>((resolve, reject) => {
        try {
          db.executeSql(`CREATE TABLE IF NOT EXISTS homeContent(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bcid CHAR(13) NOT NULL,
        image TEXT NOT NULL,
        time TEXT NOT NULL,
        days TEXT,
        title TEXT NOT NULL,
        language TEXT NOT NULL,
        description TEXT)`, [])
            .then(() => { resolve(db); })
            .catch(e => { reject(e); })
        } catch (e) {
          reject(e);
        }
      });
    });
  }
  private loadContentFromDB() {
    this.prepareDB().then(db=>{
      db.executeSql(`SELECT * FROM homeContent WHERE days IS NULL OR days=''`,[])
      .then(latest=>{
        console.log(latest);
        this.latest = latest.rows.item(0);
        db.executeSql(`SELECT * FROM homeContent WHERE description IS NULL OR description=''`,[])
        .then(vids=>{
          for(var i=0;i<vids.rows.length;i++){
            console.log(vids.rows.item(i));
            this.vids.push(vids.rows.item(i));
          }
        })
      })
    })
  }
  private saveContentToDB(latest, vids) {
    this.prepareDB().then(db => {
      db.executeSql('DELETE FROM homeContent', []).then(() => {
        db.executeSql('INSERT INTO homeContent(bcid,image,time,title,language,description) VALUES (?,?,?,?,?,?)',
          [latest.bcid, latest.image, latest.time, latest.title, latest.language, latest.description])
          .then(a => {
            if (a.rowsAffected === 1) {
              //success
              for(let v of vids){
                db.executeSql('INSERT INTO homeContent(bcid,image,days,time,title,language) VALUES (?,?,?,?,?,?)',
                  [v.bcid, v.image, v.days, v.time, v.title, v.language]).then(a=>{
                    //console.log(a);
                  })
                }
            }
            else {
              //error
            }
          })
      })
    })
  }
}
