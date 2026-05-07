import Types "../types/scrapbook-albums-straps";
import Lib "../lib/scrapbook-albums-straps";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

mixin (
  scrapbooks : Lib.ScrapbookMetaMap,
  albums     : Lib.AlbumMap,
  straps     : Lib.StrapMap,
) {

  // ── Scrapbook API ─────────────────────────────────────────────────────────

  public shared ({ caller }) func createScrapbook(
    name    : Text,
    members : [Principal],
  ) : async Types.ScrapbookId {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    let id = debug_show(Time.now()) # caller.toText();
    Lib.createScrapbook(scrapbooks, id, name, caller, members, Time.now());
    id;
  };

  public query ({ caller }) func getScrapbook(
    id : Types.ScrapbookId,
  ) : async ?Types.Scrapbook {
    Lib.getScrapbook(scrapbooks, id);
  };

  public query ({ caller }) func getMyScrapbooks() : async [Types.Scrapbook] {
    Lib.getScrapbooksByMember(scrapbooks, caller);
  };

  public shared ({ caller }) func addScrapbookPost(
    scrapbookId : Types.ScrapbookId,
    photoKey    : Text,
    note        : Text,
  ) : async Bool {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    let post : Types.ScrapbookPost = {
      id       = debug_show(Time.now()) # caller.toText();
      author   = caller;
      photoKey;
      note;
      createdAt = Time.now();
    };
    Lib.addScrapbookPost(scrapbooks, scrapbookId, post, caller);
  };

  public query ({ caller }) func getScrapbookPosts(
    id : Types.ScrapbookId,
  ) : async ?[Types.ScrapbookPost] {
    Lib.getScrapbookPosts(scrapbooks, id, caller);
  };

  // ── Pass-Around Album API ─────────────────────────────────────────────────

  public shared ({ caller }) func createAlbum(
    name    : Text,
    theme   : Text,
    members : [Principal],
  ) : async Types.AlbumId {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    let id = debug_show(Time.now()) # caller.toText();
    Lib.createAlbum(albums, id, name, theme, caller, members, Time.now());
    id;
  };

  public query ({ caller }) func getAlbum(
    id : Types.AlbumId,
  ) : async ?Types.Album {
    Lib.getAlbum(albums, id, caller);
  };

  public query ({ caller }) func getMyAlbums() : async [Types.Album] {
    Lib.getAlbumsByMember(albums, caller);
  };

  public shared ({ caller }) func addAlbumContent(
    albumId   : Types.AlbumId,
    photoKeys : [Text],
    note      : Text,
  ) : async Bool {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    let entry : Types.AlbumEntry = {
      contributor = caller;
      photoKeys;
      note;
      addedAt = Time.now();
    };
    Lib.addAlbumContent(albums, albumId, entry, caller);
  };

  public shared ({ caller }) func passAlbum(
    albumId : Types.AlbumId,
  ) : async Bool {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    Lib.passAlbum(albums, albumId, caller);
  };

  // ── Digital Phone Strap API ───────────────────────────────────────────────

  public query ({ caller }) func getMyStrap() : async Types.PhoneStrap {
    Lib.getStrap(straps, caller);
  };

  public shared ({ caller }) func saveMyStrap(
    charms : [Types.Charm],
  ) : async () {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    Lib.saveStrap(straps, caller, charms);
  };

  public shared ({ caller }) func addCharm(
    charm : Types.Charm,
  ) : async () {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    Lib.addCharm(straps, caller, charm);
  };

  public shared ({ caller }) func removeCharm(
    charmId : Text,
  ) : async Bool {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    Lib.removeCharm(straps, caller, charmId);
  };

  public shared ({ caller }) func reorderCharms(
    charmIds : [Text],
  ) : async Bool {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    Lib.reorderCharms(straps, caller, charmIds);
  };
};
