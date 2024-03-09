import { fetchAuthSession,  AuthSession, signOut, getCurrentUser, AuthUser } from "aws-amplify/auth";

export class AuthService {

    async getIdToken(): Promise<string> {
        const credentails = await this.getAuthSession()
        const token = credentails.tokens?.idToken?.toString()
        if (!token) {
            throw new Error(`No session found for user`);
        }
        return token
    }

    async currentAuthenticatedUser(): Promise<AuthUser> {
        return await getCurrentUser();
    }

    async getAuthSession(): Promise<AuthSession> {
        return await fetchAuthSession();
    }

    signOut() {
        signOut({ global: true });
    }
}
