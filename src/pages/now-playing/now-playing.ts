import { Component, ViewChild, ElementRef } from '@angular/core';
import {  NavController, NavParams, AlertController, ToastController } from 'ionic-angular';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import { VideoDetails, VideoComment } from '../../app/models/video.models';
import { Subscription } from 'rxjs/Subscription';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { VideoService } from '../../app/sevices/video.service';
import { PlaylistService } from '../../app/sevices/playlist.service';
import { Storage } from '@ionic/storage';
import { USER_ID_KEY } from '../../app/app.constants';
import { LoginPage } from '../login/login';
import { GoogleAnalyticsService } from '../../app/sevices/analytics.service';
/**
 * Generated class for the NowPlayingPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

 
@Component({
  selector: 'page-now-playing',
  templateUrl: 'now-playing.html',
})
export class NowPlayingPage {
  @ViewChild('videoPlayer') videoplayer: ElementRef;
  @ViewChild('content') content;
  private videoId: string;
  private videoDetails: VideoDetails;
  private playlistVideoIds: string[] = [];
  private playlistVideoDetails: VideoDetails[] = [];
  private videoComments: VideoComment[] = [];
  private safeVideoUrl: SafeResourceUrl;
  private userImageUrl: string;
  private playlistIndex = 0;
  private isVideoAddedToPlaylist = false;
  private shouldPlayPlaylist = false;
  private isDisplayingPlaylist = false;
  private commentContent: string = '';
  private isVideoFullscreen: boolean = false;
  private orientationSubscription: Subscription;
  private isLoading = false;
  private isLoggedIn = false;
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    private sanitizer:DomSanitizer,
    private screenOrientation: ScreenOrientation,
    private videoService: VideoService,
    private playlistService: PlaylistService,
    private storage: Storage,
    private alertController: AlertController,
    private toastCtrl: ToastController,
    private gaSvc:GoogleAnalyticsService ) {
    this.shouldPlayPlaylist = navParams.get('playAll');
    this.videoId=this.navParams.get('id');
  }
  loaded() {
    this.videoplayer.nativeElement.contentDocument.body.style.width="100vw";
  }
  ionViewDidLoad() {
    this.gaSvc.gaTrackPageEnter('Playing Video');
    this.orientationSubscription = this.screenOrientation.onChange().subscribe(() => {
      this.isVideoFullscreen = !this.isOrientationPortrait(this.screenOrientation.type);
      this.videoplayer.nativeElement.contentDocument.location.reload();
    });
    if (!this.shouldPlayPlaylist) {
      this.goToVideo(this.videoId);
    } else {
      this.getPlaylistAndPlayFirstVideo();
    }
    //this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl("http://players.brightcove.net/3745659807001/67a68b89-ec28-4cfd-9082-2c6540089e7e_default/index.html?videoId="+this.vidId);
  }
  ionViewWillLeave() {
    this.orientationSubscription.unsubscribe();
  }
  commentOnVideo() {
    // retrieve first the details of the user
    this.storage.get(USER_ID_KEY).then(userData => {
      console.log(userData);
      if (userData) {
        // request for add comment to video
        return this.videoService.addComment(this.videoId, userData, this.commentContent);
      } else {
        throw new Error('not_logged_in');
      }
    }).then(isSuccessful => {
      // check if the comment was successfully posted
      if (isSuccessful) {
        // refresh comment section and clear comment box
        this.commentContent = '';
        this.videoService.getComments(this.videoId).then(comments => {
          this.videoComments = comments;
          this.gaSvc.gaEventTracker('Video', 'Comment', 'Commented on a video');
        });
      } else {
        this.showErrorAlertOnVideoComment();
      }
    }).catch(e => {
      let unknownError = (e) => {
        console.error(JSON.stringify(e));
        this.showErrorAlertOnVideoComment();
      };

      if (e instanceof Error) {
        switch (e.message) {
          case 'not_logged_in':
            let toast = this.toastCtrl.create({
              duration: 1000,
              position: 'bottom',
              showCloseButton: true,
              closeButtonText: 'Login',
              dismissOnPageChange: true,
              message: 'Login to comment on this video.',
            });
            toast.onDidDismiss(() => {
              this.navCtrl.push(LoginPage);
            });
            toast.present();
            break;
          default:
            unknownError(e);
            break;
        }
      } else {
        unknownError(e);
      }
    });
  }
  addVideoToPlaylist() {
    if (this.isVideoAddedToPlaylist) {
      this.showAlertVideoAlreadyInPlaylist();
    } else {
      // retrieve first the details of the user
      this.storage.get(USER_ID_KEY).then(userData => {
        // user is not logged in if the userdata is null
        if (userData) {
          return this.videoService.addToPlaylist(this.videoId, userData);
        } else {
          throw new Error('not_logged_in');
        }
      }).then(isSuccessful => {
        if (isSuccessful) {
          this.showAlertVideoAddedToPlaylist();
          this.isVideoAddedToPlaylist = true;
          this.gaSvc.gaEventTracker('Video', 'Add to Playlist', 'Video Added to playlist');
        } else {
          this.showAlertVideoNotAddedToPlaylist();
        }
      }).catch(e => {
        let unknownError = (e) => {
          console.error(JSON.stringify(e));
          this.showErrorAlertOnVideoPlaylist();
        };

        if (e instanceof Error) {
          switch (e.message) {
            case 'not_logged_in':
              let toast = this.toastCtrl.create({
                duration: 1000,
                position: 'bottom',
                showCloseButton: true,
                closeButtonText: 'Login',
                dismissOnPageChange: true,
                message: 'Login to add this video to your playlist.',
              });
              toast.onDidDismiss(() => {
                this.navCtrl.push(LoginPage);
              });
              toast.present();
              break;
            case 'already_in_playlist':
              this.showAlertVideoAlreadyInPlaylist();
              break;
            default:
              unknownError(e);
              break;
          }
        } else {
          unknownError(e);
        }
      });
    }
  }
  goToVideo(id: string, playFromPlaylist: boolean = false) {
    if (!playFromPlaylist && this.shouldPlayPlaylist) {
      this.shouldPlayPlaylist = false;
      this.isDisplayingPlaylist = false;
      this.playlistIndex = 0;
      this.playlistVideoIds = [];
      this.playlistVideoDetails = [];
    }

    this.isLoading = true;
    this.videoId = id;
    // initialize screen orientation variable
    this.isVideoFullscreen = !this.isOrientationPortrait(this.screenOrientation.type);

    // get video information
    let detailsPromise = this.videoService.getDetails(this.videoId).then(details => {
      console.log(details);
      this.videoDetails = details;
      this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.videoDetails.mapped.playerUrl);
      return this.storage.get(USER_ID_KEY);
    }).then(userData => {
      this.isLoggedIn = userData !== null;
      console.log(userData);
      if (this.isLoggedIn) {
        this.userImageUrl = `http://site.the-v.net/Widgets_Site/avatar.ashx?id=${userData}`;

        // check if the video has been added to the playlist by the user
        this.videoService.isAddedToPlaylist(this.videoId, userData).then(isAdded => {
          this.isVideoAddedToPlaylist = isAdded;
        }).catch(e => {
          console.log(e);
        });
      }
    });
    let commentsPromise = this.videoService.getComments(this.videoId).then(comments => {
      this.videoComments = comments;
      console.log(comments);
    });
    Promise.all([detailsPromise, commentsPromise]).then(_ => {
      this.isLoading = false;
      if (this.content) {
        //this.content.scrollToTop();
      }
    })
  }

  viewPlaylist() {
    this.isDisplayingPlaylist = !this.isDisplayingPlaylist;
  }

  playNextVideo() {
    if (this.hasNextVideoInPlaylist())
      this.goToVideo(this.playlistVideoIds[++this.playlistIndex], true);
  }

  playPrevVideo() {
    if (this.hasPreviousVideoInPlaylist())
      this.goToVideo(this.playlistVideoIds[--this.playlistIndex], true);
  }

  playVideoInPlaylist(index: number) {
    if (this.playlistIndex === index)
      return;

    this.playlistIndex = index;
    this.goToVideo(this.playlistVideoIds[index], true);
  }

  private getPlaylistAndPlayFirstVideo() {
    this.storage.get(USER_ID_KEY).then(userdata => {
      return this.playlistService.getPlaylistOf(userdata);
    }).then(playlistEntries => {
      return playlistEntries.map(pe => String(pe.bcid));
    }).then(videoDetails => {
      this.playlistVideoIds = videoDetails;
      return Promise.all(this.playlistVideoIds.map(id => {
        return this.videoService.getDetails(id);
      }));
    }).then(playlistVideos => {
      this.playlistVideoDetails = playlistVideos;
      this.goToVideo(this.playlistVideoIds[this.playlistIndex], true);
    });
  }

  private hasNextVideoInPlaylist() {
    return this.playlistIndex < (this.playlistVideoIds.length - 1);
  }

  private hasPreviousVideoInPlaylist() {
    return this.playlistIndex > 0;
  }
  private isOrientationPortrait(type: string): boolean {
    switch (type) {
      case 'portrait':
      case 'portrait-primary':
      case 'portrait-secondary':
        return true;
      case 'landscape':
      case 'landscape-primary':
      case 'landscape-secondary':
        return false;
    }
  }
  private showAlertVideoAddedToPlaylist() {
    let alert = this.alertController.create({
      title: 'Added to Playlist',
      message: 'The video has been successfully added to your playlist!',
      buttons: [{
        text: 'OK',
        role: 'cancel', 
        handler: () => {
        }
      }]
    });
    alert.present();
  }
  private showAlertVideoNotAddedToPlaylist() {
    let alert = this.alertController.create({
      title: 'Failed to Add to Playlist',
      message: 'The video was not successfully added to your playlist.',
      buttons: [{
        text: 'OK',
        role: 'cancel', 
        handler: () => {
        }
      }]
    });
    alert.present();
  }
  private showAlertVideoAlreadyInPlaylist() {
    let alert = this.alertController.create({
      title: 'Oops!',
      message: 'This video has already been added to your playlist!',
      buttons: [{
        text: 'OK',
        role: 'cancel', 
        handler: () => {
        }
      }]
    });
    alert.present();
  }
  private showErrorAlertOnVideoPlaylist() {
    let alert = this.alertController.create({
      title: 'Oops!',
      message: 'An error occurred while trying to add the video to your playlist. Please try again.',
      buttons: [{
        text: 'OK',
        role: 'cancel', 
        handler: () => {
        }
      }]
    });
    alert.present();
  }

  private showErrorAlertOnVideoComment() {
    let alert = this.alertController.create({
      title: 'Oh no!',
      message: 'Your comment was not successfully posted. Please try again',
      buttons: [{
        text: 'OK',
        role: 'cancel', 
        handler: () => {
        }
      }]
    });
    alert.present();
  }

}
