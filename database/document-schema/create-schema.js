use("vote_for_meeting");     

// User collection
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "password"],
      additionalProperties: false,
      properties: {
        _id:      { bsonType: "objectId", description: "generated automatically" },
        username: { bsonType: "string", minLength: 1 },
        password: { bsonType: "string", minLength: 1 }
      }
    }
  },
  validationLevel: "strict"
});

db.users.createIndex({ username: 1 }, { unique: true, name: "ux_users_username" });


// meetings collection - Matches Meeting interface
db.createCollection("meetings", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "description", "startDate", "endDate", "createdBy", "createdAt", "participators"],
      additionalProperties: false,
      properties: {
        _id:         { bsonType: "objectId" },
        id:          { bsonType: "string" },   // String ID (could be ObjectId as string)
        title:       { bsonType: "string", minLength: 1 },
        description: { bsonType: "string" },
        startDate:   { bsonType: "string" },   // ISO 8601 format
        endDate:     { bsonType: "string" },   // ISO 8601 format
        createdBy:   { bsonType: "string" },   // Username of creator
        createdAt:   { bsonType: "string" },   // ISO 8601 format
        
        participators: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["username", "status"],
            additionalProperties: false,
            properties: {
              username:     { bsonType: "string" },
              status:       { enum: ["invited", "accepted", "declined"] },
              responded_at: { bsonType: ["string", "null"] }  // Optional ISO 8601 format
            }
          }
        }
      }
    }
  },
  validationLevel: "strict"
});

// Indexes for meetings
db.meetings.createIndex({ id: 1 }, { unique: true, name: "ux_meetings_id" });
db.meetings.createIndex({ createdBy: 1 }, { name: "ix_meetings_creator" });
db.meetings.createIndex({ "participators.username": 1 }, { name: "ix_meetings_participator" });

// votes collection - Matches Vote interface
db.createCollection("votes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["meetingId", "username", "date", "hour", "minute", "createdAt"],
      additionalProperties: false,
      properties: {
        _id:       { bsonType: "objectId" },
        id:        { bsonType: "string" },   // String ID (could be ObjectId as string)
        meetingId: { bsonType: "string" },   // References meetings.id
        username:  { bsonType: "string" },   // Username who voted
        date:      { bsonType: "string" },   // ISO 8601 date format (YYYY-MM-DD)
        hour:      { bsonType: "int" },
        minute:    { bsonType: "int" },
        createdAt: { bsonType: "string" }    // ISO 8601 format
      }
    }
  },
  validationLevel: "strict"
});

// Indexes for votes
db.votes.createIndex({ id: 1 }, { unique: true, name: "ux_votes_id" });
db.votes.createIndex({ meetingId: 1 }, { name: "ix_votes_meeting" });
db.votes.createIndex({ username: 1 }, { name: "ix_votes_username" });
db.votes.createIndex({ meetingId: 1, username: 1, date: 1, hour: 1, minute: 1 }, 
  { unique: true, name: "ux_votes_unique_vote" });  // Prevent duplicate votes

print("vote_for_meeting schema created successfully.");
