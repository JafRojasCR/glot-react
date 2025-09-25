import { useCallback, useState } from "react";
import RegisterForm from "./components/RegisterForm";
import LoadingOverlay from "./components/LoadingOverlay";

function Registro({ onSwitchToLogin, onGoHome }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async ({ username, email, password }) => {
    // Envía al backend y, si va bien, muestra pantalla de carga falsa
    try {
      const resp = await fetch("http://localhost:3060/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, clave: password }),
      });
      const resultado = await resp.json();
      if (!resp.ok) {
        alert("Error al registrar: " + (resultado.error || "Datos inválidos"));
        return;
      }
      // OK
      setLoading(true);
    } catch (err) {
      console.error(err);
      alert("No se pudo registrar. Intente más tarde.");
    }
  }, []);

  const handleContinue = useCallback(() => {
    setLoading(false);
    onSwitchToLogin?.();
  }, [onSwitchToLogin]);

  return (
    <div className="bg-gray-50 text-gray-800 comfortaa min-h-screen flex items-center justify-center">
      <RegisterForm onSubmit={handleSubmit} onGoLogin={onSwitchToLogin} onGoHome={onGoHome} />
      <LoadingOverlay open={loading} onContinue={handleContinue} />
    </div>
  );
}

export default Registro;
