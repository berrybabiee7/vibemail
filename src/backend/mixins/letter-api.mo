import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import LetterLib "../lib/letter";
import LetterTypes "../types/letter";
import Common "../types/common";

mixin (
  accessControlState : AccessControl.AccessControlState,
  letters : LetterLib.LetterMap,
) {
  // Create a new letter — requires authentication
  public shared ({ caller }) func createLetter(input : LetterTypes.CreateLetterInput) : async Common.LetterId {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in to send letters");
    };
    LetterLib.createLetter(letters, caller, input);
  };

  // Get a single letter by ID — public (no auth) for share link unboxing
  public query ({ caller }) func getLetter(id : Common.LetterId) : async ?LetterTypes.Letter {
    LetterLib.getLetter(letters, id);
  };

  // Get all letters for a receiver link — public (no auth) for inbox via share link
  public query ({ caller }) func getInbox(receiverLink : Text) : async [LetterTypes.Letter] {
    LetterLib.getInbox(letters, receiverLink);
  };

  // Get all letters sent by the caller — requires authentication
  public query ({ caller }) func getSent() : async [LetterTypes.Letter] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in to view sent letters");
    };
    LetterLib.getSent(letters, caller);
  };

  // Mark a letter as read — requires authentication
  public shared ({ caller }) func markRead(id : Common.LetterId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in to mark letters as read");
    };
    LetterLib.markRead(letters, caller, id);
  };
};
