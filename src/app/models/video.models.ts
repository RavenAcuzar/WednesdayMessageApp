
export type VideoDetails = {
    id: string,
    bcid: string,
    runningNum: string,

    name: string,
    title: string,
    category: string,
    description: string,
    language: string,
    premium: string,
    tags: string,
    
    points: string,
    level: string,

    views: string,
    likes: string,
    comments: string,
    plays: string,

    image: string,
    videoUrl?: string,
    videoUrlReal: string,
    
    days: string, // from createdOn
    time: string,

    videoDl: string,
    videoPrivacy: string,

    isapproved: string,
    isHighlighted: string,
    is_recommended: string,

    user_id: string,
    imageUser: string,
    ownerRank: string,
    ownerJoined: string,
    channelId: string,
    channelName: string,

    createdOn: string,
    createdBy: string,

    mapped: {
        tags: string[],
        availableLanguages: string[],
        
        numOfViews: number,
        numOfPlays: number,
        numOfPoints: number,
        numOfLikes: number,
        numOfComments: number,

        isRecommended: boolean,
        isApproved: boolean,
        isHighlighted: boolean,
        isDownloadable: boolean,
        canBeAccessedAnonymously: boolean,

        imageUrl: string,
        channelImageUrl: string,
        playerUrl: string
    }
}

export type VideoComment = {
    Id: string,
    UserId: string,
    Comment: string,
    CreatedOn: string,
    CreatedBy: string,

    mapped: {
        userImageUrl: string
    }
}