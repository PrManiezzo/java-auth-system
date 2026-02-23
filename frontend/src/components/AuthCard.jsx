export default function AuthCard({ title, subtitle, children }) {
    return (
        <div className="auth-card">
            <h1>{title}</h1>
            <p>{subtitle}</p>
            {children}
        </div>
    );
}
