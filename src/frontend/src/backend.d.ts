import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Timestamp = bigint;
export interface ScrapbookPost {
    id: string;
    note: string;
    createdAt: bigint;
    photoKey: string;
    author: Principal;
}
export interface Letter {
    id: LetterId;
    patternKey?: string;
    note: string;
    createdAt: Timestamp;
    isRead: boolean;
    sender: Principal;
    envelopeTexture: EnvelopeTexture;
    receiverLink: string;
    secretNote?: string;
    openWhenTime?: Timestamp;
    musicLoop?: MusicLoop;
    unboxingType: UnboxingType;
    photos: Array<Photo>;
}
export interface CreateLetterInput {
    patternKey?: string;
    note: string;
    envelopeTexture: EnvelopeTexture;
    receiverLink: string;
    secretNote?: string;
    openWhenTime?: Timestamp;
    musicLoop?: MusicLoop;
    unboxingType: UnboxingType;
    photos: Array<Photo>;
}
export interface Scrapbook {
    id: ScrapbookId;
    creator: Principal;
    members: Array<Principal>;
    name: string;
    createdAt: bigint;
    posts: Array<ScrapbookPost>;
}
export interface AlbumEntry {
    photoKeys: Array<string>;
    note: string;
    addedAt: bigint;
    contributor: Principal;
}
export interface Charm {
    id: string;
    charmType: CharmType;
    labelText: string;
    presetId: string;
    position: bigint;
    customKey?: string;
}
export interface Album {
    id: AlbumId;
    theme: string;
    creator: Principal;
    name: string;
    createdAt: bigint;
    completed: boolean;
    memberQueue: Array<Principal>;
    currentHolderIdx: bigint;
    entries: Array<AlbumEntry>;
}
export type ScrapbookId = string;
export interface PhoneStrap {
    owner: Principal;
    charms: Array<Charm>;
}
export type LetterId = string;
export type AlbumId = string;
export interface UserProfile {
    name: string;
    besties: Array<Principal>;
    avatar?: ExternalBlob;
}
export interface Photo {
    blob: ExternalBlob;
}
export enum CharmType {
    custom = "custom",
    preset = "preset"
}
export enum EnvelopeTexture {
    gingham = "gingham",
    frosted = "frosted",
    holographic = "holographic"
}
export enum MusicLoop {
    lofi = "lofi",
    kawaiiPop = "kawaiiPop"
}
export enum UnboxingType {
    musicBox = "musicBox",
    polaroidStack = "polaroidStack",
    strawberryJar = "strawberryJar",
    cloverField = "cloverField",
    fruitSoda = "fruitSoda",
    secretLocket = "secretLocket",
    openWhen = "openWhen",
    cdStickerPeeler = "cdStickerPeeler"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAlbumContent(albumId: AlbumId, photoKeys: Array<string>, note: string): Promise<boolean>;
    addBestie(bestie: Principal): Promise<void>;
    addCharm(charm: Charm): Promise<void>;
    addScrapbookPost(scrapbookId: ScrapbookId, photoKey: string, note: string): Promise<boolean>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAlbum(name: string, theme: string, members: Array<Principal>): Promise<AlbumId>;
    createLetter(input: CreateLetterInput): Promise<LetterId>;
    createScrapbook(name: string, members: Array<Principal>): Promise<ScrapbookId>;
    getAlbum(id: AlbumId): Promise<Album | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getInbox(receiverLink: string): Promise<Array<Letter>>;
    getLetter(id: LetterId): Promise<Letter | null>;
    getMyAlbums(): Promise<Array<Album>>;
    getMyScrapbooks(): Promise<Array<Scrapbook>>;
    getMyStrap(): Promise<PhoneStrap>;
    getScrapbook(id: ScrapbookId): Promise<Scrapbook | null>;
    getScrapbookPosts(id: ScrapbookId): Promise<Array<ScrapbookPost> | null>;
    getSent(): Promise<Array<Letter>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markRead(id: LetterId): Promise<void>;
    passAlbum(albumId: AlbumId): Promise<boolean>;
    removeBestie(bestie: Principal): Promise<void>;
    removeCharm(charmId: string): Promise<boolean>;
    reorderCharms(charmIds: Array<string>): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveMyStrap(charms: Array<Charm>): Promise<void>;
    setProfile(profile: UserProfile): Promise<void>;
}
