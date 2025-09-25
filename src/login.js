import { useState } from 'react';


function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setCargando(true);
    const datos = { email, clave };

    try {
      const resp = await fetch('http://localhost:3060/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const resultado = await resp.json();
      if (resp.ok) {
        const tokenRecibido = resultado.token;
        localStorage.setItem('token', tokenRecibido);
        // Decodifica el token para guardar datos de usuario en localStorage (datosToken y usuario)
        const parseJwt = (token) => {
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            return JSON.parse(jsonPayload);
          } catch (e) {
            return null;
          }
        };

        const datosToken = parseJwt(tokenRecibido);
        if (datosToken) {
          try { localStorage.setItem('datosToken', JSON.stringify(datosToken)); } catch {}
          const username = datosToken.username || datosToken.user || datosToken.email || datosToken.name;
          if (username) localStorage.setItem('usuario', username);
        }
        if (onLoginSuccess) onLoginSuccess(tokenRecibido);
      } else {
        setMensaje(resultado.error || 'Usuario o contraseña incorrectos.');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setMensaje('Ocurrió un error al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-gray-50 text-gray-800 min-h-screen flex items-center justify-center px-4">
      <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl w-full max-w-lg text-center mx-4">
        <h1 className="text-4xl font-bold mb-6 text-green-400">Iniciar Sesión</h1>
        <form onSubmit={manejarSubmit} className="space-y-6" noValidate>
          {mensaje && (
            <p className="text-red-500 text-sm font-semibold" role="alert">
              {mensaje}
            </p>
          )}
          <div>
            <input
              type="email"
              placeholder="Correo electrónico"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Contraseña"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-400 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition duration-300"
          >
            {cargando ? 'Accediendo...' : 'Acceder'}
          </button>
        </form>
        <div className="mt-6 text-sm">
          <p>
            ¿No tienes una cuenta?{' '}
            {onSwitchToRegister ? (
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-blue-400 hover:text-blue-500 transition duration-200 underline"
              >
                Regístrate aquí
              </button>
            ) : (
              <span className="text-gray-400">(Función no disponible)</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
