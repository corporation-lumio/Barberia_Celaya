/* =========================================================
   NIKOS BARBER — capa de datos (Firestore)
   Ahora todo vive en una base de datos real en internet
   (Firebase Firestore), así que cualquier dispositivo que
   entre al sitio ve la misma información: citas, empleados,
   servicios y horario.

   Este archivo es un MÓDULO de JavaScript (type="module").
   Por eso cada página lo importa así en su <script>:
     import { DB, mostrarToast, formatearFecha } from './data.js';
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, onSnapshot, runTransaction, query, where
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// --- tu configuración de Firebase (es información pública, no secreta) ---
const firebaseConfig = {
  apiKey: "AIzaSyDHTBkd0n9CclNKeHrWHyzRPLg-meGpS9g",
  authDomain: "nikosbarber-82ec6.firebaseapp.com",
  projectId: "nikosbarber-82ec6",
  storageBucket: "nikosbarber-82ec6.firebasestorage.app",
  messagingSenderId: "949763794559",
  appId: "1:949763794559:web:144482401a6b7dd426014a"
};

const app = initializeApp(firebaseConfig);
const fs = getFirestore(app);

export const DB = {
  SESION_KEY: 'nikos_sesion', // la sesión de login sí se queda local a cada dispositivo (es lo esperado)

  CREDENCIALES_DUENO: { usuario: 'dueno', clave: 'nikos2026' },

  BARBEROS_SEED: [
    { id: 'b1', nombre: 'Rodolfo', usuario: 'rodolfo', clave: 'corte123', activo: true },
    { id: 'b2', nombre: 'Toño',    usuario: 'tono',     clave: 'corte123', activo: true },
    { id: 'b3', nombre: 'Memo',    usuario: 'memo',     clave: 'corte123', activo: true }
  ],

  SERVICIOS_SEED: [
    { id: 's1', nombre: 'Corte clásico', minutos: 30, precio: 120 },
    { id: 's2', nombre: 'Corte + barba', minutos: 45, precio: 180 },
    { id: 's3', nombre: 'Arreglo de barba', minutos: 20, precio: 90 },
    { id: 's4', nombre: 'Corte a máquina', minutos: 20, precio: 90 },
    { id: 's5', nombre: 'Diseño / línea', minutos: 15, precio: 60 }
  ],

  HORARIO_SEED: { inicio: '07:00', fin: '16:00', intervalo: 30 },

  // =========================================================
  //  EMPLEADOS (barberos) — colección "barberos"
  // =========================================================
  async obtenerBarberos() {
    const snap = await getDocs(collection(fs, 'barberos'));
    if (snap.empty) {
      for (const b of this.BARBEROS_SEED) {
        await setDoc(doc(fs, 'barberos', b.id), {
          nombre: b.nombre, usuario: b.usuario, clave: b.clave, activo: b.activo
        });
      }
      return this.BARBEROS_SEED.slice();
    }
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async barberosActivos() {
    const barberos = await this.obtenerBarberos();
    return barberos.filter(b => b.activo);
  },

  async agregarBarbero({ nombre, usuario, clave }) {
    const existe = await getDocs(query(collection(fs, 'barberos'), where('usuario', '==', usuario)));
    if (!existe.empty) return { error: 'Ese usuario ya existe. Elige otro.' };
    const ref = await addDoc(collection(fs, 'barberos'), { nombre, usuario, clave, activo: true });
    return { barbero: { id: ref.id, nombre, usuario, clave, activo: true } };
  },

  async editarBarbero(id, { nombre, usuario, clave }) {
    const existe = await getDocs(query(collection(fs, 'barberos'), where('usuario', '==', usuario)));
    const otro = existe.docs.find(d => d.id !== id);
    if (otro) return { error: 'Ese usuario ya lo tiene otro empleado.' };
    const datos = { nombre, usuario };
    if (clave) datos.clave = clave;
    await updateDoc(doc(fs, 'barberos', id), datos);
    return { barbero: { id, nombre, usuario } };
  },

  async cambiarEstadoBarbero(id, activo) {
    await updateDoc(doc(fs, 'barberos', id), { activo });
  },

  async eliminarBarbero(id) {
    await deleteDoc(doc(fs, 'barberos', id));
  },

  // =========================================================
  //  SERVICIOS — colección "servicios"
  // =========================================================
  async obtenerServicios() {
    const snap = await getDocs(collection(fs, 'servicios'));
    if (snap.empty) {
      for (const s of this.SERVICIOS_SEED) {
        await setDoc(doc(fs, 'servicios', s.id), { nombre: s.nombre, minutos: s.minutos, precio: s.precio });
      }
      return this.SERVICIOS_SEED.slice();
    }
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async agregarServicio({ nombre, minutos, precio }) {
    const ref = await addDoc(collection(fs, 'servicios'), {
      nombre, minutos: Number(minutos), precio: Number(precio)
    });
    return { id: ref.id, nombre, minutos: Number(minutos), precio: Number(precio) };
  },

  async editarServicio(id, { nombre, minutos, precio }) {
    await updateDoc(doc(fs, 'servicios', id), {
      nombre, minutos: Number(minutos), precio: Number(precio)
    });
  },

  async eliminarServicio(id) {
    await deleteDoc(doc(fs, 'servicios', id));
  },

  async servicio(id) {
    const servicios = await this.obtenerServicios();
    return servicios.find(s => s.id === id);
  },

  async barbero(id) {
    const barberos = await this.obtenerBarberos();
    return barberos.find(b => b.id === id);
  },

  // =========================================================
  //  HORARIO DEL NEGOCIO — documento único "meta/horario"
  // =========================================================
  async obtenerConfigHorario() {
    const ref = doc(fs, 'meta', 'horario');
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, this.HORARIO_SEED);
      return { ...this.HORARIO_SEED };
    }
    return snap.data();
  },

  async guardarConfigHorario(config) {
    await setDoc(doc(fs, 'meta', 'horario'), config);
  },

  async obtenerHorarios() {
    const { inicio, fin, intervalo } = await this.obtenerConfigHorario();
    const [hI, mI] = inicio.split(':').map(Number);
    const [hF, mF] = fin.split(':').map(Number);
    const inicioMin = hI * 60 + mI;
    const finMin = hF * 60 + mF;
    const horas = [];
    for (let t = inicioMin; t <= finMin; t += Number(intervalo)) {
      const hh = String(Math.floor(t / 60)).padStart(2, '0');
      const mm = String(t % 60).padStart(2, '0');
      horas.push(`${hh}:${mm}`);
    }
    return horas;
  },

  // =========================================================
  //  RECARGO A DOMICILIO — documento único "meta/domicilio"
  // =========================================================
  DOMICILIO_SEED: { recargo: 100, activo: true },

  async obtenerConfigDomicilio() {
    const ref = doc(fs, 'meta', 'domicilio');
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, this.DOMICILIO_SEED);
      return { ...this.DOMICILIO_SEED };
    }
    return { ...this.DOMICILIO_SEED, ...snap.data() };
  },

  async guardarConfigDomicilio(config) {
    await setDoc(doc(fs, 'meta', 'domicilio'), config);
  },

  // =========================================================
  //  CITAS — colección "citas"
  // =========================================================
  async obtenerCitas() {
    const snap = await getDocs(collection(fs, 'citas'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // escucha cambios en tiempo real (para que el panel se actualice solo,
  // sin recargar, cuando el cliente agenda desde OTRO dispositivo)
  escucharCitas(callback, onError) {
    return onSnapshot(
      collection(fs, 'citas'),
      (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error('Error escuchando citas:', err);
        if (onError) onError(err);
      }
    );
  },

  // calcula el precio total de una cita: precio del servicio + recargo si es a domicilio
  async calcularPrecioTotal(servicioId, modalidad) {
    const servicio = await this.servicio(servicioId);
    const base = servicio ? servicio.precio : 0;
    if (modalidad !== 'domicilio') return base;
    const config = await this.obtenerConfigDomicilio();
    if (!config.activo) return base; // si el dueño lo desactivó, no se cobra recargo
    return base + Number(config.recargo);
  },

  // `precioManual` permite registrar un costo distinto al del catálogo (citas imprevistas).
  // `estadoInicial` permite crear la cita ya como "completada" (walk-ins que ya pasaron).
  async crearCita({ nombre, telefono, servicioId, barberoId, fecha, hora, notas, modalidad, precioManual, estadoInicial }) {
    const modalidadFinal = modalidad === 'domicilio' ? 'domicilio' : 'local';
    const precioTotal = precioManual != null && precioManual !== ''
      ? Number(precioManual)
      : await this.calcularPrecioTotal(servicioId, modalidadFinal);

    const contadorRef = doc(fs, 'meta', 'contador');
    const citaRef = doc(collection(fs, 'citas'));

    const cita = await runTransaction(fs, async (tx) => {
      const contadorSnap = await tx.get(contadorRef);
      const ultimo = contadorSnap.exists() ? contadorSnap.data().ultimo : 100;
      const numero = ultimo + 1;

      const nuevaCita = {
        numero, nombre, telefono, servicioId, barberoId, fecha, hora,
        notas: notas || '',
        modalidad: modalidadFinal,
        precioTotal,
        estado: estadoInicial || 'pendiente',
        calificacion: null,
        comentario: '',
        creada: new Date().toISOString()
      };

      tx.set(contadorRef, { ultimo: numero });
      tx.set(citaRef, nuevaCita);
      return nuevaCita;
    });

    return { id: citaRef.id, ...cita };
  },

  async actualizarEstado(id, estado) {
    await updateDoc(doc(fs, 'citas', id), { estado });
  },

  async calificarCita(numero, telefono, calificacion, comentario) {
    const citas = await this.obtenerCitas();
    const cita = citas.find(c => String(c.numero) === String(numero) && c.telefono === telefono);
    if (cita && cita.estado === 'completada' && !cita.calificacion) {
      await updateDoc(doc(fs, 'citas', cita.id), { calificacion, comentario: comentario || '' });
      return { ...cita, calificacion, comentario: comentario || '' };
    }
    return null;
  },

  async buscarCita(numero, telefono) {
    const citas = await this.obtenerCitas();
    return citas.find(c => String(c.numero) === String(numero) && c.telefono === telefono) || null;
  },

  async eliminarCita(id) {
    await deleteDoc(doc(fs, 'citas', id));
  },

  async horaOcupada(barberoId, fecha, hora, ignorarId) {
    const citas = await this.obtenerCitas();
    return citas.some(c =>
      c.barberoId === barberoId && c.fecha === fecha && c.hora === hora &&
      c.estado !== 'cancelada' && c.id !== ignorarId
    );
  },

  async hayAlguienLibre(fecha, hora) {
    const activos = await this.barberosActivos();
    const citas = await this.obtenerCitas();
    return activos.some(b => !citas.some(c =>
      c.barberoId === b.id && c.fecha === fecha && c.hora === hora && c.estado !== 'cancelada'
    ));
  },

  async asignarBarberoEquitativo(fecha, hora) {
    const activos = await this.barberosActivos();
    const citas = (await this.obtenerCitas()).filter(c => c.estado !== 'cancelada');
    const libres = activos.filter(b => !citas.some(c =>
      c.barberoId === b.id && c.fecha === fecha && c.hora === hora
    ));
    if (libres.length === 0) return null;
    libres.sort((a, b) => {
      const cargaA = citas.filter(c => c.barberoId === a.id).length;
      const cargaB = citas.filter(c => c.barberoId === b.id).length;
      return cargaA - cargaB;
    });
    return libres[0];
  },

  async promedioCalificacion(barberoId, citasYaCargadas) {
    const citas = (citasYaCargadas || await this.obtenerCitas()).filter(c =>
      (!barberoId || c.barberoId === barberoId) && c.calificacion
    );
    if (citas.length === 0) return null;
    const suma = citas.reduce((s, c) => s + c.calificacion, 0);
    return { promedio: (suma / citas.length).toFixed(1), total: citas.length };
  },

  // =========================================================
  //  SESIÓN (dueño o barbero) — se queda local a cada dispositivo,
  //  eso es lo esperado: cada quien inicia sesión por su lado.
  // =========================================================
  async iniciarSesion(usuario, clave) {
    if (usuario === this.CREDENCIALES_DUENO.usuario && clave === this.CREDENCIALES_DUENO.clave) {
      localStorage.setItem(this.SESION_KEY, JSON.stringify({ tipo: 'dueno', usuario, ts: Date.now() }));
      return { tipo: 'dueno' };
    }
    const barberos = await this.obtenerBarberos();
    const barbero = barberos.find(b => b.usuario === usuario && b.clave === clave && b.activo);
    if (barbero) {
      localStorage.setItem(this.SESION_KEY, JSON.stringify({ tipo: 'barbero', barberoId: barbero.id, usuario, ts: Date.now() }));
      return { tipo: 'barbero', barberoId: barbero.id };
    }
    return null;
  },

  sesionActual() {
    try { return JSON.parse(localStorage.getItem(this.SESION_KEY)); } catch (e) { return null; }
  },

  haySesion() { return !!localStorage.getItem(this.SESION_KEY); },

  cerrarSesion() { localStorage.removeItem(this.SESION_KEY); }
};

export function mostrarToast(mensaje) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = mensaje;
  requestAnimationFrame(() => el.classList.add('mostrar'));
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.classList.remove('mostrar'), 3200);
}

export function formatearFecha(fechaISO) {
  const [y, m, d] = fechaISO.split('-');
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d} ${meses[parseInt(m,10)-1]} ${y}`;
}
