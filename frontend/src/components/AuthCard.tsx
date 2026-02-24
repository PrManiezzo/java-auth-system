import type { ReactNode } from "react";

type AuthCardProps = {
    title: string;
    subtitle: string;
    children: ReactNode;
};

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
    return (
        <div className="auth-card">
            <h1>{title}</h1>
            <p>{subtitle}</p>
            {children}
        </div>
    );
}
