import { useEffect, useMemo, useState } from "react";

/**
 * RegisterForm: Formulario y validaciones visuales (panel de reglas)
 * Props:
 * - onSubmit: async ({ username, email, password }) => void
 * - onGoLogin: function -> navegar a login
 * - onGoHome: function -> navegar a inicio (opcional)
 */
export default function RegisterForm({ onSubmit, onGoLogin, onGoHome }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRules, setShowRules] = useState(false);

  const rules = useMemo(() => ({
    username: username.length >= 4,
    length: password.length >= 8,
    number: /[0-9]/.test(password),
    symbol: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    email: Boolean(email && email.includes("@") && email.includes(".")),
  }), [username, password, email]);

  // Si se abre el panel, aseguramos que haya estado actualizado
  useEffect(() => {
    if (showRules) {
      // no-op: dependemos de clases dinámicas
    }
  }, [showRules, rules]);

  const verifyAndSubmit = async () => {
    if (!rules.username || !rules.length || !rules.number || !rules.symbol || !rules.email) {
      setShowRules(true);
      return;
    }
    await onSubmit?.({ username, email, password });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      verifyAndSubmit();
    }
  };

  return (
    <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl w-full max-w-lg text-center mx-4">
      {/* Panel de reglas */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl p-8 text-left transition-transform duration-500 ease-in-out z-50 ${
          showRules ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h2 className="text-2xl font-bold mb-4 text-blue-400">Reglas para registrarse</h2>
        <ul className="list-disc pl-5 text-base">
          <li className={rules.username ? "text-green-500" : "text-red-500"}>
            El nombre de usuario debe tener al menos 4 caracteres.
          </li>
          <li className={rules.length ? "text-green-500" : "text-red-500"}>
            La contraseña debe tener al menos 8 caracteres.
          </li>
          <li className={rules.number ? "text-green-500" : "text-red-500"}>
            La contraseña debe incluir al menos un número.
          </li>
          <li className={rules.symbol ? "text-green-500" : "text-red-500"}>
            La contraseña debe incluir al menos un símbolo especial.
          </li>
          <li className={rules.email ? "text-green-500" : "text-red-500"}>El correo electrónico debe ser válido.</li>
        </ul>
        <button
          onClick={() => setShowRules(false)}
          className="mt-6 bg-green-400 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-full text-base shadow-lg transition duration-300"
        >
          Cerrar
        </button>
      </div>

      <h1 className="text-4xl font-bold mb-6 text-green-400">Regístrate</h1>
      <div className="space-y-6" onKeyDown={onKeyDown}>
        <div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nombre de usuario"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            required
          />
        </div>
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            required
          />
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            required
          />
        </div>
        <button
          onClick={verifyAndSubmit}
          className="w-full bg-green-400 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition duration-300"
        >
          Crear Cuenta
        </button>
        <div className="mt-6 text-sm">
          <p>
            ¿Ya tienes una cuenta?{" "}
            <button
              type="button"
              onClick={onGoLogin}
              className="text-blue-400 hover:text-blue-500 transition duration-200 underline"
            >
              Inicia sesión aquí
            </button>
          </p>
          {onGoHome ? (
            <p>
              <button
                type="button"
                onClick={onGoHome}
                className="text-gray-500 hover:text-gray-700 transition duration-200 mt-2 underline"
              >
                Volver al inicio
              </button>
            </p>
          ) : null}
          {!rules.username || !rules.length || !rules.number || !rules.symbol || !rules.email ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowRules(true)}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Ver reglas que faltan
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
