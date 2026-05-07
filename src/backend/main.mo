import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import ProfileLib "lib/profile";
import LetterLib "lib/letter";
import MixinProfile "mixins/profile-api";
import MixinLetter "mixins/letter-api";
import ScrapbookLib "lib/scrapbook-albums-straps";
import MixinScrapbook "mixins/scrapbook-albums-straps-api";
actor {
  // Authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Object storage infrastructure
  include MixinObjectStorage();

  // Domain state
  let profiles : ProfileLib.ProfileMap = Map.empty();
  let letters : LetterLib.LetterMap = Map.empty();

  // Scrapbook / album / strap state
  let scrapbooks : ScrapbookLib.ScrapbookMetaMap = Map.empty();
  let albums     : ScrapbookLib.AlbumMap         = Map.empty();
  let straps     : ScrapbookLib.StrapMap         = Map.empty();

  // Mixin composition
  include MixinProfile(accessControlState, profiles);
  include MixinLetter(accessControlState, letters);
  include MixinScrapbook(scrapbooks, albums, straps);
};
