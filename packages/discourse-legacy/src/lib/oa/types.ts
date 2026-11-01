import {
    IImage,
    IModerationStatus,
    IOpeningHours,
    IConvertedFileMeta,
    IModerable,
    IPlasticType,
    IUploadedFileMeta,
    I_OSR_USER
} from '@polymech/commons'



/// Taxonomy
export interface IOACategory {
    _created: string
    _id: string
    _deleted: boolean
    label: string
    _modified: string
}

export interface IOATag {
    categories: string[]
    image: string
    _created: string
    _deleted: boolean
    label: string
    _createdBy: string
    _modified: string
    _id: string
}

// Howtos

export type IOADifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Very Hard'

export interface IDImage {
    id: number
    url: string
    original_filename: string
    filesize: number
    width: number
    height: number
    thumbnail_width: number
    thumbnail_height: number
    extension: string
    short_url: string
    short_path: string
    retain_hours: any
    human_filesize: string
}


export interface IOAHowto {
    moderation: string
    category: IOACategory
    previousSlugs: string[]
    total_downloads: number
    _createdBy: string
    slug: string
    cover_image: IUploadedFileMeta
    _modified: string
    files: any[]
    description: string
    mentions: any[]
    time: string
    _created: string
    fileLink: string
    steps: IOAStep[]
    creatorCountry: string
    title: string
    tags: IOATags
    _id: string
    _deleted: boolean
    total_views: number
    difficulty_level: IOADifficultyLevel
    comments: any[]
    user: IImportUser
    pics?: string[]
}

export interface IOAStep {
    _animationKey: string
    images: IUploadedFileMeta[]
    text: string
    title: string
}
export interface IOATags {
    [key: string]: boolean
}


export type IOAHowtoImport = IOAHowto &
{
    post_id?: number | string
    topic_id?: number
    oF?: boolean
    updatedTags?: boolean

    updatedTime8?: boolean
    _updatedContent1?: boolean

}


export interface IImportUser extends I_OSR_USER {
    f_id: number
    upload_id: number
    avatar: string
    _didSetAvatar: boolean
    _didSetGroup: boolean
    alreadyExists: boolean
    invalidData: boolean
    didUpdateName: boolean

    profileHeader?: IDImage
    cardBackground?: IDImage
    avatarImage?: IDImage
}