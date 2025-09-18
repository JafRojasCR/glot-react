import { useState } from "react";

function Login(props) {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");

  const manejarSubmit = async (evento) => {
    evento.preventDefault(); // Evita recarga de la página
    // Preparar objeto con credenciales
    const datos = { email: email, clave: clave };
    try {
      // Llamar API de login (ejemplo usando fetch):
      const resp = await fetch("http://localhost:3060/api/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const resultado = await resp.json();
      if (resp.ok) {
        // Login exitoso – obtener token recibido
        const tokenRecibido = resultado.token;
        console.log("Token recibido:", tokenRecibido);
        props.onLoginSuccess(tokenRecibido); // Notificar al padre con callback
      } else {
        alert("Error de credenciales: " + resultado.error);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      alert("Ocurrió un error al conectar con el servidor");
    }
  };

  return (
    <form onSubmit={manejarSubmit}>
      <h2>Iniciar Sesión</h2>
      <div>
        <label>Email:</label>
        <br />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Contraseña:</label>
        <br />
        <input
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          required
        />
      </div>
      <button type="submit">Ingresar</button>
      <button type="button" onClick={props.onSwitchToRegister}>
        Crear una cuenta
      </button>
    </form>
  );
}

export default Login;
