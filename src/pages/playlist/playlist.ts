import { Component } from '@angular/core';
import {  NavController, NavParams, AlertController, LoadingController } from 'ionic-angular';
import { VideoDetails } from '../../app/models/video.models';
import { Storage } from "@ionic/storage";
import { PlaylistService } from '../../app/sevices/playlist.service';
import { VideoService } from '../../app/sevices/video.service';
import { USER_ID_KEY } from '../../app/app.constants';
import { NowPlayingPage } from '../now-playing/now-playing';
import { DownloadEntry } from '../../app/models/download.models';
import { GoogleAnalyticsService } from '../../app/sevices/analytics.service';

/**
 * Generated class for the PlaylistPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

 
@Component({
  selector: 'page-playlist',
  templateUrl: 'playlist.html',
})
export class PlaylistPage {

  private playlistVideos: VideoDetails[] = [];
  constructor(public navCtrl: NavController, 
    private storage: Storage,
    private playlistService: PlaylistService,
    private videoService: VideoService,
    public navParams: NavParams,
    private alertController:AlertController,
    private loading: LoadingController,
    private gaSvc:GoogleAnalyticsService) {
  }
  ionViewDidEnter() {
    this.refreshPlaylist();
    this.gaSvc.gaTrackPageEnter('Playlist');
  }

  playVideo(entry: DownloadEntry) {
    this.gaSvc.gaEventTracker('Playlist', 'Play Video', 'Play single video from playlist');
    this.navCtrl.push(NowPlayingPage, {
      id: entry.id,
      playAll: false
    });
  }

  playAll() {
    this.gaSvc.gaEventTracker('Playlist', 'Play All Video', 'Play All video from playlist');
    if (this.playlistVideos.length > 0) {
      this.navCtrl.push(NowPlayingPage, {
        id: null,
        playAll: true
      });
    }
  }

  refreshPlaylist() {
    let load: any = this.loading.create({
      spinner: "crescent",
      content: "Loading...",
      enableBackdropDismiss: true
    });
    load.present();
    this.storage.get(USER_ID_KEY).then(userData => {
      if (userData) {
        return this.playlistService.getPlaylistOf(userData);
      } else {
        throw new Error('user_not_logged_in');
      }
    }).then(entries => {
      return Promise.all(entries.map(entry => {
        return this.videoService.getDetails(entry.bcid);
      }));
    }).then(videoDetails => {
      this.playlistVideos = videoDetails;
      load.dismiss();
    }).catch(e => {
      console.error(JSON.stringify(e));
      load.dismiss();
    });
  }
  removeFromPlaylist(id) {
    this.playlistService.removeVideoFromPlaylist(id).then(isSuccessful => {
      this.refreshPlaylist();

      if (isSuccessful) {
        let alert = this.alertController.create({
          title: 'Removed from playlist',
          message: 'The video has been successfully removed from your playlist!',
          buttons: [{
            text: 'OK', 
            role:'cancel',
            handler:()=>{
            }
          }]
        });
        alert.present();
        this.gaSvc.gaEventTracker('Playlist', 'Remove Video', 'Removed video from playlist');
      } else {
        let alert = this.alertController.create({
          title: 'Failed to Add to Playlist',
          message: 'The video was not successfully added to your playlist.',
          buttons: [{
            text: 'OK', 
            role:'cancel',
            handler:()=>{
            }
          }]
        });
        alert.present();
      }
    })
  }
}
