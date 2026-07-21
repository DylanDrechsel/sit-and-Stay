import { gql, type TypedDocumentNode } from '@apollo/client';
import type { Session } from '../types/session';

interface GetSessionData {
    getSession: Session;
}

/**
 * The sign-in bootstrap. One call returning identity, every active membership
 * (each with its role and business), and the customer profile if there is one.
 *
 * This is the only way to learn whether the user is a customer: `getMe` returns
 * a flat User with no customer link, and an empty `getMyPets` can't distinguish
 * "no profile" from "profile with no pets".
 *
 * Re-run it after anything that changes a role. Takes no variables.
 */
export const GET_SESSION: TypedDocumentNode<GetSessionData, Record<string, never>> = gql`
    query GetSession {
        getSession {
            user {
                id
                email
                firstName
                lastName
                phone
                avatarUrl
            }
            memberships {
                id
                role
                isActive
                joinedAt
                business {
                    id
                    name
                    city
                    heroPhotoUrl
                    isActive
                }
            }
            customerProfile {
                id
                address
                city
            }
        }
    }
`;
