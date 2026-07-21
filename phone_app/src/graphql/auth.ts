import { gql, type TypedDocumentNode } from '@apollo/client';
import type { AuthPayload } from '../types/session';

interface LoginData {
    login: AuthPayload;
}

interface LoginVariables {
    input: {
        email: string;
        password: string;
    };
}

/**
 * `login` is one of the few unauthenticated mutations. It returns a JWT plus the
 * user; the full session (memberships, customer profile) comes from getSession
 * afterwards rather than being bundled here.
 *
 * Fails with BAD_USER_INPUT for a wrong password *or* an unknown email — the
 * backend deliberately doesn't distinguish the two, so don't write UI that
 * claims "no account with that email".
 */
export const LOGIN: TypedDocumentNode<LoginData, LoginVariables> = gql`
    mutation Login($input: LoginInput!) {
        login(input: $input) {
            token
            user {
                id
                email
                firstName
                lastName
                phone
                avatarUrl
            }
        }
    }
`;
