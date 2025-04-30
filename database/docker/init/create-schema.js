use("vote_for_meeting");     

// User collection
db.createCollection("user", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "timezone", "created_at"],
      additionalProperties: false,
      properties: {
        _id:        { bsonType: "objectId", description: "generated automatically" },
        name:       { bsonType: "string",    minLength: 1 },
        email:      { bsonType: "string",    pattern: "^.+@.+\\..+$" },
        timezone:   { bsonType: "string" },
        created_at: { bsonType: "date"      }
      }
    }
  },
  validationLevel: "strict"
});

db.user.createIndex({ email: 1 }, { unique: true, name: "ux_user_email" });


// meeting collection
db.createCollection("meeting", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "creator_id",
        "title",
        "range",
        "slot_length_min",
        "participants",
        "time_slots"
      ],
      additionalProperties: false,

      properties: {
        _id:         { bsonType: "objectId" },
        creator_id:  { bsonType: "objectId", description: "FK → user._id" },
        title:       { bsonType: "string",   minLength: 1 },
        description: { bsonType: ["string", "null"] },

        
        range: {
          bsonType: "object",
          required: ["start", "end"],
          properties: {
            start: { bsonType: "date" },
            end:   { bsonType: "date" }
          }
        },

        slot_length_min: { bsonType: "int",   minimum: 1 },

        participants: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["user_id", "status"],
            additionalProperties: false,
            properties: {
              user_id:      { bsonType: "objectId" },
              status:       { enum: ["invited", "accepted", "declined"] },
              responded_at: { bsonType: ["date", "null"] }
            }
          }
        },

        time_slots: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["slot_id", "start", "end", "votes"],
            additionalProperties: false,
            properties: {
              slot_id: { bsonType: "string" },     
              start:   { bsonType: "date" },
              end:     { bsonType: "date" },
              votes: {
                bsonType: "array",
                items: { bsonType: "objectId" }   
              }
            }
          }
        },

        created_at: { bsonType: ["date", "null"] },
        updated_at: { bsonType: ["date", "null"] }
      }
    }
  },

  validatorLevel: "moderate",    
  validationAction: "error"
});

// indexes
db.meeting.createIndex({ creator_id: 1 },                   { name: "ix_meeting_creator" }); // by creator
db.meeting.createIndex({ "participants.user_id": 1 },       { name: "ix_meeting_participant_uid" }); // by participants
db.meeting.createIndex({ "time_slots.slot_id": 1 },         { name: "ix_meeting_slot_id" }); // by time slot

print("vote_for_meeting schema created successfully.");
