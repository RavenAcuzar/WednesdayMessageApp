import { Injectable } from "@angular/core";
import { Http, Headers, Response } from "@angular/http";
import { encodeObject, openSqliteDb } from "../app.utils";
import { VideoDetails, VideoComment } from "../models/video.models";
import { PlaylistService } from "./playlist.service";
import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/toPromise'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/do'
import { SQLiteObject, SQLite } from "@ionic-native/sqlite";
import { Storage } from "@ionic/storage";
import { USER_ID_KEY } from "../app.constants";

@Injectable()
export class VideoService {
    private static API_URL = 'http://cums.the-v.net/site.aspx'

    constructor(
        private http: Http,
        private sqlite: SQLite,
        private playlistService: PlaylistService,
        private userService: Storage
    ) { }

    getDetails(id: string) {
        let headers = new Headers()
        headers.set('Content-Type', 'application/x-www-form-urlencoded')

        return this.http.post(VideoService.API_URL, encodeObject({
            'action': 'Video_GetDetails',
            'idorname': id
        }), { headers: headers }).map((response, index) => {
            let videoDetailsArray = <VideoDetails[]>response.json();
            let mapped = this.getMappedVideoDetailsArray(videoDetailsArray);
            return mapped[0];
        }).toPromise<VideoDetails>();
    }

    getComments(id: string) {
        let headers = new Headers()
        headers.set('Content-Type', 'application/x-www-form-urlencoded')

        return this.http.post(VideoService.API_URL, encodeObject({
            'action': 'Comment_GetComment',
            'title': id
        }), { headers: headers }).map(response => {
            return <VideoComment[]>response.json();
        }).toPromise<VideoComment[]>().then(comments => {
            let promises: Promise<VideoComment>[] = [];
            comments.forEach(c => {
                let promise = this.userService.get(USER_ID_KEY).then(ud => {
                    if (c) {
                        c.mapped = {
                            userImageUrl: `http://site.the-v.net/Widgets_Site/avatar.ashx?id=${c.UserId}`
                        }
                        return c;
                    }
                });
                promises.push(promise);
            })
            return Promise.all(promises)
        })
    }

    isAddedToPlaylist(id: string, userId: string) {
        return this.playlistService.isVideoAddedToPlaylist(userId, id);
    }

    addComment(id: string, userId: string, comment: string) {
        let headers = new Headers();
        headers.set('Content-Type', 'application/x-www-form-urlencoded');

        return this.http.post(VideoService.API_URL, encodeObject({
            'action': 'Comment_AddComment',
            'bcid': id,
            'userid': userId,
            'comment': comment,
            'ctype': 'Video'
        }), { headers: headers }).map(response => {
            return response.json();
        }).toPromise().then(data => {
            switch (data[0].Data) {
                case 'True':{
                    return true;
                }
                case 'False':
                    return false;
                default:
                    throw new Error('Unknown response value');
            }
        });
    }

    addToPlaylist(id: string, userId: string) {
        return this.playlistService.addVideoFor(userId, id);
    }

    private getMappedVideoDetailsArray(videoDetailsArray: VideoDetails[]) {
        return videoDetailsArray.map(videoDetail => {
            videoDetail.mapped = {
                tags: videoDetail.tags.split(',').map(t => t.trim()),
                availableLanguages: videoDetail.tags.split(',').map(t => t.trim()),

                numOfViews: parseInt(videoDetail.views),
                numOfPlays: parseInt(videoDetail.plays),
                numOfPoints: parseInt(videoDetail.points),
                numOfLikes: parseInt(videoDetail.likes),
                numOfComments: parseInt(videoDetail.comments),

                isApproved: videoDetail.isapproved.toLowerCase() === 'true',
                isRecommended: videoDetail.is_recommended.toLowerCase() === 'true',
                isHighlighted: videoDetail.isHighlighted.toLowerCase() === 'true',
                isDownloadable: videoDetail.videoDl.toLowerCase() !== 'locked',
                canBeAccessedAnonymously: videoDetail.videoPrivacy.toLowerCase() === 'public',

                imageUrl: `${videoDetail.image}`,
                channelImageUrl: `http://site.the-v.net/Widgets_Site/J-Gallery/Image.ashx?id=${videoDetail.channelId}&type=channel`,
                playerUrl: `http://players.brightcove.net/3745659807001/67a68b89-ec28-4cfd-9082-2c6540089e7e_default/index.html?videoId=${videoDetail.id}`
            }
            return videoDetail;
        });
    }
}