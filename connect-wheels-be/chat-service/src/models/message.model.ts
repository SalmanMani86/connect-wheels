import mongoose, { Document, Schema } from "mongoose";
export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId; // Add this
  chatId: mongoose.Types.ObjectId;
  senderId: string;
  createdAt: Date;
  updatedAt: Date;
  type: "text" | "image" | "file";
  readBy: string[];
  content: string;
}

const MessageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    content: {
      required: true,
      type: String,
      maxlength: 5000,
    },
    type: {
      type: String,
      enum: ["text", "file", "image"],
      default: "text",
    },
    readBy: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

MessageSchema.index({ chatId: 1, createdAt: -1 });
export const Message = mongoose.model<IMessage>("Message", MessageSchema);
