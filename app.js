const API_BASE = "https://6aff1a3e3a0e70bc8d549cda.mockapi.io";
const URL_PRODUCTOS = `${API_BASE}/productos`;
const URL_CATEGORIAS = `${API_BASE}/categorias`;

const ADMIN_USER = "admin";
const ADMIN_PASS = "electro2026";
const IMG_FALLBACK = "https://via.placeholder.com/400x250?text=Electrodomestico";

const ICONOS_CATEGORIAS = {
  todas: "bi-grid-fill",
  "Refrigeración": "bi-snow",
  "Lavado": "bi-droplet-half",
  "Cocina": "bi-fire",
  "Climatización": "bi-wind",
  "Pequeños Electrodomésticos": "bi-cup-hot-fill"
};

let productos = [];
let categorias = [];
let carrito = [];
let usaApiCategorias = true;
let categoriaActiva = "todas";
let productoDetalleActual = null;

const vistaTienda = document.getElementById("vistaTienda");
const vistaAdmin = document.getElementById("vistaAdmin");
const gridProductos = document.getElementById("gridProductos");
const tablaAdminProductos = document.getElementById("tablaAdminProductos");
const listaAdminCategorias = document.getElementById("listaAdminCategorias");
const buscador = document.getElementById("buscador");
const ordenarProductos = document.getElementById("ordenarProductos");
const pillsCategorias = document.getElementById("pillsCategorias");
const contadorResultados = document.getElementById("contadorResultados");
const prodCategoriaSelect = document.getElementById("prodCategoria");
const heroTotalProductos = document.getElementById("heroTotalProductos");

const btnVerTienda = document.getElementById("btnVerTienda");
const btnVerAdmin = document.getElementById("btnVerAdmin");
const itemNavAdmin = document.getElementById("itemNavAdmin");
const btnAbrirLogin = document.getElementById("btnAbrirLogin");
const btnCerrarSesion = document.getElementById("btnCerrarSesion");
const logoInicio = document.getElementById("logoInicio");

const itemsCarritoEl = document.getElementById("itemsCarrito");
const totalCarritoEl = document.getElementById("totalCarrito");
const contadorCarritoEl = document.getElementById("contadorCarrito");
const btnFinalizarCompra = document.getElementById("btnFinalizarCompra");
const btnVaciarCarrito = document.getElementById("btnVaciarCarrito");

const formLogin = document.getElementById("formLogin");
const errorLogin = document.getElementById("errorLogin");
const formProducto = document.getElementById("formProducto");
const formCategoria = document.getElementById("formCategoria");
const btnNuevoProducto = document.getElementById("btnNuevoProducto");
const btnDetalleAgregar = document.getElementById("btnDetalleAgregar");
const btnMenosDetalle = document.getElementById("btnMenosDetalle");
const btnMasDetalle = document.getElementById("btnMasDetalle");

const modalLogin = new bootstrap.Modal(document.getElementById("modalLogin"));
const modalProducto = new bootstrap.Modal(document.getElementById("modalProducto"));
const modalDetalleProducto = new bootstrap.Modal(document.getElementById("modalDetalleProducto"));

function mostrarAlerta(mensaje, tipo = "success") {
  const contenedor = document.getElementById("alertaFlotante");
  const alerta = document.createElement("div");
  alerta.className = `alert alert-${tipo} alert-dismissible fade show shadow-lg rounded-4 border-0 fw-semibold small`;
  alerta.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  contenedor.appendChild(alerta);
  setTimeout(() => alerta.remove(), 3500);
}

function esAdminAutenticado() {
  return sessionStorage.getItem("electroAdminAuth") === "true";
}

function actualizarEstadoSesion() {
  const autenticado = esAdminAutenticado();
  itemNavAdmin.classList.toggle("d-none", !autenticado);
  btnCerrarSesion.classList.toggle("d-none", !autenticado);
  btnAbrirLogin.classList.toggle("d-none", autenticado);
  if (!autenticado && !vistaAdmin.classList.contains("d-none")) {
    mostrarVista("tienda");
  }
}

function mostrarVista(vista) {
  if (vista === "admin" && !esAdminAutenticado()) {
    modalLogin.show();
    return;
  }
  const enAdmin = vista === "admin";
  vistaTienda.classList.toggle("d-none", enAdmin);
  vistaAdmin.classList.toggle("d-none", !enAdmin);
  btnVerTienda.classList.toggle("active", !enAdmin);
  btnVerAdmin.classList.toggle("active", enAdmin);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderizarSkeletons() {
  gridProductos.innerHTML = Array.from({ length: 6 })
    .map(
      () => `
      <div class="col-sm-6 col-lg-4">
        <div class="skeleton-card">
          <div class="skeleton-box" style="height: 230px;"></div>
          <div class="p-4">
            <div class="skeleton-box rounded-pill mb-2" style="height: 12px; width: 35%;"></div>
            <div class="skeleton-box rounded-pill mb-3" style="height: 20px; width: 80%;"></div>
            <div class="skeleton-box rounded-pill mb-4" style="height: 14px; width: 100%;"></div>
            <div class="d-flex justify-content-between align-items-center pt-2">
              <div class="skeleton-box rounded-pill" style="height: 24px; width: 95px;"></div>
              <div class="skeleton-box rounded-pill" style="height: 34px; width: 95px;"></div>
            </div>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

async function cargarCategorias() {
  try {
    const res = await fetch(URL_CATEGORIAS);
    if (!res.ok) throw new Error();
    categorias = await res.json();
    usaApiCategorias = true;
  } catch {
    usaApiCategorias = false;
    categorias = [
      { id: "1", nombre: "Refrigeración" },
      { id: "2", nombre: "Lavado" },
      { id: "3", nombre: "Cocina" },
      { id: "4", nombre: "Climatización" },
      { id: "5", nombre: "Pequeños Electrodomésticos" }
    ];
  }
  renderizarControlesCategorias();
  renderizarAdminCategorias();
}

async function cargarProductos() {
  renderizarSkeletons();

  try {
    const res = await fetch(URL_PRODUCTOS);
    if (!res.ok) throw new Error();
    productos = await res.json();
    heroTotalProductos.textContent = productos.length;
    renderizarCatalogo();
    renderizarTablaAdmin();
    actualizarEstadisticasAdmin();
  } catch {
    gridProductos.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning rounded-4">
          No se pudieron cargar los productos. Verifica la URL de MockAPI en <strong>app.js</strong>.
        </div>
      </div>
    `;
  }
}

function renderizarControlesCategorias() {
  const opciones = [
    { nombre: "Todas", valor: "todas" },
    ...categorias.map((c) => ({ nombre: c.nombre, valor: c.nombre }))
  ];

  pillsCategorias.innerHTML = opciones
    .map((op) => {
      const icono = ICONOS_CATEGORIAS[op.valor] || "bi-tag-fill";
      return `
        <button type="button" class="cat-pill ${categoriaActiva === op.valor ? "active" : ""}" onclick="seleccionarCategoria('${op.valor}')">
          <i class="bi ${icono}"></i>
          <span>${op.nombre}</span>
        </button>
      `;
    })
    .join("");

  prodCategoriaSelect.innerHTML = "";
  categorias.forEach((cat) => {
    const optForm = document.createElement("option");
    optForm.value = cat.nombre;
    optForm.textContent = cat.nombre;
    prodCategoriaSelect.appendChild(optForm);
  });
}

function seleccionarCategoria(valor) {
  categoriaActiva = valor;
  renderizarControlesCategorias();
  renderizarCatalogo();
}

function obtenerBadgeStock(stock) {
  const cantidad = Number(stock) || 0;
  if (cantidad <= 0) {
    return `<span class="badge bg-danger">Agotado</span>`;
  }
  if (cantidad <= 5) {
    return `<span class="badge bg-warning text-dark">Últimos ${cantidad}</span>`;
  }
  return `<span class="badge bg-success">Stock: ${cantidad}</span>`;
}

function renderizarCatalogo() {
  const texto = buscador.value.trim().toLowerCase();
  const orden = ordenarProductos.value;

  let filtrados = productos.filter((p) => {
    const nombre = (p.nombre || "").toLowerCase();
    const marca = (p.marca || "").toLowerCase();
    const coincideTexto = nombre.includes(texto) || marca.includes(texto);
    const coincideCat = categoriaActiva === "todas" || p.categoria === categoriaActiva;
    return coincideTexto && coincideCat;
  });

  if (orden === "precio-asc") {
    filtrados.sort((a, b) => (Number(a.precio) || 0) - (Number(b.precio) || 0));
  } else if (orden === "precio-desc") {
    filtrados.sort((a, b) => (Number(b.precio) || 0) - (Number(a.precio) || 0));
  } else if (orden === "nombre") {
    filtrados.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }

  contadorResultados.textContent = `${filtrados.length} ${filtrados.length === 1 ? "producto" : "productos"}`;

  if (filtrados.length === 0) {
    gridProductos.innerHTML = `
      <div class="col-12 text-center py-5 text-slate-400">
        <i class="bi bi-search fs-1 d-block mb-2"></i>
        <h5 class="font-display fw-bold text-slate-800">Sin resultados</h5>
        <p class="mb-0">No se encontraron electrodomésticos con ese criterio.</p>
      </div>
    `;
    return;
  }

  gridProductos.innerHTML = filtrados
    .map((p, index) => {
      const stock = Number(p.stock) || 0;
      const agotado = stock <= 0;
      return `
        <div class="col-sm-6 col-lg-4">
          <div class="card card-producto h-100" style="animation-delay: ${Math.min(index * 40, 320)}ms" onclick="abrirDetalleProducto('${p.id}')">
            <div class="producto-img-wrap">
              <img src="${p.imagenUrl || IMG_FALLBACK}" class="producto-img" alt="${p.nombre || "Producto"}" onerror="this.src='${IMG_FALLBACK}'">
              <span class="badge-cat-float">${p.categoria || "General"}</span>
              <div class="badge-stock-float">${obtenerBadgeStock(stock)}</div>
              <span class="quick-view-pill"><i class="bi bi-eye me-1"></i>Ver detalles</span>
            </div>
            <div class="card-body p-4 d-flex flex-column">
              <small class="text-slate-400 text-uppercase fw-bold mb-1" style="font-size: 0.72rem; letter-spacing: 0.08em;">${p.marca || ""}</small>
              <h5 class="font-display fw-bold text-slate-900 mb-2">${p.nombre || "Sin nombre"}</h5>
              <p class="text-slate-500 small descripcion-corta mb-4">${p.descripcion || ""}</p>
              <div class="mt-auto pt-3 border-top border-slate-100 d-flex justify-content-between align-items-center gap-2">
                <div>
                  <small class="text-slate-400 d-block lh-1" style="font-size: 0.7rem;">Precio</small>
                  <span class="precio-texto">Bs. ${(Number(p.precio) || 0).toFixed(2)}</span>
                </div>
                <button class="btn-add-card" ${agotado ? "disabled" : ""} onclick="event.stopPropagation(); agregarAlCarrito('${p.id}')">
                  <i class="bi bi-bag-plus me-1"></i>${agotado ? "Sin stock" : "Agregar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function abrirDetalleProducto(idProducto) {
  const p = productos.find((item) => String(item.id) === String(idProducto));
  if (!p) return;

  productoDetalleActual = p;
  const stock = Number(p.stock) || 0;
  const agotado = stock <= 0;

  const img = document.getElementById("detalleImagen");
  img.src = p.imagenUrl || IMG_FALLBACK;
  img.alt = p.nombre || "Producto";
  img.onerror = () => {
    img.src = IMG_FALLBACK;
  };

  document.getElementById("detalleCategoria").textContent = p.categoria || "General";
  document.getElementById("detalleStock").innerHTML = obtenerBadgeStock(stock);
  document.getElementById("detalleMarca").textContent = p.marca || "";
  document.getElementById("detalleNombre").textContent = p.nombre || "Sin nombre";
  document.getElementById("detalleDescripcion").textContent = p.descripcion || "Sin descripción disponible.";
  document.getElementById("detallePrecio").textContent = `Bs. ${(Number(p.precio) || 0).toFixed(2)}`;

  const inputCantidad = document.getElementById("detalleCantidad");
  inputCantidad.value = agotado ? 0 : 1;
  inputCantidad.min = agotado ? 0 : 1;
  inputCantidad.max = stock;
  inputCantidad.disabled = agotado;
  btnMenosDetalle.disabled = agotado;
  btnMasDetalle.disabled = agotado;

  btnDetalleAgregar.disabled = agotado;
  btnDetalleAgregar.innerHTML = agotado
    ? `<i class="bi bi-x-circle me-1"></i>Sin stock`
    : `<i class="bi bi-bag-plus-fill me-1"></i>Agregar al carrito`;

  modalDetalleProducto.show();
}

function cambiarCantidadDetalle(delta) {
  if (!productoDetalleActual) return;
  const input = document.getElementById("detalleCantidad");
  const stock = Number(productoDetalleActual.stock) || 0;
  if (stock <= 0) return;

  const actual = Number(input.value) || 1;
  const nueva = Math.min(stock, Math.max(1, actual + delta));
  input.value = nueva;
}

function agregarAlCarrito(idProducto, cantidad = 1) {
  const producto = productos.find((p) => String(p.id) === String(idProducto));
  if (!producto || Number(producto.stock) <= 0) return false;

  const cantAgregar = Math.max(1, Number(cantidad) || 1);
  const existente = carrito.find((item) => String(item.id) === String(idProducto));

  if (existente) {
    if (existente.cantidad + cantAgregar > Number(producto.stock)) {
      mostrarAlerta("La cantidad supera el stock disponible para este producto.", "warning");
      return false;
    }
    existente.cantidad += cantAgregar;
  } else {
    if (cantAgregar > Number(producto.stock)) {
      mostrarAlerta("La cantidad supera el stock disponible para este producto.", "warning");
      return false;
    }
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio) || 0,
      imagenUrl: producto.imagenUrl || IMG_FALLBACK,
      cantidad: cantAgregar
    });
  }

  renderizarCarrito();
  mostrarAlerta(`"${producto.nombre}" agregado al carrito.`);
  return true;
}

function cambiarCantidadCarrito(idProducto, delta) {
  const item = carrito.find((i) => String(i.id) === String(idProducto));
  const producto = productos.find((p) => String(p.id) === String(idProducto));
  if (!item || !producto) return;

  const nuevaCantidad = item.cantidad + delta;
  if (nuevaCantidad <= 0) {
    carrito = carrito.filter((i) => String(i.id) !== String(idProducto));
  } else if (nuevaCantidad > Number(producto.stock)) {
    mostrarAlerta("No hay más stock disponible.", "warning");
    return;
  } else {
    item.cantidad = nuevaCantidad;
  }

  renderizarCarrito();
}

function quitarDelCarrito(idProducto) {
  carrito = carrito.filter((i) => String(i.id) !== String(idProducto));
  renderizarCarrito();
}

function renderizarCarrito() {
  const totalUnidades = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  contadorCarritoEl.textContent = totalUnidades;

  if (carrito.length === 0) {
    itemsCarritoEl.innerHTML = `
      <div class="text-center text-slate-400 py-5 mt-4">
        <i class="bi bi-bag-x fs-1 d-block mb-2 opacity-50"></i>
        <div class="font-display fw-bold text-slate-800">Tu carrito está vacío</div>
        <small>Agrega productos del catálogo para comenzar.</small>
      </div>
    `;
    totalCarritoEl.textContent = "Bs. 0.00";
    btnFinalizarCompra.disabled = true;
    return;
  }

  btnFinalizarCompra.disabled = false;
  let total = 0;

  itemsCarritoEl.innerHTML = carrito
    .map((item) => {
      const subtotal = item.precio * item.cantidad;
      total += subtotal;
      return `
        <div class="cart-item-card">
          <img src="${item.imagenUrl || IMG_FALLBACK}" class="cart-thumb" alt="${item.nombre}" onerror="this.src='${IMG_FALLBACK}'">
          <div class="flex-grow-1 min-w-0">
            <div class="fw-bold text-slate-900 text-truncate">${item.nombre}</div>
            <div class="text-indigo-600 fw-bold small">Bs. ${subtotal.toFixed(2)}</div>
            <div class="d-flex align-items-center gap-2 mt-2">
              <button class="btn btn-light border btn-sm rounded-circle px-2 py-0" onclick="cambiarCantidadCarrito('${item.id}', -1)">-</button>
              <span class="fw-bold small">${item.cantidad}</span>
              <button class="btn btn-light border btn-sm rounded-circle px-2 py-0" onclick="cambiarCantidadCarrito('${item.id}', 1)">+</button>
            </div>
          </div>
          <button class="btn btn-link text-danger p-1" onclick="quitarDelCarrito('${item.id}')" title="Quitar">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      `;
    })
    .join("");

  totalCarritoEl.textContent = `Bs. ${total.toFixed(2)}`;
}

async function finalizarCompra() {
  if (carrito.length === 0) return;

  btnFinalizarCompra.disabled = true;
  btnFinalizarCompra.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Procesando...`;

  try {
    for (const item of carrito) {
      const productoActual = productos.find((p) => String(p.id) === String(item.id));
      if (!productoActual || !productoActual.id) {
        throw new Error("El producto no tiene un campo 'id' válido en MockAPI.");
      }

      const nuevoStock = Math.max(0, Number(productoActual.stock) - item.cantidad);
      const { id, ...datosProducto } = productoActual;

      const res = await fetch(`${URL_PRODUCTOS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...datosProducto,
          stock: nuevoStock
        })
      });

      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status} en ${URL_PRODUCTOS}/${id}`);
      }
    }

    carrito = [];
    renderizarCarrito();
    await cargarProductos();
    mostrarAlerta("Compra realizada con éxito. El stock ha sido actualizado.", "success");
  } catch (err) {
    console.error(err);
    mostrarAlerta(`Error al actualizar stock: ${err.message}`, "danger");
  } finally {
    btnFinalizarCompra.innerHTML = `<i class="bi bi-bag-check-fill me-1"></i>Finalizar Compra`;
    btnFinalizarCompra.disabled = carrito.length === 0;
  }
}

function actualizarEstadisticasAdmin() {
  const totalProd = productos.length;
  const totalUnidades = productos.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const stockBajo = productos.filter((p) => (Number(p.stock) || 0) <= 5).length;
  const valorInventario = productos.reduce((acc, p) => acc + (Number(p.precio) || 0) * (Number(p.stock) || 0), 0);

  document.getElementById("statTotalProductos").textContent = totalProd;
  document.getElementById("statTotalStock").textContent = totalUnidades;
  document.getElementById("statStockBajo").textContent = stockBajo;
  document.getElementById("statValorInventario").textContent = `Bs. ${valorInventario.toLocaleString("es-BO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function renderizarTablaAdmin() {
  if (productos.length === 0) {
    tablaAdminProductos.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Sin productos registrados.</td></tr>`;
    return;
  }

  tablaAdminProductos.innerHTML = productos
    .map(
      (p) => `
      <tr>
        <td><img src="${p.imagenUrl || IMG_FALLBACK}" class="thumb-admin" onerror="this.src='${IMG_FALLBACK}'"></td>
        <td>
          <div class="fw-bold text-slate-900">${p.nombre || "Sin nombre"}</div>
          <small class="text-slate-400">${p.marca || ""}</small>
        </td>
        <td><span class="badge rounded-pill bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2">${p.categoria || "General"}</span></td>
        <td class="font-display fw-bold text-indigo-600">Bs. ${(Number(p.precio) || 0).toFixed(2)}</td>
        <td>${obtenerBadgeStock(p.stock)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-light border rounded-pill px-3 me-1" onclick="abrirEditarProducto('${p.id}')">
            <i class="bi bi-pencil text-indigo-600"></i>
          </button>
          <button class="btn btn-sm btn-light border rounded-pill px-3" onclick="eliminarProducto('${p.id}')">
            <i class="bi bi-trash text-danger"></i>
          </button>
        </td>
      </tr>
    `
    )
    .join("");
}

function abrirEditarProducto(id) {
  const p = productos.find((item) => String(item.id) === String(id));
  if (!p) return;

  document.getElementById("tituloModalProducto").textContent = "Editar Producto";
  document.getElementById("prodId").value = p.id;
  document.getElementById("prodNombre").value = p.nombre || "";
  document.getElementById("prodMarca").value = p.marca || "";
  document.getElementById("prodCategoria").value = p.categoria || "";
  document.getElementById("prodPrecio").value = p.precio || 0;
  document.getElementById("prodStock").value = p.stock || 0;
  document.getElementById("prodImagen").value = p.imagenUrl || "";
  document.getElementById("prodDescripcion").value = p.descripcion || "";

  modalProducto.show();
}

async function guardarProducto(e) {
  e.preventDefault();
  const id = document.getElementById("prodId").value;

  const datos = {
    nombre: document.getElementById("prodNombre").value.trim(),
    marca: document.getElementById("prodMarca").value.trim(),
    categoria: document.getElementById("prodCategoria").value,
    precio: Number(document.getElementById("prodPrecio").value),
    stock: Number(document.getElementById("prodStock").value),
    imagenUrl: document.getElementById("prodImagen").value.trim() || IMG_FALLBACK,
    descripcion: document.getElementById("prodDescripcion").value.trim()
  };

  try {
    const url = id ? `${URL_PRODUCTOS}/${id}` : URL_PRODUCTOS;
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });

    if (!res.ok) throw new Error();
    modalProducto.hide();
    await cargarProductos();
    mostrarAlerta(id ? "Producto actualizado." : "Producto creado correctamente.");
  } catch {
    mostrarAlerta("Error al guardar el producto en MockAPI.", "danger");
  }
}

async function eliminarProducto(id) {
  if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

  try {
    const res = await fetch(`${URL_PRODUCTOS}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    await cargarProductos();
    mostrarAlerta("Producto eliminado.", "info");
  } catch {
    mostrarAlerta("Error al eliminar el producto.", "danger");
  }
}

function renderizarAdminCategorias() {
  if (categorias.length === 0) {
    listaAdminCategorias.innerHTML = `<li class="list-group-item text-muted">No hay categorías registradas.</li>`;
    return;
  }

  listaAdminCategorias.innerHTML = categorias
    .map(
      (c) => `
      <li class="list-group-item d-flex justify-content-between align-items-center py-3">
        <span class="fw-semibold text-slate-800">${c.nombre}</span>
        <button class="btn btn-sm btn-light border rounded-pill px-3" onclick="eliminarCategoria('${c.id}')">
          <i class="bi bi-trash text-danger"></i>
        </button>
      </li>
    `
    )
    .join("");
}

async function guardarCategoria(e) {
  e.preventDefault();
  const input = document.getElementById("nuevaCategoriaNombre");
  const nombre = input.value.trim();
  if (!nombre) return;

  if (!usaApiCategorias) {
    categorias.push({ id: String(Date.now()), nombre });
    input.value = "";
    renderizarControlesCategorias();
    renderizarAdminCategorias();
    mostrarAlerta("Categoría agregada localmente (crea la tabla 'categorias' en MockAPI para persistirla).", "warning");
    return;
  }

  try {
    const res = await fetch(URL_CATEGORIAS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre })
    });
    if (!res.ok) throw new Error();
    input.value = "";
    await cargarCategorias();
    mostrarAlerta("Categoría registrada.");
  } catch {
    mostrarAlerta("No se pudo guardar la categoría en MockAPI.", "danger");
  }
}

async function eliminarCategoria(id) {
  if (!confirm("¿Eliminar esta categoría?")) return;

  if (!usaApiCategorias) {
    categorias = categorias.filter((c) => String(c.id) !== String(id));
    renderizarControlesCategorias();
    renderizarAdminCategorias();
    return;
  }

  try {
    const res = await fetch(`${URL_CATEGORIAS}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    await cargarCategorias();
    mostrarAlerta("Categoría eliminada.", "info");
  } catch {
    mostrarAlerta("Error al eliminar la categoría.", "danger");
  }
}

btnMenosDetalle.addEventListener("click", () => cambiarCantidadDetalle(-1));
btnMasDetalle.addEventListener("click", () => cambiarCantidadDetalle(1));

btnDetalleAgregar.addEventListener("click", () => {
  if (!productoDetalleActual) return;
  const cantidad = Number(document.getElementById("detalleCantidad").value);
  const agregado = agregarAlCarrito(productoDetalleActual.id, cantidad);
  if (agregado) {
    modalDetalleProducto.hide();
  }
});

formLogin.addEventListener("submit", (e) => {
  e.preventDefault();
  const usuario = document.getElementById("loginUsuario").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (usuario === ADMIN_USER && password === ADMIN_PASS) {
    sessionStorage.setItem("electroAdminAuth", "true");
    errorLogin.classList.add("d-none");
    formLogin.reset();
    modalLogin.hide();
    actualizarEstadoSesion();
    mostrarVista("admin");
    mostrarAlerta("Bienvenido al panel de administración.");
  } else {
    errorLogin.classList.remove("d-none");
  }
});

btnCerrarSesion.addEventListener("click", () => {
  sessionStorage.removeItem("electroAdminAuth");
  actualizarEstadoSesion();
  mostrarVista("tienda");
  mostrarAlerta("Sesión cerrada.", "secondary");
});

btnVerTienda.addEventListener("click", () => mostrarVista("tienda"));
logoInicio.addEventListener("click", (e) => {
  e.preventDefault();
  mostrarVista("tienda");
});
btnVerAdmin.addEventListener("click", () => mostrarVista("admin"));

btnNuevoProducto.addEventListener("click", () => {
  formProducto.reset();
  document.getElementById("prodId").value = "";
  document.getElementById("tituloModalProducto").textContent = "Nuevo Producto";
  modalProducto.show();
});

formProducto.addEventListener("submit", guardarProducto);
formCategoria.addEventListener("submit", guardarCategoria);
buscador.addEventListener("input", renderizarCatalogo);
ordenarProductos.addEventListener("change", renderizarCatalogo);
btnFinalizarCompra.addEventListener("click", finalizarCompra);
btnVaciarCarrito.addEventListener("click", () => {
  carrito = [];
  renderizarCarrito();
});

async function iniciarApp() {
  actualizarEstadoSesion();
  renderizarCarrito();
  await cargarCategorias();
  await cargarProductos();
}

iniciarApp();