import { Auth } from "aws-amplify";
import { ICredentials } from '@aws-amplify/core';

export class AuthService {

    async getIdToken(): Promise<string> {
        const user = await Auth.currentAuthenticatedUser();
        const session = user.getSignInUserSession();
        if (!session) {
            throw new Error(`No session found for user ${user.getUsername()}`);
        }
        return session.getIdToken().getJwtToken();
    }

    getCredentials(): Promise<ICredentials> {
        return Auth.currentUserCredentials()
            .then((cred) => Auth.essentialCredentials(cred))
            .catch((err: any) => {
                console.error("Error getting credentials", err);
                throw new Error(err);
            });
    }

    signOut() {
        Auth.signOut();
    }
}
