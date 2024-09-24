import { Request } from "express";

export type JWTPayload = { userId: string };

export type UserDetailRequest = Request & JWTPayload;
