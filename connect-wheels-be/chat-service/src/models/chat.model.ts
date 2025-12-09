import mongoose, { Schema, Document } from "mongoose";
export interface IChat extends Document {
  participants: string[];
  lastMessage?: {
    senderId: string;
    content: string;
    createdAt: Date;
  };
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}
export const ChatSchema = new Schema<IChat>(
  {
    participants: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length === 2 && v[0] !== v[1],
        message: "Chat must have two different ids",
      },
    },
    lastMessage: {
      senderId: String,
      createdAt: Date,
      content: String,
    },
    createdAt: Date,
    updatedAt: Date,
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);
ChatSchema.index({ participants: 1 }), ChatSchema.index({ updatedAt: -1 });

export const Chat = mongoose.model<IChat>("Chat", ChatSchema);
