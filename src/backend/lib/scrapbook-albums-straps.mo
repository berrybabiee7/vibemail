import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Types "../types/scrapbook-albums-straps";
import Common "../types/common";
import Runtime "mo:core/Runtime";

module {
  // ── State aliases ─────────────────────────────────────────────────────────
  public type ScrapbookMap = Map.Map<Types.ScrapbookId, List.List<Types.ScrapbookPost>>;
  public type ScrapbookMetaMap = Map.Map<Types.ScrapbookId, Types.Scrapbook>;
  public type AlbumMap = Map.Map<Types.AlbumId, Types.Album>;
  public type StrapMap = Map.Map<Principal, List.List<Types.Charm>>;

  // ── Scrapbook helpers ─────────────────────────────────────────────────────
  public func createScrapbook(
    scrapbooks : ScrapbookMetaMap,
    id         : Types.ScrapbookId,
    name       : Text,
    creator    : Principal,
    members    : [Principal],
    now        : Common.Timestamp,
  ) : () {
    let sb : Types.Scrapbook = {
      id;
      name;
      creator;
      members;
      posts     = [];
      createdAt = now;
    };
    scrapbooks.add(id, sb);
  };

  public func getScrapbook(
    scrapbooks : ScrapbookMetaMap,
    id         : Types.ScrapbookId,
  ) : ?Types.Scrapbook {
    scrapbooks.get(id);
  };

  public func getScrapbooksByMember(
    scrapbooks : ScrapbookMetaMap,
    member     : Principal,
  ) : [Types.Scrapbook] {
    scrapbooks.values()
      .filter(func(sb) {
        Principal.equal(sb.creator, member) or
        sb.members.find(func(m) { Principal.equal(m, member) }) != null
      })
      .toArray();
  };

  public func addScrapbookPost(
    scrapbooks : ScrapbookMetaMap,
    id         : Types.ScrapbookId,
    post       : Types.ScrapbookPost,
    caller     : Principal,
  ) : Bool {
    switch (scrapbooks.get(id)) {
      case null false;
      case (?sb) {
        let isMember = Principal.equal(sb.creator, caller) or
          sb.members.find(func(m) { Principal.equal(m, caller) }) != null;
        if (not isMember) return false;
        let updated = { sb with posts = sb.posts.concat([post]) };
        scrapbooks.add(id, updated);
        true;
      };
    };
  };

  public func getScrapbookPosts(
    scrapbooks : ScrapbookMetaMap,
    id         : Types.ScrapbookId,
    caller     : Principal,
  ) : ?[Types.ScrapbookPost] {
    switch (scrapbooks.get(id)) {
      case null null;
      case (?sb) {
        let isMember = Principal.equal(sb.creator, caller) or
          sb.members.find(func(m) { Principal.equal(m, caller) }) != null;
        if (not isMember) return null;
        ?sb.posts;
      };
    };
  };

  // ── Album helpers ─────────────────────────────────────────────────────────
  public func createAlbum(
    albums  : AlbumMap,
    id      : Types.AlbumId,
    name    : Text,
    theme   : Text,
    creator : Principal,
    members : [Principal],
    now     : Common.Timestamp,
  ) : () {
    // memberQueue starts with creator at index 0, then the rest
    let queue = [creator].concat(members);
    let album : Types.Album = {
      id;
      name;
      theme;
      creator;
      memberQueue      = queue;
      currentHolderIdx = 0;
      entries          = [];
      completed        = false;
      createdAt        = now;
    };
    albums.add(id, album);
  };

  public func getAlbum(
    albums : AlbumMap,
    id     : Types.AlbumId,
    caller : Principal,
  ) : ?Types.Album {
    switch (albums.get(id)) {
      case null null;
      case (?album) {
        let isMember = Principal.equal(album.creator, caller) or
          album.memberQueue.find(func(m) { Principal.equal(m, caller) }) != null;
        if (not isMember) return null;
        ?album;
      };
    };
  };

  public func addAlbumContent(
    albums : AlbumMap,
    id     : Types.AlbumId,
    entry  : Types.AlbumEntry,
    caller : Principal,
  ) : Bool {
    switch (albums.get(id)) {
      case null false;
      case (?album) {
        if (album.completed) return false;
        let holder = album.memberQueue[album.currentHolderIdx];
        if (not Principal.equal(holder, caller)) return false;
        let updated = { album with entries = album.entries.concat([entry]) };
        albums.add(id, updated);
        true;
      };
    };
  };

  public func passAlbum(
    albums : AlbumMap,
    id     : Types.AlbumId,
    caller : Principal,
  ) : Bool {
    switch (albums.get(id)) {
      case null false;
      case (?album) {
        if (album.completed) return false;
        let holder = album.memberQueue[album.currentHolderIdx];
        if (not Principal.equal(holder, caller)) return false;
        let nextIdx = album.currentHolderIdx + 1;
        let isLast  = nextIdx >= album.memberQueue.size();
        let updated = {
          album with
          currentHolderIdx = if isLast album.currentHolderIdx else nextIdx;
          completed        = isLast;
        };
        albums.add(id, updated);
        true;
      };
    };
  };

  public func getAlbumsByMember(
    albums : AlbumMap,
    member : Principal,
  ) : [Types.Album] {
    albums.values()
      .filter(func(a) {
        Principal.equal(a.creator, member) or
        a.memberQueue.find(func(m) { Principal.equal(m, member) }) != null
      })
      .toArray();
  };

  // ── Phone Strap helpers ───────────────────────────────────────────────────
  public func getStrap(
    straps : StrapMap,
    owner  : Principal,
  ) : Types.PhoneStrap {
    switch (straps.get(owner)) {
      case (?charmList) { { owner; charms = charmList.toArray() } };
      case null         { { owner; charms = [] } };
    };
  };

  public func saveStrap(
    straps : StrapMap,
    owner  : Principal,
    charms : [Types.Charm],
  ) : () {
    let list = List.fromArray<Types.Charm>(charms);
    straps.add(owner, list);
  };

  public func addCharm(
    straps : StrapMap,
    owner  : Principal,
    charm  : Types.Charm,
  ) : () {
    let list = switch (straps.get(owner)) {
      case (?existing) existing;
      case null        List.empty<Types.Charm>();
    };
    list.add(charm);
    straps.add(owner, list);
  };

  public func removeCharm(
    straps  : StrapMap,
    owner   : Principal,
    charmId : Text,
  ) : Bool {
    switch (straps.get(owner)) {
      case null false;
      case (?list) {
        let before = list.size();
        let kept   = list.filter(func(c) { c.id != charmId });
        straps.add(owner, kept);
        kept.size() < before;
      };
    };
  };

  public func reorderCharms(
    straps   : StrapMap,
    owner    : Principal,
    charmIds : [Text],
  ) : Bool {
    switch (straps.get(owner)) {
      case null false;
      case (?list) {
        if (list.size() != charmIds.size()) return false;
        // Build id→charm lookup
        let lookup = Map.empty<Text, Types.Charm>();
        list.forEach(func(c) { lookup.add(c.id, c) });
        // Verify all ids exist
        let allExist = charmIds.all(func(cid) { lookup.containsKey(cid) });
        if (not allExist) return false;
        // Reorder: assign new position value matching charmIds order
        let reordered = List.fromArray<Types.Charm>(
          charmIds.mapEntries<Text, Types.Charm>(func(cid, idx) {
            let charm = switch (lookup.get(cid)) {
              case (?c) c;
              case null Runtime.trap("charm not found");
            };
            { charm with position = idx };
          })
        );
        straps.add(owner, reordered);
        true;
      };
    };
  };
};
