# Nikos Barber

Sitio de citas para una barbería. Ahora usa **Firebase Firestore** como base de datos en internet, así que el dueño, los barberos y los clientes ven la misma información sin importar en qué computadora, celular o navegador entren — y el panel se actualiza **en tiempo real** cuando alguien agenda desde otro lado.

## Páginas

- **index.html** — el cliente elige servicio, fecha y hora. Puede elegir un barbero específico o dejar "Cualquiera disponible" para que el sistema asigne de forma equitativa. Al confirmar recibe un ticket en pantalla y puede descargar un **PDF elegante con el logo**.
- **seguimiento.html** — el cliente busca su cita con número de ticket + teléfono, ve el estado, y si ya fue marcada "completada" puede calificarla con estrellas y comentario.
- **login.html** — acceso del equipo: dueño o barberos, cada quien con su usuario y contraseña.
- **admin.html** — panel de citas, con actualización en vivo. El dueño ve todas las citas, las "Ventas de hoy" e "Ingresos totales"; cada barbero ve solo las suyas, junto con "Generado hoy" y "Generado en total" (lo que le toca entregar a la barbería). Cada barbero también puede registrar una **cita imprevista** (un cliente que llegó sin agendar), con su costo.
- **empleados.html** *(solo dueño)* — alta, edición (nombre/usuario/contraseña) o baja de barberos.
- **ajustes.html** *(solo dueño)* — horario de atención, catálogo de servicios/precios, y el **servicio a domicilio**: puede activarlo o desactivarlo, y definir cuánto se cobra de más por la movilidad.

## Cómo está conectado a Firebase

Todo vive en `data.js`, que es un **módulo de JavaScript** conectado a tu proyecto de Firestore (`nikosbarber-6cbb8`). Colecciones que usa:

- `citas` — cada documento es una cita.
- `barberos` — cada documento es un empleado.
- `servicios` — cada documento es un servicio del catálogo.
- `meta/horario` — un documento único con la configuración de horario.
- `meta/domicilio` — un documento único con si el servicio a domicilio está activo y cuánto es el recargo.
- `meta/contador` — un documento único que lleva el número de ticket consecutivo (evita que dos clientes agendando al mismo tiempo desde distintos dispositivos se choquen el número).

## ⚠️ Importante: actualiza las reglas de Firestore

Cuando creaste la base en modo de prueba, Firebase puso una regla que **caduca a los 30 días** y después bloquea todo. Ve a tu proyecto → **Firestore Database → Reglas** y reemplaza el contenido por esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Dale a **Publicar**. Esto deja la base abierta permanentemente (sin fecha de caducidad) — es una limitación aceptable para un negocio pequeño con este tipo de sitio sin backend propio, pero significa que alguien que revise el código con mucho detalle técnicamente podría escribir directo a la base sin pasar por tu login. Si más adelante quieres cerrarlo más, se puede agregar autenticación real de Firebase (ya sería una vuelta aparte).

## El logo

Coloca tu archivo en `logo.png` (ese nombre exacto). Aparece en el header de todas las páginas y dentro del PDF del ticket. Si no existe, el sitio no se rompe: muestra un monograma de respaldo.

## Cómo publicarlo en GitHub Pages

1. Sube estos archivos tal cual a tu repositorio (deja `logo.png` en la misma carpeta que los `.html`).
2. En el repo: **Settings → Pages → Source**, elige la rama `main` y carpeta `/ (root)`.
3. Tu sitio quedará en la liga que ya tienes: `https://corporation-lumio.github.io/nikosbarber/`

Como ahora la base de datos vive en Firebase (no en el navegador), **cualquier computadora o celular que entre a esa liga va a ver la misma información**, en tiempo real.

## Usuarios de prueba

- **Dueño**: usuario `dueno` / clave `nikos2026` (cámbialo en `data.js`, variable `CREDENCIALES_DUENO`).
- **Barbero de ejemplo**: usuario `rodolfo` / clave `corte123` (o cualquiera que des de alta en Empleados).

## Cómo personalizarlo

- **Nombre del negocio**: busca "Nikos Barber" en los archivos `.html` y reemplázalo.
- **Barberos**: se gestionan desde `empleados.html` una vez dentro del sitio.
- **Servicios, precios y horario**: se gestionan desde `ajustes.html`.
- **Colores**: variables `:root` al inicio de `style.css`.

## Ideas para cuando quieras llevarlo más lejos

- Agregar autenticación real de Firebase (en vez de usuario/clave hechos a mano) para cerrar más las reglas de seguridad.
- Enviar confirmación y recordatorio por WhatsApp (como en tu página de Build&Restore).
- Notificaciones push cuando cambia el estado de una cita.
