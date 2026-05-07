import Map "mo:core/Map";
import Principal "mo:core/Principal";
import ProfileTypes "../types/profile";

module {
  public type ProfileMap = Map.Map<Principal, ProfileTypes.UserProfile>;

  public func getProfile(profiles : ProfileMap, user : Principal) : ?ProfileTypes.UserProfile {
    profiles.get(user);
  };

  public func setProfile(profiles : ProfileMap, caller : Principal, profile : ProfileTypes.UserProfile) : () {
    profiles.add(caller, profile);
  };

  public func addBestie(profiles : ProfileMap, caller : Principal, bestie : Principal) : () {
    let existing = switch (profiles.get(caller)) {
      case (?p) p;
      case null { { name = ""; avatar = null; besties = [] } };
    };
    // Only add if not already a bestie
    let alreadyBestie = existing.besties.find(func(b : Principal) : Bool { Principal.equal(b, bestie) });
    switch (alreadyBestie) {
      case (?_) {};
      case null {
        let newBesties = existing.besties.concat([bestie]);
        profiles.add(caller, { existing with besties = newBesties });
      };
    };
  };

  public func removeBestie(profiles : ProfileMap, caller : Principal, bestie : Principal) : () {
    switch (profiles.get(caller)) {
      case null {};
      case (?existing) {
        let newBesties = existing.besties.filter(func(b : Principal) : Bool { not Principal.equal(b, bestie) });
        profiles.add(caller, { existing with besties = newBesties });
      };
    };
  };

};
