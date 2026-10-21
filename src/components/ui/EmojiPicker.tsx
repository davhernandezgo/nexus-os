import React, { useState, useMemo } from 'react';
import { Search, Sparkles, X, Keyboard } from 'lucide-react';

export interface EmojiCategory {
  id: string;
  label: string;
  icon: string;
  emojis: { char: string; name: string; keywords: string[] }[];
}

export const EMOJI_DATABASE: EmojiCategory[] = [
  {
    id: 'popular',
    label: 'Populares',
    icon: '🌟',
    emojis: [
      { char: '📁', name: 'Carpeta', keywords: ['carpeta', 'proyecto', 'archivo', 'documento', 'folder'] },
      { char: '🚀', name: 'Cohete', keywords: ['cohete', 'despegue', 'lanzamiento', 'startup', 'meta', 'rapido'] },
      { char: '💡', name: 'Bombilla', keywords: ['idea', 'bombilla', 'luz', 'creatividad', 'pensar'] },
      { char: '⚡', name: 'Rayo', keywords: ['rayo', 'energia', 'rapido', 'urgente', 'fuerza', 'poder'] },
      { char: '🛠️', name: 'Herramientas', keywords: ['herramientas', 'reparar', 'config', 'dev', 'construir', 'soporte'] },
      { char: '🎨', name: 'Paleta de Arte', keywords: ['arte', 'diseno', 'creatividad', 'colores', 'ui', 'ux'] },
      { char: '💼', name: 'Maletín', keywords: ['trabajo', 'negocio', 'oficina', 'empleo', 'empresa', 'work'] },
      { char: '🏡', name: 'Casa con jardín', keywords: ['casa', 'hogar', 'apartamento', 'vivienda', 'home'] },
      { char: '✈️', name: 'Avión', keywords: ['avion', 'viaje', 'vuelo', 'turismo', 'vacaciones', 'travel'] },
      { char: '💰', name: 'Bolsa de dinero', keywords: ['dinero', 'plata', 'finanzas', 'ahorro', 'presupuesto', 'pago'] },
      { char: '🎯', name: 'Diana', keywords: ['objetivo', 'meta', 'blanco', 'enfoque', 'target'] },
      { char: '🏆', name: 'Trofeo', keywords: ['trofeo', 'victoria', 'premio', 'campeon', 'exito'] },
      { char: '⭐', name: 'Estrella', keywords: ['estrella', 'favorito', 'destacado', 'calidad', 'importante'] },
      { char: '🔥', name: 'Fuego', keywords: ['fuego', 'racha', 'streak', 'urgente', 'caliente', 'motivado'] },
      { char: '💎', name: 'Diamante', keywords: ['diamante', 'lujo', 'valioso', 'calidad', 'joya'] },
      { char: '🔑', name: 'Llave', keywords: ['llave', 'acceso', 'seguridad', 'clave', 'password'] },
      { char: '🔒', name: 'Candado cerrado', keywords: ['privado', 'candado', 'seguro', 'confidencial'] },
      { char: '🏷️', name: 'Etiqueta', keywords: ['etiqueta', 'tag', 'categoria', 'precio'] },
      { char: '📌', name: 'Chincheta', keywords: ['fijar', 'chincheta', 'recordar', 'nota'] },
      { char: '📍', name: 'Pin redondo', keywords: ['ubicacion', 'lugar', 'mapa', 'sitio'] },
      { char: '⏱️', name: 'Cronómetro', keywords: ['tiempo', 'temporizador', 'cronometro', 'minutos'] },
      { char: '📅', name: 'Calendario', keywords: ['calendario', 'fecha', 'agenda', 'evento'] },
      { char: '📋', name: 'Portapapeles', keywords: ['lista', 'tareas', 'checklist', 'revision'] },
      { char: '📝', name: 'Bloc de notas', keywords: ['escribir', 'nota', 'documento', 'lapiz'] },
      { char: '📦', name: 'Paquete', keywords: ['caja', 'envio', 'entrega', 'modulo', 'producto'] },
      { char: '🌐', name: 'Globo terráqueo', keywords: ['web', 'mundo', 'internet', 'global', 'red'] },
      { char: '🤖', name: 'Robot', keywords: ['robot', 'ia', 'inteligencia artificial', 'bot', 'automatizacion'] },
      { char: '🛡️', name: 'Escudo', keywords: ['escudo', 'seguridad', 'proteccion', 'defensa'] },
      { char: '👑', name: 'Corona', keywords: ['corona', 'rey', 'reina', 'lider', 'vip', 'premium'] },
      { char: '✨', name: 'Chispas', keywords: ['chispas', 'magia', 'nuevo', 'destacado', 'especial'] },
      { char: '☕', name: 'Café', keywords: ['cafe', 'desayuno', 'energia', 'pausa', 'coffee'] },
      { char: '🧘', name: 'Meditación', keywords: ['meditacion', 'zen', 'calma', 'paz', 'yoga'] },
      { char: '🥗', name: 'Ensalada', keywords: ['salud', 'comida', 'nutricion', 'dieta', 'fitness'] },
      { char: '💧', name: 'Gota de agua', keywords: ['agua', 'hidratacion', 'beber', 'vaso', 'salud'] },
      { char: '💻', name: 'Portátil', keywords: ['laptop', 'computador', 'programacion', 'desarrollo', 'tech'] },
      { char: '📚', name: 'Libros', keywords: ['libros', 'lectura', 'estudio', 'aprender', 'biblioteca'] },
    ],
  },
  {
    id: 'tech',
    label: 'Tech & Dev',
    icon: '💻',
    emojis: [
      { char: '💻', name: 'Computador', keywords: ['laptop', 'programacion', 'codigo', 'software'] },
      { char: '🖥️', name: 'Pantalla', keywords: ['monitor', 'pantalla', 'escritorio', 'pc'] },
      { char: '⌨️', name: 'Teclado', keywords: ['teclado', 'escribir', 'mecanografia', 'hardware'] },
      { char: '🖱️', name: 'Ratón', keywords: ['mouse', 'click', 'cursor', 'hardware'] },
      { char: '📱', name: 'Móvil', keywords: ['celular', 'telefono', 'smartphone', 'app', 'ios', 'android'] },
      { char: '💾', name: 'Disquete', keywords: ['guardar', 'save', 'disco', 'respaldo', 'backup'] },
      { char: '💿', name: 'Disco óptico', keywords: ['cd', 'dvd', 'almacenamiento', 'musica'] },
      { char: '📡', name: 'Antena satelital', keywords: ['red', 'conexion', 'wifi', 'antena', 'comunicacion'] },
      { char: '🛰️', name: 'Satélite', keywords: ['satelite', 'espacio', 'gps', 'telecomunicaciones'] },
      { char: '⚙️', name: 'Engranaje', keywords: ['configuracion', 'ajustes', 'motor', 'sistema'] },
      { char: '🔧', name: 'Llave inglesa', keywords: ['ajuste', 'mantenimiento', 'reparacion', 'soporte'] },
      { char: '🔨', name: 'Martillo', keywords: ['construir', 'herramienta', 'build', 'romper'] },
      { char: '🪛', name: 'Destornillador', keywords: ['destornillador', 'arreglo', 'hardware'] },
      { char: '📐', name: 'Escuadra', keywords: ['arquitectura', 'diseno', 'medida', 'geometria'] },
      { char: '📏', name: 'Regla', keywords: ['regla', 'medicion', 'escala', 'metricas'] },
      { char: '🔬', name: 'Microscopio', keywords: ['ciencia', 'analisis', 'detalle', 'investigacion', 'test'] },
      { char: '🧪', name: 'Tubo de ensayo', keywords: ['experimento', 'prueba', 'quimica', 'testing', 'qa'] },
      { char: '🧮', name: 'Ábaco', keywords: ['calculo', 'matematicas', 'cuentas', 'algoritmo'] },
      { char: '🖇️', name: 'Clips unidos', keywords: ['adjunto', 'vincular', 'unir', 'link'] },
      { char: '📎', name: 'Clip', keywords: ['clip', 'adjuntar', 'anexo', 'papeleria'] },
      { char: '✂️', name: 'Tijeras', keywords: ['cortar', 'recortar', 'editar'] },
      { char: '🗂️', name: 'Divisores de índice', keywords: ['indice', 'clasificar', 'carpetas', 'archivo'] },
      { char: '🗃️', name: 'Caja de fichas', keywords: ['base de datos', 'fichero', 'archivo', 'registros'] },
      { char: '🗳️', name: 'Urna electoral', keywords: ['voto', 'encuesta', 'decision', 'caja'] },
      { char: '✉️', name: 'Sobre', keywords: ['correo', 'email', 'mensaje', 'contacto'] },
      { char: '📧', name: 'Correo electrónico', keywords: ['email', 'mensaje', 'inbox'] },
      { char: '📣', name: 'Megáfono', keywords: ['anuncio', 'noticia', 'marketing', 'aviso'] },
      { char: '📢', name: 'Altavoz', keywords: ['comunicado', 'sonido', 'alerta'] },
      { char: '🔔', name: 'Campana', keywords: ['notificacion', 'alerta', 'recordatorio', 'aviso'] },
      { char: '📞', name: 'Teléfono', keywords: ['llamada', 'soporte', 'contacto'] },
      { char: '🔌', name: 'Enchufe eléctrico', keywords: ['enchufe', 'conexion', 'energia', 'api', 'plugin'] },
      { char: '🔋', name: 'Batería', keywords: ['bateria', 'energia', 'carga', 'pila'] },
    ],
  },
  {
    id: 'couple',
    label: 'Pareja & Hogar',
    icon: '💑',
    emojis: [
      { char: '💑', name: 'Pareja con corazón', keywords: ['pareja', 'amor', 'novios', 'esposos', 'juntos'] },
      { char: '👩‍❤️‍👨', name: 'Pareja mujer y hombre', keywords: ['pareja', 'david', 'cami', 'amor'] },
      { char: '💏', name: 'Beso de pareja', keywords: ['beso', 'amor', 'romance', 'afecto'] },
      { char: '💖', name: 'Corazón brillante', keywords: ['corazon', 'amor', 'brillo', 'especial', 'cuidado'] },
      { char: '💗', name: 'Corazón creciente', keywords: ['amor', 'afecto', 'crecimiento', 'cuidado'] },
      { char: '💓', name: 'Corazón palpitante', keywords: ['emocion', 'latido', 'amor'] },
      { char: '💞', name: 'Corazones giratorios', keywords: ['amor', 'conexion', 'pareja'] },
      { char: '💕', name: 'Dos corazones', keywords: ['amor', 'amistad', 'duo', 'pareja'] },
      { char: '💌', name: 'Carta de amor', keywords: ['mensaje', 'carta', 'nota de amor', 'romantico'] },
      { char: '💍', name: 'Anillo', keywords: ['compromiso', 'boda', 'alianza', 'promesa'] },
      { char: '💒', name: 'Boda', keywords: ['matrimonio', 'boda', 'iglesia', 'celebracion'] },
      { char: '🏡', name: 'Casa con jardín', keywords: ['casa', 'hogar', 'apartamento', 'eskala', 'mudanza'] },
      { char: '🏠', name: 'Casa', keywords: ['casa', 'hogar', 'vivienda', 'adentro'] },
      { char: '🛋️', name: 'Sofá', keywords: ['sala', 'sofa', 'mueble', 'descanso', 'decoracion'] },
      { char: '🛏️', name: 'Cama', keywords: ['dormir', 'cama', 'habitacion', 'descanso'] },
      { char: '🚪', name: 'Puerta', keywords: ['puerta', 'entrada', 'bienvenida', 'hogar'] },
      { char: '🪴', name: 'Planta en maceta', keywords: ['planta', 'hogar', 'decoracion', 'naturaleza', 'verde'] },
      { char: '🍽️', name: 'Plato con cubiertos', keywords: ['cena', 'almuerzo', 'comida', 'restaurante', 'cocina'] },
      { char: '🍳', name: 'Cocinar huevo', keywords: ['cocinar', 'desayuno', 'comida casera', 'receta'] },
      { char: '🥂', name: 'Copas brindando', keywords: ['brindis', 'celebracion', 'aniversario', 'vino'] },
      { char: '🍷', name: 'Copa de vino', keywords: ['vino', 'cena romantica', 'relajacion', 'brindis'] },
      { char: '🍻', name: 'Jarras de cerveza', keywords: ['cerveza', 'salida', 'amigos', 'fiesta'] },
      { char: '🍰', name: 'Pastel', keywords: ['postre', 'dulce', 'cumpleanos', 'tarta'] },
      { char: '🍫', name: 'Chocolate', keywords: ['chocolate', 'dulce', 'antojo', 'regalo'] },
      { char: '🍿', name: 'Palomitas de maíz', keywords: ['pelicula', 'cine', 'netflix', 'noche de pelis'] },
      { char: '🕯️', name: 'Vela', keywords: ['vela', 'romantico', 'paz', 'aroma', 'cena'] },
      { char: '🧸', name: 'Oso de peluche', keywords: ['peluche', 'ternura', 'regalo', 'carino'] },
      { char: '🎁', name: 'Regalo', keywords: ['regalo', 'sorpresa', 'cumpleanos', 'navidad'] },
      { char: '🎈', name: 'Globo', keywords: ['globo', 'fiesta', 'cumpleanos', 'alegria'] },
      { char: '🎉', name: 'Matasuegras / Fiesta', keywords: ['fiesta', 'celebracion', 'victoria', 'felicidades'] },
      { char: '🐾', name: 'Huellas de mascota', keywords: ['mascota', 'perro', 'gato', 'animales'] },
      { char: '🐶', name: 'Perro', keywords: ['perro', 'mascota', 'perrito', 'paseo'] },
      { char: '🐱', name: 'Gato', keywords: ['gato', 'mascota', 'gatito'] },
      { char: '🌻', name: 'Girasol', keywords: ['girasol', 'flor', 'alegria', 'sol'] },
      { char: '🌸', name: 'Flor de cerezo', keywords: ['flor', 'rosa', 'primavera', 'delicadeza'] },
      { char: '🌹', name: 'Rosa', keywords: ['rosa', 'flor', 'amor', 'romantico'] },
    ],
  },
  {
    id: 'health',
    label: 'Salud & Bienestar',
    icon: '🥗',
    emojis: [
      { char: '💧', name: 'Gota de agua', keywords: ['agua', 'vaso', 'hidratacion', 'beber', 'salud'] },
      { char: '🥤', name: 'Vaso con pajita', keywords: ['bebida', 'jugo', 'agua', 'batido'] },
      { char: '🚰', name: 'Agua potable', keywords: ['grifo', 'agua', 'tomar agua', 'hidratarse'] },
      { char: '🏃‍♂️', name: 'Hombre corriendo', keywords: ['correr', 'running', 'cardio', 'ejercicio', 'entrenamiento'] },
      { char: '🏃‍♀️', name: 'Mujer corriendo', keywords: ['correr', 'running', 'cardio', 'ejercicio'] },
      { char: '🏋️‍♂️', name: 'Hombre levantando pesas', keywords: ['pesas', 'gimnasio', 'gym', 'fuerza', 'musculo'] },
      { char: '🏋️‍♀️', name: 'Mujer levantando pesas', keywords: ['pesas', 'gimnasio', 'gym', 'fuerza'] },
      { char: '🧘‍♂️', name: 'Hombre meditando', keywords: ['yoga', 'meditacion', 'zen', 'respiracion', 'estiramiento'] },
      { char: '🧘‍♀️', name: 'Mujer meditando', keywords: ['yoga', 'meditacion', 'zen', 'calma'] },
      { char: '🚴‍♂️', name: 'Hombre en bicicleta', keywords: ['bicicleta', 'ciclismo', 'bici', 'cardio'] },
      { char: '🚴‍♀️', name: 'Mujer en bicicleta', keywords: ['bicicleta', 'ciclismo', 'paseo'] },
      { char: '🏊‍♂️', name: 'Hombre nadando', keywords: ['nadar', 'natacion', 'piscina', 'agua'] },
      { char: '🤸‍♂️', name: 'Hombre haciendo voltereta', keywords: ['calistenia', 'gimnasia', 'movilidad', 'flexibilidad'] },
      { char: '🥑', name: 'Aguacate', keywords: ['aguacate', 'comida', 'grasa saludable', 'desayuno', 'keto'] },
      { char: '🥗', name: 'Ensalada', keywords: ['ensalada', 'verduras', 'almuerzo saludable', 'dieta'] },
      { char: '🍎', name: 'Manzana roja', keywords: ['manzana', 'fruta', 'merienda', 'snack'] },
      { char: '🍌', name: 'Plátano / Banano', keywords: ['platano', 'banana', 'potasio', 'fruta'] },
      { char: '🍓', name: 'Fresa', keywords: ['fresa', 'fruta', 'antioxidantes'] },
      { char: '🥕', name: 'Zanahoria', keywords: ['zanahoria', 'vegetal', 'nutricion', 'vista'] },
      { char: '🥦', name: 'Brócoli', keywords: ['brocoli', 'verde', 'nutricion', 'vegetales'] },
      { char: '🥩', name: 'Carne', keywords: ['carne', 'proteina', 'asado', 'comida'] },
      { char: '🍳', name: 'Huevo cocinado', keywords: ['huevo', 'proteina', 'desayuno'] },
      { char: '🍵', name: 'Té verde', keywords: ['te', 'infusion', 'calma', 'antioxidante'] },
      { char: '☕', name: 'Café', keywords: ['cafe', 'energia', 'manana'] },
      { char: '💊', name: 'Píldora / Vitamina', keywords: ['vitamina', 'medicina', 'pastilla', 'suplemento'] },
      { char: '🩺', name: 'Estetoscopio', keywords: ['medico', 'doctor', 'chequeo', 'salud', 'clinica'] },
      { char: '🫀', name: 'Corazón anatómico', keywords: ['cardio', 'corazon', 'ritmo', 'salud cardiovascular'] },
      { char: '🧠', name: 'Cerebro', keywords: ['mente', 'cognitivo', 'estudio', 'memoria', 'enfoque'] },
      { char: '🦷', name: 'Diente', keywords: ['dental', 'diente', 'sonrisa', 'higiene'] },
      { char: '🩹', name: 'Tirita / Curita', keywords: ['recuperacion', 'curita', 'herida', 'cuidado'] },
      { char: '💤', name: 'Dormir Zzz', keywords: ['sueno', 'dormir', 'siesta', 'descanso', 'horas de sueno'] },
      { char: '🛌', name: 'Persona en cama', keywords: ['acostarse', 'dormir temprano', 'descansar'] },
      { char: '🚶‍♂️', name: 'Hombre caminando', keywords: ['caminar', 'pasos', '10000 pasos', 'paseo'] },
    ],
  },
  {
    id: 'travel',
    label: 'Viajes & Aventura',
    icon: '✈️',
    emojis: [
      { char: '✈️', name: 'Avión', keywords: ['avion', 'vuelo', 'viaje', 'aeropuerto', 'pasaporte'] },
      { char: '🛫', name: 'Avión despegando', keywords: ['despegue', 'salida', 'vuelo'] },
      { char: '🛬', name: 'Avión aterrizando', keywords: ['llegada', 'destino', 'viaje'] },
      { char: '🏖️', name: 'Playa con sombrilla', keywords: ['playa', 'mar', 'verano', 'costa', 'sol'] },
      { char: '🏝️', name: 'Isla desierta', keywords: ['isla', 'caribe', 'paraiso', 'vacaciones'] },
      { char: '🏕️', name: 'Camping', keywords: ['campamento', 'carpa', 'bosque', 'camping', 'montana'] },
      { char: '🏔️', name: 'Montaña nevada', keywords: ['montana', 'nieve', 'cordillera', 'senderismo', 'trekking'] },
      { char: '⛰️', name: 'Montaña', keywords: ['naturaleza', 'colina', 'escalar', 'trek'] },
      { char: '🌋', name: 'Volcán', keywords: ['volcan', 'aventura', 'lava', 'paisaje'] },
      { char: '🏜️', name: 'Desierto', keywords: ['desierto', 'arena', 'safari', 'dunas'] },
      { char: '🗽', name: 'Estatua de la Libertad', keywords: ['nueva york', 'usa', 'estados unidos', 'viaje'] },
      { char: '🗼', name: 'Torre de Tokio / Eiffel', keywords: ['torre', 'paris', 'tokio', 'turismo', 'francia'] },
      { char: '🏰', name: 'Castillo', keywords: ['castillo', 'europa', 'historia', 'palacio'] },
      { char: '🚢', name: 'Barco / Crucero', keywords: ['crucero', 'barco', 'mar', 'navegacion'] },
      { char: '🛳️', name: 'Barco de pasajeros', keywords: ['ferry', 'crucero', 'mar'] },
      { char: '🚗', name: 'Automóvil', keywords: ['carro', 'auto', 'roadtrip', 'viaje por carretera'] },
      { char: '🚙', name: 'Camioneta SUV', keywords: ['camioneta', '4x4', 'paseo', 'ruta'] },
      { char: '🚕', name: 'Taxi', keywords: ['taxi', 'traslado', 'aeropuerto', 'transporte'] },
      { char: '🚂', name: 'Tren a vapor', keywords: ['tren', 'ferrocarril', 'viaje en tren'] },
      { char: '🚲', name: 'Bicicleta', keywords: ['bici', 'cicloruta', 'paseo'] },
      { char: '🛵', name: 'Motoneta', keywords: ['moto', 'scooter', 'ciudad'] },
      { char: '🗺️', name: 'Mapa mundial', keywords: ['mapa', 'rutas', 'itinerario', 'paises'] },
      { char: '🧭', name: 'Brújula', keywords: ['brujula', 'orientacion', 'rumbo', 'exploracion'] },
      { char: '🎒', name: 'Mochila', keywords: ['mochila', 'equipaje', 'mochilero', 'backpack'] },
      { char: '🧳', name: 'Maleta', keywords: ['maleta', 'equipaje', 'valija', 'viajar'] },
      { char: '🌴', name: 'Palmera', keywords: ['palmera', 'tropical', 'calor', 'playa'] },
      { char: '🌲', name: 'Pino', keywords: ['bosque', 'naturaleza', 'aire libre'] },
      { char: '🍁', name: 'Hoja de arce', keywords: ['otono', 'canada', 'naturaleza'] },
      { char: '☀️', name: 'Sol brillante', keywords: ['sol', 'buen dia', 'clima', 'calor'] },
      { char: '🌅', name: 'Amanecer', keywords: ['amanecer', 'madrugada', 'despertar', 'paisaje'] },
      { char: '🌄', name: 'Amanecer sobre montañas', keywords: ['vista', 'manana', 'montana'] },
      { char: '🌌', name: 'Vía Láctea', keywords: ['estrellas', 'noche', 'cielo', 'universo'] },
      { char: '🌊', name: 'Ola de mar', keywords: ['olas', 'surf', 'mar', 'oceano'] },
      { char: '⛺', name: 'Tienda de campaña', keywords: ['carpa', 'dormir fuera', 'acampar'] },
    ],
  },
  {
    id: 'finance',
    label: 'Finanzas & Metas',
    icon: '💰',
    emojis: [
      { char: '💰', name: 'Bolsa de dinero', keywords: ['dinero', 'plata', 'riqueza', 'ingresos'] },
      { char: '💵', name: 'Billete de dólar', keywords: ['dolar', 'efectivo', 'pago', 'cash'] },
      { char: '💴', name: 'Billete de yen', keywords: ['yen', 'moneda', 'dinero'] },
      { char: '💶', name: 'Billete de euro', keywords: ['euro', 'europa', 'moneda'] },
      { char: '💷', name: 'Billete de libra', keywords: ['libra', 'dinero', 'uk'] },
      { char: '🪙', name: 'Moneda', keywords: ['moneda', 'cripto', 'cambio', 'ahorro'] },
      { char: '💳', name: 'Tarjeta de crédito', keywords: ['tarjeta', 'debito', 'credito', 'banco', 'compras'] },
      { char: '🏦', name: 'Banco', keywords: ['banco', 'cuenta', 'deposito', 'transferencia'] },
      { char: '📈', name: 'Gráfico alcista', keywords: ['crecimiento', 'inversion', 'subida', 'ganancias', 'trading'] },
      { char: '📉', name: 'Gráfico bajista', keywords: ['bajada', 'gastos', 'control', 'perdidas'] },
      { char: '📊', name: 'Gráfico de barras', keywords: ['reporte', 'estadisticas', 'metricas', 'analisis'] },
      { char: '🧾', name: 'Factura / Recibo', keywords: ['recibo', 'factura', 'gasto', 'impuestos', 'cuentas'] },
      { char: '💎', name: 'Diamante', keywords: ['valor', 'patrimonio', 'lujo', 'inversion'] },
      { char: '👑', name: 'Corona', keywords: ['meta mayor', 'rey', 'triunfo'] },
      { char: '🏆', name: 'Trofeo', keywords: ['logro', 'meta financiera', 'exito'] },
      { char: '🥇', name: 'Medalla 1er lugar', keywords: ['oro', 'primer lugar', 'ganador'] },
      { char: '🥈', name: 'Medalla 2do lugar', keywords: ['plata', 'segundo lugar'] },
      { char: '🥉', name: 'Medalla 3er lugar', keywords: ['bronce', 'tercer lugar'] },
      { char: '🎖️', name: 'Medalla militar', keywords: ['honor', 'disciplina', 'constancia'] },
      { char: '🏅', name: 'Medalla deportiva', keywords: ['premio', 'reconocimiento'] },
      { char: '🎯', name: 'Diana con dardo', keywords: ['meta', 'ahorro', 'objetivo'] },
      { char: '🎲', name: 'Dado', keywords: ['juego', 'probabilidad', 'riesgo'] },
      { char: '🎰', name: 'Máquina tragaperras', keywords: ['apuesta', 'suerte'] },
      { char: '🔮', name: 'Bola de cristal', keywords: ['futuro', 'prediccion', 'proyeccion'] },
      { char: '🧿', name: 'Ojo turco', keywords: ['proteccion', 'buenas vibras', 'amuleto'] },
      { char: '🍀', name: 'Trébol de 4 hojas', keywords: ['suerte', 'fortuna', 'abundancia'] },
      { char: '💸', name: 'Dinero con alas', keywords: ['gasto', 'salida de dinero', 'pago rapido'] },
      { char: '🤑', name: 'Cara con dinero', keywords: ['ganancia', 'millonario', 'exito financiero'] },
      { char: '⚖️', name: 'Balanza', keywords: ['balance', 'equilibrio', 'justicia', 'presupuesto'] },
    ],
  },
  {
    id: 'creative',
    label: 'Arte & Ocio',
    icon: '🎨',
    emojis: [
      { char: '🎨', name: 'Paleta de pintor', keywords: ['arte', 'pintar', 'dibujo', 'colores', 'creatividad'] },
      { char: '🖌️', name: 'Pincel', keywords: ['pintar', 'oleo', 'trazo', 'arte'] },
      { char: '🖍️', name: 'Crayón', keywords: ['colorear', 'boceto', 'dibujar'] },
      { char: '🎭', name: 'Máscaras de teatro', keywords: ['teatro', 'actuacion', 'drama', 'comedia'] },
      { char: '🎬', name: 'Claqueta de cine', keywords: ['cine', 'pelicula', 'video', 'produccion', 'rodaje'] },
      { char: '📸', name: 'Cámara con flash', keywords: ['foto', 'fotografia', 'recuerdo', 'captura'] },
      { char: '📷', name: 'Cámara fotográfica', keywords: ['camara', 'fotos', 'sesion'] },
      { char: '📹', name: 'Videocámara', keywords: ['video', 'grabacion', 'vlog', 'youtube'] },
      { char: '🎧', name: 'Auriculares', keywords: ['musica', 'podcast', 'audio', 'escuchar', 'focus'] },
      { char: '🎤', name: 'Micrófono', keywords: ['cantar', 'voz', 'podcast', 'presentacion'] },
      { char: '🎸', name: 'Guitarra', keywords: ['musica', 'rock', 'instrumento', 'guitarra'] },
      { char: '🎹', name: 'Teclado musical', keywords: ['piano', 'musica', 'cancion', 'melodia'] },
      { char: '🥁', name: 'Tambor con baquetas', keywords: ['bateria', 'ritmo', 'percusion'] },
      { char: '🎷', name: 'Saxofón', keywords: ['jazz', 'musica', 'viento'] },
      { char: '🎺', name: 'Trompeta', keywords: ['musica', 'trompeta', 'jazz'] },
      { char: '🎻', name: 'Violín', keywords: ['violin', 'musica clasica', 'cuerda'] },
      { char: '🎮', name: 'Mando de videojuegos', keywords: ['videojuegos', 'gaming', 'playstation', 'xbox', 'jugar'] },
      { char: '🕹️', name: 'Palanca de mando', keywords: ['arcade', 'retro', 'juego'] },
      { char: '🧩', name: 'Pieza de rompecabezas', keywords: ['puzzle', 'rompecabezas', 'resolver', 'encajar'] },
      { char: '♟️', name: 'Peón de ajedrez', keywords: ['ajedrez', 'estrategia', 'tactica', 'mente'] },
      { char: '🎪', name: 'Carpa de circo', keywords: ['circo', 'espectaculo', 'evento'] },
      { char: '🎟️', name: 'Entrada / Boleto', keywords: ['boleto', 'ticket', 'concierto', 'cine'] },
      { char: '📚', name: 'Libros apilados', keywords: ['lectura', 'estudio', 'biblioteca', 'conocimiento'] },
      { char: '📖', name: 'Libro abierto', keywords: ['leer', 'cuento', 'novela', 'historia'] },
      { char: '📕', name: 'Libro rojo', keywords: ['libro', 'diario', 'cuaderno'] },
      { char: '📗', name: 'Libro verde', keywords: ['manual', 'libro'] },
      { char: '📘', name: 'Libro azul', keywords: ['documentacion', 'libro'] },
      { char: '📙', name: 'Libro naranja', keywords: ['apuntes', 'libro'] },
      { char: '🪄', name: 'Varita mágica', keywords: ['magia', 'truco', 'efecto', 'especial'] },
      { char: '🪩', name: 'Bola de discoteca', keywords: ['disco', 'fiesta', 'baile', 'musica'] },
    ],
  },
  {
    id: 'faces',
    label: 'Expresiones',
    icon: '😀',
    emojis: [
      { char: '😀', name: 'Cara sonriente', keywords: ['feliz', 'alegre', 'bien', 'positivo'] },
      { char: '😃', name: 'Cara sonriente con ojos grandes', keywords: ['feliz', 'emocionado', 'alegria'] },
      { char: '😄', name: 'Cara sonriente con ojos sonrientes', keywords: ['risa', 'feliz', 'amable'] },
      { char: '😁', name: 'Cara sonriente con dientes', keywords: ['orgullo', 'sonrisa', 'exito'] },
      { char: '😆', name: 'Cara sonriente con ojos cerrados', keywords: ['risa', 'carcajada', 'divertido'] },
      { char: '🥹', name: 'Cara conteniendo lágrimas', keywords: ['emocion', 'ternura', 'agradecimiento'] },
      { char: '😅', name: 'Cara sonriente con sudor', keywords: ['alivio', 'nervios', 'casi'] },
      { char: '😂', name: 'Lágrimas de risa', keywords: ['risa', 'gracioso', 'divertido', 'humor'] },
      { char: '🤣', name: 'Revolcándose de la risa', keywords: ['carcajada', 'chiste', 'divertido'] },
      { char: '😊', name: 'Cara sonriente sonrojada', keywords: ['tierno', 'amable', 'feliz', 'gracias'] },
      { char: '😇', name: 'Cara sonriente con halo', keywords: ['angel', 'bueno', 'inocente'] },
      { char: '🙂', name: 'Cara ligeramente sonriente', keywords: ['bien', 'tranquilo', 'ok'] },
      { char: '🙃', name: 'Cara al revés', keywords: ['sarcasmo', 'ironia', 'locura', 'divertido'] },
      { char: '😉', name: 'Cara guiñando un ojo', keywords: ['guino', 'complice', 'secreto'] },
      { char: '😌', name: 'Cara de alivio', keywords: ['alivio', 'paz', 'tranquilidad'] },
      { char: '😍', name: 'Cara con ojos de corazón', keywords: ['amor', 'encanta', 'pareja', 'hermoso'] },
      { char: '🥰', name: 'Cara sonriente con corazones', keywords: ['amor', 'enamorado', 'agradecido'] },
      { char: '😘', name: 'Cara mandando un beso', keywords: ['beso', 'amor', 'carino'] },
      { char: '😋', name: 'Cara saboreando comida', keywords: ['rico', 'delicioso', 'hambre'] },
      { char: '😛', name: 'Cara sacando la lengua', keywords: ['broma', 'juego', 'divertido'] },
      { char: '😜', name: 'Cara sacando la lengua y guiño', keywords: ['broma', 'locura', 'fiesta'] },
      { char: '🤪', name: 'Cara de loco', keywords: ['loco', 'divertido', 'excentrico'] },
      { char: '🤩', name: 'Cara deslumbrada por estrellas', keywords: ['increible', 'fascinado', 'estrellas'] },
      { char: '😎', name: 'Cara con gafas de sol', keywords: ['genial', 'cool', 'exito', 'seguro'] },
      { char: '🥳', name: 'Cara de fiesta', keywords: ['fiesta', 'celebracion', 'cumpleanos'] },
      { char: '🤗', name: 'Cara con manos abrazando', keywords: ['abrazo', 'carino', 'apoyo'] },
      { char: '🤔', name: 'Cara pensativa', keywords: ['pensar', 'duda', 'estrategia', 'idea'] },
      { char: '🫡', name: 'Cara saludando militar', keywords: ['orden', 'entendido', 'respeto', 'listo'] },
      { char: '🤫', name: 'Cara de silencio', keywords: ['secreto', 'silencio', 'shh'] },
      { char: '🥱', name: 'Cara bostezando', keywords: ['cansancio', 'sueno', 'aburrido'] },
      { char: '😴', name: 'Cara durmiendo', keywords: ['dormir', 'noche', 'descanso'] },
      { char: '🤝', name: 'Apretón de manos', keywords: ['acuerdo', 'trato', 'alianza', 'negociacion'] },
      { char: '🙌', name: 'Manos levantadas celebrando', keywords: ['victoria', 'felicidad', 'bravo'] },
      { char: '👏', name: 'Manos aplaudiendo', keywords: ['aplausos', 'felicitaciones', 'bien hecho'] },
      { char: '🫶', name: 'Manos formando corazón', keywords: ['amor', 'gratitud', 'apoyo'] },
      { char: '👍', name: 'Pulgar arriba', keywords: ['ok', 'aprobado', 'bien', 'listo', 'like'] },
      { char: '✌️', name: 'Señal de victoria / paz', keywords: ['paz', 'victoria', 'dos'] },
    ],
  },
];

interface EmojiPickerProps {
  selectedEmoji: string;
  onSelectEmoji: (emoji: string) => void;
  title?: string;
  className?: string;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  selectedEmoji,
  onSelectEmoji,
  title = 'Seleccionar Emoji',
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<string>('popular');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');

  // Filtered emojis based on search or category
  const displayedEmojis = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const all: { char: string; name: string }[] = [];
      const seen = new Set<string>();

      EMOJI_DATABASE.forEach(cat => {
        cat.emojis.forEach(em => {
          if (seen.has(em.char)) return;
          const matchName = em.name.toLowerCase().includes(q);
          const matchKeyword = em.keywords.some(k => k.toLowerCase().includes(q));
          const matchChar = em.char.includes(q);
          if (matchName || matchKeyword || matchChar) {
            seen.add(em.char);
            all.push(em);
          }
        });
      });
      return all;
    }

    const currentCat = EMOJI_DATABASE.find(c => c.id === activeTab) || EMOJI_DATABASE[0];
    return currentCat.emojis;
  }, [searchQuery, activeTab]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onSelectEmoji(customInput.trim());
      setCustomInput('');
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomInput(val);
    if (val.trim()) {
      // Direct select if user types or pastes an emoji
      onSelectEmoji(val.trim());
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header Preview & Direct Custom Emoji Input */}
      <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-nexus-surface-2/70 border border-nexus-border">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl bg-nexus-surface-3 border border-nexus-border flex items-center justify-center text-2xl shadow-inner shrink-0 ring-2 ring-indigo-500/30"
            title="Emoji seleccionado actualmente"
          >
            {selectedEmoji || '📁'}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-text-muted block">
              {title}
            </span>
            <span className="text-xs font-semibold text-nexus-text">
              Activo: <span className="text-indigo-400 font-mono">{selectedEmoji || '📁'}</span>
            </span>
          </div>
        </div>

        {/* Custom Input: Paste or type any emoji freely */}
        <div
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleCustomSubmit(e);
            }
          }}
          className="relative flex items-center gap-1.5 max-w-[170px]"
        >
          <div className="relative w-full">
            <input
              type="text"
              value={customInput}
              onChange={handleCustomChange}
              placeholder="O pega tu emoji..."
              title="Escribe o pega cualquier emoji desde tu teclado (Mac: Ctrl+Cmd+Espacio / Win: Win+.)"
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-nexus-surface border border-nexus-border focus:border-indigo-500 focus:outline-hidden text-nexus-text placeholder-nexus-text-muted transition"
            />
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-nexus-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar emoji (ej: cohete, amor, agua, dinero, pc...)"
          className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl bg-nexus-surface-2 border border-nexus-border focus:border-indigo-500 focus:outline-hidden text-nexus-text placeholder-nexus-text-muted"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nexus-text-muted hover:text-nexus-text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Tabs (hidden during search) */}
      {!searchQuery && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
          {EMOJI_DATABASE.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1 transition ${
                activeTab === cat.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-nexus-surface-2 text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-3'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="grid grid-cols-8 sm:grid-cols-9 gap-1.5 max-h-44 overflow-y-auto p-1.5 rounded-xl bg-nexus-surface-2/40 border border-nexus-border/80 scrollbar-thin">
        {displayedEmojis.length === 0 ? (
          <div className="col-span-full py-6 text-center text-xs text-nexus-text-muted">
            <p>No se encontraron emojis para "{searchQuery}".</p>
            <p className="text-[11px] text-indigo-400 mt-1">
              💡 Puedes escribirlo o pegarlo directamente en la caja superior.
            </p>
          </div>
        ) : (
          displayedEmojis.map(item => (
            <button
              key={item.char + item.name}
              type="button"
              onClick={() => onSelectEmoji(item.char)}
              title={item.name}
              className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all hover:scale-115 active:scale-95 ${
                selectedEmoji === item.char
                  ? 'bg-indigo-600/30 border border-indigo-500 ring-2 ring-indigo-500/30'
                  : 'hover:bg-nexus-surface-3'
              }`}
            >
              {item.char}
            </button>
          ))
        )}
      </div>
      <div className="flex items-center justify-between text-[10px] text-nexus-text-muted px-1">
        <span>{displayedEmojis.length} emojis disponibles</span>
        <span className="flex items-center gap-1">
          <Keyboard className="w-3 h-3 text-indigo-400" />
          <span>Atajo teclado: <kbd className="font-mono bg-nexus-surface-3 px-1 py-0.5 rounded border border-nexus-border">⌃⌘Espacio</kbd></span>
        </span>
      </div>
    </div>
  );
};

export default EmojiPicker;
