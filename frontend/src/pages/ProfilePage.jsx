import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { clearSession, setUser } from "../services/authStorage";

export default function ProfilePage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        city: "",
        bio: "",
        avatarBase64: "",
    });
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("info");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get("/profile")
            .then(({ data }) => {
                setForm({
                    name: data.name || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    city: data.city || "",
                    bio: data.bio || "",
                    avatarBase64: data.avatarBase64 || "",
                });
            })
            .catch(() => {
                clearSession();
                navigate("/login");
            });
    }, [navigate]);

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setMessage("");
        setMessageType("info");

        try {
            const payload = {
                name: form.name,
                phone: form.phone,
                city: form.city,
                bio: form.bio,
                avatarBase64: form.avatarBase64,
            };

            const { data } = await api.put("/profile", payload);
            setMessage(data.message || "Perfil atualizado com sucesso");
            setMessageType("success");
            if (data.profile) {
                setUser({
                    name: data.profile.name,
                    email: data.profile.email,
                    avatarBase64: data.profile.avatarBase64,
                });
            }
        } catch (error) {
            setMessage(error.response?.data?.message || "Erro ao atualizar perfil");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    }

    function handleAvatarChange(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setMessage("Selecione um arquivo de imagem válido");
            setMessageType("error");
            return;
        }

        const maxBytes = 1.5 * 1024 * 1024;
        if (file.size > maxBytes) {
            setMessage("A imagem deve ter no máximo 1.5MB");
            setMessageType("error");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setForm((current) => ({ ...current, avatarBase64: String(reader.result || "") }));
            setMessage("Foto pronta para salvar");
            setMessageType("info");
        };
        reader.readAsDataURL(file);
    }

    function removeAvatar() {
        setForm((current) => ({ ...current, avatarBase64: "" }));
        setMessage("Foto removida. Clique em salvar para confirmar.");
        setMessageType("info");
    }

    return (
        <div className="dashboard-screen">
            <div className="dashboard-card profile-card">
                <h1>Meu Perfil</h1>
                <p>Edite os dados do seu cadastro e sua foto.</p>

                <div className="profile-header">
                    {form.avatarBase64 ? (
                        <img src={form.avatarBase64} alt="Foto de perfil" className="avatar" />
                    ) : (
                        <div className="avatar avatar-placeholder">Sem foto</div>
                    )}

                    <div className="profile-header-actions">
                        <label className="upload-label">
                            Selecionar foto
                            <input type="file" accept="image/*" onChange={handleAvatarChange} />
                        </label>
                        <button type="button" className="btn-secondary" onClick={removeAvatar}>
                            Remover foto
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="form">
                    <input
                        type="text"
                        placeholder="Nome"
                        value={form.name}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                        required
                    />
                    <input type="email" value={form.email} disabled />
                    <input
                        type="text"
                        placeholder="Telefone"
                        value={form.phone}
                        onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Cidade"
                        value={form.city}
                        onChange={(event) => setForm({ ...form, city: event.target.value })}
                    />
                    <textarea
                        className="input-textarea"
                        placeholder="Bio"
                        value={form.bio}
                        onChange={(event) => setForm({ ...form, bio: event.target.value })}
                        maxLength={500}
                    />

                    <button disabled={loading}>{loading ? "Salvando..." : "Salvar perfil"}</button>
                </form>

                {message && <div className={`alert ${messageType === "error" ? "alert-error" : messageType === "success" ? "alert-success" : ""}`}>{message}</div>}

                <div className="links">
                    <Link to="/dashboard">Voltar ao painel</Link>
                </div>
            </div>
        </div>
    );
}
