import { User, Session } from '@supabase/supabase-js';
interface AuthContextType {
    user: User | null;
    session: Session | null;
    roles: string[];
    loading: boolean;
    signUp: (email: string, password: string, username: string, displayName: string) => Promise<{
        data: any;
        error: any;
    }>;
    signIn: (email: string, password: string) => Promise<{
        error: any;
    }>;
    signInWithGithub: () => Promise<{
        error: any;
    }>;
    signInWithGoogle: () => Promise<{
        error: any;
    }>;
    signOut: () => Promise<void>;
}
export declare const AuthProvider: ({ children }: {
    children: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export declare const useAuth: () => AuthContextType;
export {};
