import Storage "mo:caffeineai-object-storage/Storage";

module {
  // Public (shared) type for API boundary
  public type UserProfile = {
    name : Text;
    avatar : ?Storage.ExternalBlob;
    besties : [Principal];
  };
};
