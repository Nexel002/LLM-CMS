import { ObjectId } from "mongodb";

export interface Post {
  _id?: ObjectId;
  title: string;
  content: string;
  author?: string;
  createdAt?: Date;
  updatedAt?: Date;
}