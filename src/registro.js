import { useState } from "react";

function Registro(props) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");

  const manejarRegistro = async (e) => {
    e.preventDefault();
    const datos = { username: nombre, email: email, clave: clave };
    try {
      const resp = await fetch("http://localhost:3060/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const resultado = await resp.json();
      if (resp.ok) {
        alert("Usuario registrado con éxito. Ahora puede iniciar sesión.");
        props.onSwitchToLogin(); // vuelve a la pantalla de login para que inicie sesión
      } else {
        // El backend puede devolver error 400 si el email ya existe, etc.
        alert("Error al registrar: " + (resultado.error || "Datos inválidos"));
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      alert("No se pudo registrar. Intente más tarde.");
    }
  };

  return (
    <form onSubmit={manejarRegistro}>
      <h2>Crear Cuenta</h2>
      <div>
        <label>Nombre completo:</label>
        <br />
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
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
      <button type="submit">Registrarse</button>
      <button type="button" onClick={props.onSwitchToLogin}>
        Ir a Iniciar Sesión
      </button>
    </form>
  );
}

export default Registro;
