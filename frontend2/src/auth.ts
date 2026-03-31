import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
    CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import config from './config';

type CredentialProvider = ReturnType<typeof fromCognitoIdentityPool>;

const userPool = new CognitoUserPool({
    UserPoolId: config.userPoolId,
    ClientId: config.userPoolClientId,
});

/**
 * Wraps Cognito User Pool authentication and Identity Pool credential exchange.
 *
 * Flow:
 *   1. login()           → authenticates against the User Pool, stores session
 *   2. getCredentials()  → exchanges the current ID token for temporary AWS
 *                          credentials via the Identity Pool
 *   3. The credential provider is cached by ID token. When the Cognito session
 *      is silently refreshed (via the refresh token), a new provider is created
 *      with the updated token so Identity Pool credentials stay current.
 */
export class AuthService {
    private session: CognitoUserSession | null = null;
    private cachedIdToken: string | null = null;
    private credProvider: CredentialProvider | null = null;

    async login(username: string, password: string): Promise<void> {
        const user = new CognitoUser({ Username: username, Pool: userPool });
        const authDetails = new AuthenticationDetails({ Username: username, Password: password });
        return new Promise((resolve, reject) => {
            user.authenticateUser(authDetails, {
                onSuccess: (session) => {
                    this.session = session;
                    resolve();
                },
                onFailure: reject,
            });
        });
    }

    logout(): void {
        userPool.getCurrentUser()?.signOut();
        this.session = null;
        this.cachedIdToken = null;
        this.credProvider = null;
    }

    /** Returns true when a local user record exists (may still need session refresh). */
    isLoggedIn(): boolean {
        return userPool.getCurrentUser() !== null;
    }

    /**
     * Restores an existing session from local storage.
     * Throws if no user / valid session is found. Call on app startup.
     */
    async restoreSession(): Promise<void> {
        const user = userPool.getCurrentUser();
        if (!user) throw new Error('No stored user');
        await this.loadSession(user);
    }

    /**
     * Returns temporary AWS credentials derived from the current Cognito session.
     * Caches the Identity Pool credential provider; recreates it when the
     * Cognito ID token has been refreshed.
     */
    async getCredentials(): Promise<Awaited<ReturnType<CredentialProvider>>> {
        const session = await this.getValidSession();
        const idToken = session.getIdToken().getJwtToken();

        if (idToken !== this.cachedIdToken || !this.credProvider) {
            this.cachedIdToken = idToken;
            const loginKey = `cognito-idp.${config.region}.amazonaws.com/${config.userPoolId}`;
            this.credProvider = fromCognitoIdentityPool({
                clientConfig: { region: config.region },
                identityPoolId: config.identityPoolId,
                logins: { [loginKey]: idToken },
            });
        }

        return this.credProvider();
    }

    private async getValidSession(): Promise<CognitoUserSession> {
        if (this.session?.isValid()) return this.session;
        const user = userPool.getCurrentUser();
        if (!user) throw new Error('Not logged in');
        await this.loadSession(user);
        return this.session!;
    }

    private loadSession(user: CognitoUser): Promise<void> {
        return new Promise((resolve, reject) => {
            user.getSession((err: Error | null, session: CognitoUserSession | null) => {
                if (err || !session) return reject(err ?? new Error('No session returned'));
                this.session = session;
                resolve();
            });
        });
    }
}
