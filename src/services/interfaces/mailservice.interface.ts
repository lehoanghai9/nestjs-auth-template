export interface IMailService {
   sendPasswordResetEmail(to: string, token: string): Promise<boolean> | boolean;
}
