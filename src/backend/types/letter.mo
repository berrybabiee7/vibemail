import Storage "mo:caffeineai-object-storage/Storage";
import Common "common";

module {
  // Unboxing animation variants
  public type UnboxingType = {
    #polaroidStack;
    #secretLocket;
    #cdStickerPeeler;
    #fruitSoda;
    #openWhen;
    #musicBox;
    #strawberryJar;
    #cloverField;
  };

  // Envelope texture variants
  public type EnvelopeTexture = {
    #gingham;
    #frosted;
    #holographic;
  };

  // Music loop variants
  public type MusicLoop = {
    #lofi;
    #kawaiiPop;
  };

  // Photo entry with object-storage blob
  public type Photo = {
    blob : Storage.ExternalBlob;
  };

  // Internal letter type (mutable fields for read/update)
  public type LetterInternal = {
    id : Common.LetterId;
    sender : Principal;
    receiverLink : Text;
    unboxingType : UnboxingType;
    var photos : [Photo];
    note : Text;
    secretNote : ?Text;
    envelopeTexture : EnvelopeTexture;
    musicLoop : ?MusicLoop;
    openWhenTime : ?Common.Timestamp;
    patternKey : ?Text;
    var isRead : Bool;
    createdAt : Common.Timestamp;
  };

  // Shared (public) letter type for API responses
  public type Letter = {
    id : Common.LetterId;
    sender : Principal;
    receiverLink : Text;
    unboxingType : UnboxingType;
    photos : [Photo];
    note : Text;
    secretNote : ?Text;
    envelopeTexture : EnvelopeTexture;
    musicLoop : ?MusicLoop;
    openWhenTime : ?Common.Timestamp;
    patternKey : ?Text;
    isRead : Bool;
    createdAt : Common.Timestamp;
  };

  // Input type for creating a letter
  public type CreateLetterInput = {
    receiverLink : Text;
    unboxingType : UnboxingType;
    photos : [Photo];
    note : Text;
    secretNote : ?Text;
    envelopeTexture : EnvelopeTexture;
    musicLoop : ?MusicLoop;
    openWhenTime : ?Common.Timestamp;
    patternKey : ?Text;
  };
};
