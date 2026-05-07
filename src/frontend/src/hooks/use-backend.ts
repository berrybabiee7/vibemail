import { useActor } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import type {
  Album,
  AlbumId,
  Charm,
  CreateLetterInput,
  Letter,
  LetterId,
  PhoneStrap,
  Scrapbook,
  ScrapbookId,
  UserProfile,
} from "../backend";

function useBackendActor() {
  return useActor(createActor);
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export function useMyProfile() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<UserProfile | null>({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile(user: Principal | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<UserProfile | null>({
    queryKey: ["profile", user?.toText()],
    queryFn: async () => {
      if (!actor || !user) return null;
      return actor.getUserProfile(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useSaveProfile() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("No actor");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", "me"] }),
  });
}

export function useAddBestie() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bestie: Principal) => {
      if (!actor) throw new Error("No actor");
      return actor.addBestie(bestie);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", "me"] }),
  });
}

export function useRemoveBestie() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bestie: Principal) => {
      if (!actor) throw new Error("No actor");
      return actor.removeBestie(bestie);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", "me"] }),
  });
}

// ─── Letters ─────────────────────────────────────────────────────────────────

export function useCreateLetter() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation<LetterId, Error, CreateLetterInput>({
    mutationFn: async (input) => {
      if (!actor) throw new Error("No actor");
      return actor.createLetter(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["letters", "sent"] }),
  });
}

export function useLetter(id: LetterId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Letter | null>({
    queryKey: ["letter", id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getLetter(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useInbox(receiverLink: string | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Letter[]>({
    queryKey: ["letters", "inbox", receiverLink],
    queryFn: async () => {
      if (!actor || !receiverLink) return [];
      return actor.getInbox(receiverLink);
    },
    enabled: !!actor && !isFetching && !!receiverLink,
  });
}

export function useSent() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Letter[]>({
    queryKey: ["letters", "sent"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSent();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMarkRead() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: LetterId) => {
      if (!actor) throw new Error("No actor");
      return actor.markRead(id);
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["letter", id] });
      qc.invalidateQueries({ queryKey: ["letters", "inbox"] });
    },
  });
}

// ─── Scrapbooks ─────────────────────────────────────────────────────────────────────────────────────

export function useMyScrapbooks() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Scrapbook[]>({
    queryKey: ["scrapbooks", "mine"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyScrapbooks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useScrapbook(id: ScrapbookId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Scrapbook | null>({
    queryKey: ["scrapbook", id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getScrapbook(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useCreateScrapbook() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation<
    ScrapbookId,
    Error,
    { name: string; members: Principal[] }
  >({
    mutationFn: async ({ name, members }) => {
      if (!actor) throw new Error("No actor");
      return actor.createScrapbook(name, members);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scrapbooks", "mine"] }),
  });
}

export function useAddScrapbookPost() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation<
    boolean,
    Error,
    {
      scrapbookId: ScrapbookId;
      photoKey: string;
      note: string;
    }
  >({
    mutationFn: async ({ scrapbookId, photoKey, note }) => {
      if (!actor) throw new Error("No actor");
      return actor.addScrapbookPost(scrapbookId, photoKey, note);
    },
    onSuccess: (_data, { scrapbookId }) => {
      qc.invalidateQueries({ queryKey: ["scrapbook", scrapbookId] });
    },
  });
}

// ─── Albums ───────────────────────────────────────────────────────────────────

export function useMyAlbums() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Album[]>({
    queryKey: ["albums", "mine"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyAlbums();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAlbum(id: AlbumId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Album | null>({
    queryKey: ["album", id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getAlbum(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useCreateAlbum() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation<
    AlbumId,
    Error,
    { name: string; theme: string; members: Principal[] }
  >({
    mutationFn: async ({ name, theme, members }) => {
      if (!actor) throw new Error("No actor");
      return actor.createAlbum(name, theme, members);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["albums", "mine"] }),
  });
}

export function useAddAlbumContent() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation<
    boolean,
    Error,
    {
      albumId: AlbumId;
      photoKeys: string[];
      note: string;
    }
  >({
    mutationFn: async ({ albumId, photoKeys, note }) => {
      if (!actor) throw new Error("No actor");
      return actor.addAlbumContent(albumId, photoKeys, note);
    },
    onSuccess: (_data, { albumId }) => {
      qc.invalidateQueries({ queryKey: ["album", albumId] });
    },
  });
}

export function usePassAlbum() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation<boolean, Error, AlbumId>({
    mutationFn: async (albumId) => {
      if (!actor) throw new Error("No actor");
      return actor.passAlbum(albumId);
    },
    onSuccess: (_data, albumId) => {
      qc.invalidateQueries({ queryKey: ["album", albumId] });
      qc.invalidateQueries({ queryKey: ["albums", "mine"] });
    },
  });
}

// ─── Phone Strap ──────────────────────────────────────────────────────────────

export function useMyStrap() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<PhoneStrap | null>({
    queryKey: ["strap", "mine"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyStrap();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveStrap() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation<void, Error, Charm[]>({
    mutationFn: async (charms) => {
      if (!actor) throw new Error("No actor");
      return actor.saveMyStrap(charms);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["strap", "mine"] }),
  });
}

export function useAddCharm() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation<void, Error, Charm>({
    mutationFn: async (charm) => {
      if (!actor) throw new Error("No actor");
      return actor.addCharm(charm);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["strap", "mine"] }),
  });
}

export function useRemoveCharm() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation<boolean, Error, string>({
    mutationFn: async (charmId) => {
      if (!actor) throw new Error("No actor");
      return actor.removeCharm(charmId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["strap", "mine"] }),
  });
}

export function useReorderCharms() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation<boolean, Error, string[]>({
    mutationFn: async (charmIds) => {
      if (!actor) throw new Error("No actor");
      return actor.reorderCharms(charmIds);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["strap", "mine"] }),
  });
}
