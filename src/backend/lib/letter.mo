import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import LetterTypes "../types/letter";
import Common "../types/common";

module {
  public type LetterMap = Map.Map<Common.LetterId, LetterTypes.LetterInternal>;

  // Generate a unique letter ID from sender principal + timestamp
  public func genId(sender : Principal, now : Int) : Common.LetterId {
    sender.toText() # "-" # now.toText();
  };

  public func createLetter(
    letters : LetterMap,
    sender : Principal,
    input : LetterTypes.CreateLetterInput,
  ) : Common.LetterId {
    let now = Time.now();
    let id = genId(sender, now);
    let letter : LetterTypes.LetterInternal = {
      id;
      sender;
      receiverLink = input.receiverLink;
      unboxingType = input.unboxingType;
      var photos = input.photos;
      note = input.note;
      secretNote = input.secretNote;
      envelopeTexture = input.envelopeTexture;
      musicLoop = input.musicLoop;
      openWhenTime = input.openWhenTime;
      patternKey = input.patternKey;
      var isRead = false;
      createdAt = now;
    };
    letters.add(id, letter);
    id;
  };

  public func getLetter(letters : LetterMap, id : Common.LetterId) : ?LetterTypes.Letter {
    switch (letters.get(id)) {
      case (?l) ?toPublic(l);
      case null null;
    };
  };

  public func getInbox(letters : LetterMap, receiverLink : Text) : [LetterTypes.Letter] {
    letters.entries()
      .filterMap(func((_, l) : (Common.LetterId, LetterTypes.LetterInternal)) : ?LetterTypes.Letter {
        if (l.receiverLink == receiverLink) ?toPublic(l) else null
      })
      .toArray();
  };

  public func getSent(letters : LetterMap, sender : Principal) : [LetterTypes.Letter] {
    letters.entries()
      .filterMap(func((_, l) : (Common.LetterId, LetterTypes.LetterInternal)) : ?LetterTypes.Letter {
        if (Principal.equal(l.sender, sender)) ?toPublic(l) else null
      })
      .toArray();
  };

  public func markRead(letters : LetterMap, _caller : Principal, id : Common.LetterId) : () {
    switch (letters.get(id)) {
      case null {};
      case (?l) { l.isRead := true };
    };
  };

  // Convert internal letter to shared type
  public func toPublic(letter : LetterTypes.LetterInternal) : LetterTypes.Letter {
    {
      id = letter.id;
      sender = letter.sender;
      receiverLink = letter.receiverLink;
      unboxingType = letter.unboxingType;
      photos = letter.photos;
      note = letter.note;
      secretNote = letter.secretNote;
      envelopeTexture = letter.envelopeTexture;
      musicLoop = letter.musicLoop;
      openWhenTime = letter.openWhenTime;
      patternKey = letter.patternKey;
      isRead = letter.isRead;
      createdAt = letter.createdAt;
    };
  };
};
