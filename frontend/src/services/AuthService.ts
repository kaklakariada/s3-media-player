import { Auth } from "aws-amplify";
import { CognitoUserSession } from "amazon-cognito-identity-js";

import { ICredentials } from '@aws-amplify/core';

interface AuthData {
    id: string;
    name?: string;
    username: string;
    signInUserSession: CognitoUserSession;
}

export class AuthService {

    currentAuthenticatedUser(): Promise<AuthData> {
        return Auth.currentAuthenticatedUser();
    }

    getCredentials(): Promise<ICredentials> {
        return Auth.currentUserCredentials()
            .then((cred) => Auth.essentialCredentials(cred))
            .catch((err: any) => {
                console.error("Error getting credentials", err);
                throw new Error(err);
            });
    }

    async getIdToken(): Promise<string> {
        const cred = await this.currentAuthenticatedUser();
        return cred.signInUserSession.getIdToken().getJwtToken();
    }

    signOut() {
        Auth.signOut();
    }
}
