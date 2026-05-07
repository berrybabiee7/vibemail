import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import ProfileLib "../lib/profile";
import ProfileTypes "../types/profile";

mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles : ProfileLib.ProfileMap,
) {
  // Return the caller's own profile (required by authorization extension frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?ProfileTypes.UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    ProfileLib.getProfile(profiles, caller);
  };

  // Save the caller's own profile (required by authorization extension frontend)
  public shared ({ caller }) func saveCallerUserProfile(profile : ProfileTypes.UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    ProfileLib.setProfile(profiles, caller, profile);
  };

  // Get any user's profile by principal
  public query ({ caller }) func getUserProfile(user : Principal) : async ?ProfileTypes.UserProfile {
    ProfileLib.getProfile(profiles, user);
  };

  // Set caller's profile (name + avatar)
  public shared ({ caller }) func setProfile(profile : ProfileTypes.UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    ProfileLib.setProfile(profiles, caller, profile);
  };

  // Add a bestie to caller's bestie list
  public shared ({ caller }) func addBestie(bestie : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    if (Principal.equal(caller, bestie)) {
      Runtime.trap("Cannot add yourself as a bestie");
    };
    ProfileLib.addBestie(profiles, caller, bestie);
  };

  // Remove a bestie from caller's bestie list
  public shared ({ caller }) func removeBestie(bestie : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    ProfileLib.removeBestie(profiles, caller, bestie);
  };
};
