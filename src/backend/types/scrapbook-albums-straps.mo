module {
  // ── Scrapbook ─────────────────────────────────────────────────────────────
  public type ScrapbookId = Text;

  public type ScrapbookPost = {
    id       : Text;
    author   : Principal;
    photoKey : Text; // object-storage blob key
    note     : Text;
    createdAt : Int;
  };

  public type Scrapbook = {
    id        : ScrapbookId;
    name      : Text;
    creator   : Principal;
    members   : [Principal];
    posts     : [ScrapbookPost];
    createdAt : Int;
  };

  // ── Pass-Around Album ─────────────────────────────────────────────────────
  public type AlbumId = Text;

  public type AlbumEntry = {
    contributor : Principal;
    photoKeys   : [Text]; // object-storage blob keys
    note        : Text;
    addedAt     : Int;
  };

  public type Album = {
    id               : AlbumId;
    name             : Text;
    theme            : Text;
    creator          : Principal;
    memberQueue      : [Principal];
    currentHolderIdx : Nat;
    entries          : [AlbumEntry];
    completed        : Bool;
    createdAt        : Int;
  };

  // ── Digital Phone Strap ───────────────────────────────────────────────────
  public type CharmType = { #preset; #custom };

  public type Charm = {
    id        : Text;
    charmType : CharmType;
    presetId  : Text;
    customKey : ?Text; // object-storage key for custom charm image
    labelText : Text;
    position  : Nat;
  };

  public type PhoneStrap = {
    owner  : Principal;
    charms : [Charm];
  };
};
