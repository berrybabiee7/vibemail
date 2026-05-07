import type { _ImmutableObjectStorageCreateCertificateResult, _ImmutableObjectStorageRefillInformation, _ImmutableObjectStorageRefillResult, backendInterface, UserProfile, Letter, LetterId, UserRole, EnvelopeTexture, UnboxingType, Scrapbook, ScrapbookId, Album, AlbumId, PhoneStrap, Charm } from "../backend";
import { Principal } from "@icp-sdk/core/principal";

const mockPrincipal = Principal.anonymous();

const sampleLetter1: Letter = {
  id: "letter-001",
  note: "Hey bestie!! I've been thinking of you so much lately 💕 hope this makes you smile!",
  createdAt: BigInt(Date.now() * 1_000_000),
  isRead: false,
  sender: mockPrincipal,
  envelopeTexture: "gingham" as unknown as EnvelopeTexture,
  receiverLink: "bestie-link-1",
  secretNote: "psst... you're my favorite person 🌸",
  musicLoop: "kawaiiPop" as any,
  unboxingType: "polaroidStack" as unknown as UnboxingType,
  photos: [],
};

const sampleLetter2: Letter = {
  id: "letter-002",
  note: "Sending you ALL the good vibes today!! ✨🍓",
  createdAt: BigInt((Date.now() - 86400000) * 1_000_000),
  isRead: true,
  sender: mockPrincipal,
  envelopeTexture: "holographic" as unknown as EnvelopeTexture,
  receiverLink: "bestie-link-2",
  musicLoop: "lofi" as any,
  unboxingType: "fruitSoda" as unknown as UnboxingType,
  photos: [],
};

const sampleLetter3: Letter = {
  id: "letter-003",
  note: "Open when you need a little extra sparkle in your day 🌟💫",
  createdAt: BigInt((Date.now() - 172800000) * 1_000_000),
  isRead: false,
  sender: mockPrincipal,
  envelopeTexture: "frosted" as unknown as EnvelopeTexture,
  receiverLink: "bestie-link-3",
  openWhenTime: BigInt((Date.now() + 3600000) * 1_000_000),
  unboxingType: "openWhen" as unknown as UnboxingType,
  photos: [],
};

const sampleProfile: UserProfile = {
  name: "Sakura ✨",
  besties: [],
};

export const mockBackend: backendInterface = {
  addBestie: async (_bestie: Principal) => undefined,
  assignCallerUserRole: async (_user: Principal, _role: UserRole) => undefined,
  createLetter: async (_input): Promise<LetterId> => "letter-new-" + Date.now(),
  getCallerUserProfile: async (): Promise<UserProfile | null> => sampleProfile,
  getCallerUserRole: async (): Promise<UserRole> => "user" as unknown as UserRole,
  getInbox: async (_receiverLink: string): Promise<Letter[]> => [sampleLetter1, sampleLetter2, sampleLetter3],
  getLetter: async (_id: LetterId): Promise<Letter | null> => sampleLetter1,
  getSent: async (): Promise<Letter[]> => [sampleLetter2, sampleLetter3],
getUserProfile: async (_user: Principal): Promise<UserProfile | null> => sampleProfile,
  isCallerAdmin: async (): Promise<boolean> => false,
  markRead: async (_id: LetterId) => undefined,
  removeBestie: async (_bestie: Principal) => undefined,
  saveCallerUserProfile: async (_profile: UserProfile) => undefined,
  setProfile: async (_profile: UserProfile) => undefined,
  // Scrapbooks
  createScrapbook: async (_name: string, _members: Principal[]): Promise<ScrapbookId> => "scrapbook-001",
  getScrapbook: async (_id: ScrapbookId): Promise<Scrapbook | null> => ({
    id: "scrapbook-001",
    name: "Bestie Scrapbook 🌸",
    creator: mockPrincipal,
    members: [mockPrincipal],
    createdAt: BigInt(Date.now() * 1_000_000),
    posts: [
      { id: "post-1", note: "Summer memories ☀️🍓", photoKey: "", author: mockPrincipal, createdAt: BigInt((Date.now() - 86400000) * 1_000_000) },
      { id: "post-2", note: "Clover picking at the park! 🍀", photoKey: "", author: mockPrincipal, createdAt: BigInt((Date.now() - 172800000) * 1_000_000) },
    ],
  }),
  getMyScrapbooks: async (): Promise<Scrapbook[]> => ([{
    id: "scrapbook-001",
    name: "Bestie Scrapbook 🌸",
    creator: mockPrincipal,
    members: [mockPrincipal],
    createdAt: BigInt(Date.now() * 1_000_000),
    posts: [
      { id: "post-1", note: "Summer memories ☀️🍓", photoKey: "", author: mockPrincipal, createdAt: BigInt((Date.now() - 86400000) * 1_000_000) },
    ],
  }]),
  addScrapbookPost: async (_id: ScrapbookId, _photoKey: string, _note: string): Promise<boolean> => true,
  getScrapbookPosts: async (_id: ScrapbookId) => ([
    { id: "post-1", note: "Summer memories ☀️🍓", photoKey: "", author: mockPrincipal, createdAt: BigInt((Date.now() - 86400000) * 1_000_000) },
    { id: "post-2", note: "Clover picking at the park! 🍀", photoKey: "", author: mockPrincipal, createdAt: BigInt((Date.now() - 172800000) * 1_000_000) },
  ]),
  // Albums
  createAlbum: async (_name: string, _theme: string, _members: Principal[]): Promise<AlbumId> => "album-001",
  getAlbum: async (_id: AlbumId): Promise<Album | null> => ({
    id: "album-001",
    name: "Cherry Blossom Trip 🌸",
    theme: "spring",
    creator: mockPrincipal,
    createdAt: BigInt(Date.now() * 1_000_000),
    completed: false,
    memberQueue: [mockPrincipal],
    currentHolderIdx: BigInt(0),
    entries: [
      { photoKeys: [], note: "First stop — the clover field! 🍀", addedAt: BigInt((Date.now() - 86400000) * 1_000_000), contributor: mockPrincipal },
    ],
  }),
  getMyAlbums: async (): Promise<Album[]> => ([
    {
      id: "album-001",
      name: "Cherry Blossom Trip 🌸",
      theme: "spring",
      creator: mockPrincipal,
      createdAt: BigInt(Date.now() * 1_000_000),
      completed: false,
      memberQueue: [mockPrincipal],
      currentHolderIdx: BigInt(0),
      entries: [
        { photoKeys: [], note: "First stop — the clover field! 🍀", addedAt: BigInt((Date.now() - 86400000) * 1_000_000), contributor: mockPrincipal },
      ],
    },
    {
      id: "album-002",
      name: "Strawberry Picking Day 🍓",
      theme: "summer",
      creator: mockPrincipal,
      createdAt: BigInt((Date.now() - 604800000) * 1_000_000),
      completed: true,
      memberQueue: [mockPrincipal],
      currentHolderIdx: BigInt(0),
      entries: [],
    },
  ]),
  addAlbumContent: async (_albumId: AlbumId, _photoKeys: string[], _note: string): Promise<boolean> => true,
  passAlbum: async (_albumId: AlbumId): Promise<boolean> => true,
  // Phone Strap
  getMyStrap: async (): Promise<PhoneStrap> => ({
    owner: mockPrincipal,
    charms: [
      { id: "charm-1", charmType: "preset" as any, labelText: "🍓", presetId: "strawberry", position: BigInt(0) },
      { id: "charm-2", charmType: "preset" as any, labelText: "🍀", presetId: "clover", position: BigInt(1) },
      { id: "charm-3", charmType: "preset" as any, labelText: "🐞", presetId: "ladybug", position: BigInt(2) },
    ],
  }),
  saveMyStrap: async (_charms: Charm[]): Promise<void> => undefined,
  addCharm: async (_charm: Charm): Promise<void> => undefined,
  removeCharm: async (_charmId: string): Promise<boolean> => true,
  reorderCharms: async (_charmIds: string[]): Promise<boolean> => true,
  _immutableObjectStorageBlobsAreLive: async (_hashes: Array<Uint8Array>): Promise<Array<boolean>> => [],
  _immutableObjectStorageBlobsToDelete: async (): Promise<Array<Uint8Array>> => [],
  _immutableObjectStorageConfirmBlobDeletion: async (_blobs: Array<Uint8Array>): Promise<void> => undefined,
  _immutableObjectStorageCreateCertificate: async (_blobHash: string): Promise<_ImmutableObjectStorageCreateCertificateResult> => ({ method: "", blob_hash: "" }),
  _immutableObjectStorageRefillCashier: async (_info: _ImmutableObjectStorageRefillInformation | null): Promise<_ImmutableObjectStorageRefillResult> => ({}),
  _immutableObjectStorageUpdateGatewayPrincipals: async (): Promise<void> => undefined,
  _initializeAccessControl: async (): Promise<void> => undefined,
};
