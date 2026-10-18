'use client'

import { useState, useRef } from 'react'
import { X, Upload, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, ClipboardPaste } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SucursalItem {
  id: string
  nombre: string
  color: string
}

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  sucursales: SucursalItem[]
  onImported: () => void
}

interface Fila {
  nombre: string
  fecha: string
  sucursalNombre: string
  mensaje: string
  emoji: string
  sucursalId?: string
  error?: string
}

const EJEMPLO = `Nombre,Fecha,Sucursal
Juan Pérez,1990-05-14,Centro
María López,15/08/1985,Sucursal Norte
Pedro Ramírez,1988-12-03,Centro`

// Normaliza una fecha en varios formatos a YYYY-MM-DD (lo que espera el backend)
function normalizarFecha(raw: string): string | null {
  const s = (raw || '').trim()
  if (!s) return null
  // YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  if (m) {
    const [, y, mo, d] = m
    const mm = Number(mo), dd = Number(d)
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // DD/MM/YYYY / DD-MM-YYYY / DD.MM.YYYY
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
  if (m) {
    const [, d, mo, y] = m
    const mm = Number(mo), dd = Number(d)
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return null
}

function detectarSeparador(linea: string): string {
  if (linea.includes('\t')) return '\t'
  if (linea.includes(';')) return ';'
  return ','
}

// Parte una línea respetando comillas dobles (soporta "Pérez, Juan")
function partirLinea(linea: string, sep: string): string[] {
  const out: string[] = []
  let cur = ''
  let enComillas = false
  for (let i = 0; i < linea.length; i++) {
    const ch = linea[i]
    if (ch === '"') {
      if (enComillas && linea[i + 1] === '"') { cur += '"'; i++ }
      else enComillas = !enComillas
    } else if (ch === sep && !enComillas) {
      out.push(cur); cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map(s => s.trim().replace(/^"|"$/g, ''))
}

// Compara nombres de sucursal sin acentos ni mayúsculas
function normalizar(s: string): string {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function esEncabezado(cols: string[]): boolean {
  const j = normalizar(cols.join(' '))
  return (j.includes('nombre') && (j.includes('fecha') || j.includes('nacimiento') || j.includes('cumple')))
}

function parsear(texto: string, sucursales: SucursalItem[]): Fila[] {
  const lineas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lineas.length === 0) return []

  const sep = detectarSeparador(lineas[0])
  const inicio = esEncabezado(partirLinea(lineas[0], sep)) ? 1 : 0

  const filas: Fila[] = []
  for (let i = inicio; i < lineas.length; i++) {
    const cols = partirLinea(lineas[i], sep)
    if (cols.length < 2) continue

    const nombre = cols[0]
    const fechaRaw = cols[1] || ''
    const sucursalNombre = cols[2] || ''
    const mensaje = cols[3] || ''
    const emoji = cols[4] || ''

    const fecha = normalizarFecha(fechaRaw)
    const sucursal = sucursales.find(s => normalizar(s.nombre) === normalizar(sucursalNombre))

    let error: string | undefined
    if (!nombre) error = 'Falta el nombre'
    else if (!fecha) error = `Fecha inválida: "${fechaRaw}"`
    else if (!sucursalNombre) error = 'Falta la sucursal'
    else if (!sucursal) error = `Sucursal no existe: "${sucursalNombre}"`

    filas.push({
      nombre,
      fecha: fecha || '',
      sucursalNombre,
      mensaje: mensaje || `¡Feliz cumpleaños ${nombre}! 🎉`,
      emoji,
      sucursalId: sucursal?.id,
      error,
    })
  }
  return filas
}

export function ImportModal({ isOpen, onClose, sucursales, onImported }: ImportModalProps) {
  const [texto, setTexto] = useState('')
  const [filas, setFilas] = useState<Fila[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [progreso, setProgreso] = useState({ hechos: 0, total: 0 })
  const [resultado, setResultado] = useState<{ ok: number; fallidos: number; errores: string[] } | null>(null)
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const reset = () => {
    setTexto(''); setFilas(null); setResultado(null)
    setErrorArchivo(null); setProgreso({ hechos: 0, total: 0 })
  }

  const cerrar = () => { reset(); onClose() }

  const analizar = () => {
    const f = parsear(texto, sucursales)
    setResultado(null)
    setFilas(f)
  }

  const leerArchivo = (file: File) => {
    setErrorArchivo(null)
    if (file.size > 2 * 1024 * 1024) {
      setErrorArchivo('El archivo es muy grande (máx. 2 MB). Pega el contenido o divide el archivo.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setTexto(String(reader.result || ''))
      setFilas(parsear(String(reader.result || ''), sucursales))
      setResultado(null)
    }
    reader.onerror = () => setErrorArchivo('No se pudo leer el archivo. Pega el contenido en el cuadro de texto.')
    reader.readAsText(file, 'UTF-8')
  }

  const importar = async () => {
    if (!filas) return
    const validas = filas.filter(f => !f.error && f.sucursalId)
    if (validas.length === 0) return

    setImporting(true)
    setProgreso({ hechos: 0, total: validas.length })
    let ok = 0
    const errores: string[] = []

    for (let i = 0; i < validas.length; i++) {
      const f = validas[i]
      try {
        const res = await fetch('/api/cumpleanos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: f.nombre,
            fecha: f.fecha,
            sucursalId: f.sucursalId,
            mensaje: f.mensaje,
            emoji: f.emoji || undefined,
            avisoDias: 1,
          }),
        })
        if (res.ok) ok++
        else errores.push(`${f.nombre}: error del servidor (${res.status})`)
      } catch {
        errores.push(`${f.nombre}: sin conexión`)
      }
      setProgreso({ hechos: i + 1, total: validas.length })
    }

    setImporting(false)
    setResultado({ ok, fallidos: validas.length - ok, errores })
    if (ok > 0) onImported()
  }

  const validas = filas ? filas.filter(f => !f.error).length : 0
  const invalidas = filas ? filas.length - validas : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={cerrar}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-neutral-700" />
            <h3 className="text-lg font-bold text-neutral-800">Importar cumpleaños desde Excel/CSV</h3>
          </div>
          <button onClick={cerrar} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors" title="Cerrar">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Formato */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
            <p className="font-semibold mb-1">Formato de cada fila (una por persona):</p>
            <p className="font-mono text-xs bg-white/70 rounded px-2 py-1 inline-block">Nombre, Fecha, Sucursal</p>
            <p className="mt-2 text-xs text-blue-800">
              La fecha puede ser <span className="font-mono">1990-05-14</span> o <span className="font-mono">14/05/1990</span>.
              Opcionalmente puedes añadir dos columnas más: <span className="font-mono">Mensaje, Emoji</span>.
              Sirve Excel (pega las celdas) o un archivo .csv — la primera fila de títulos se ignora.
            </p>
            <button
              onClick={() => setTexto(EJEMPLO)}
              className="mt-2 text-xs font-semibold text-blue-700 hover:text-blue-900 underline"
            >
              Poner un ejemplo
            </button>
          </div>

          {/* Elegir archivo (respaldo) + pegar */}
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => fileRef.current?.click()} className="btn-secondary gap-2">
              <Upload className="w-4 h-4" />
              Elegir archivo CSV
            </button>
            <span className="text-xs text-neutral-500">…o pega las filas directamente abajo</span>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) leerArchivo(f)
                e.target.value = ''
              }}
            />
          </div>

          {errorArchivo && (
            <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-none" />
              <span>{errorArchivo}</span>
            </div>
          )}

          {/* Textarea */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-1">
              <ClipboardPaste className="w-4 h-4" />
              Filas a importar
            </label>
            <textarea
              value={texto}
              onChange={e => { setTexto(e.target.value); setFilas(null); setResultado(null) }}
              rows={7}
              placeholder={EJEMPLO}
              className="w-full font-mono text-xs border border-neutral-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
          </div>

          {!filas && (
            <button onClick={analizar} disabled={!texto.trim()} className="btn-primary gap-2 disabled:opacity-50">
              Revisar {texto.trim() ? '' : '(pega algo primero)'}
            </button>
          )}

          {/* Vista previa */}
          {filas && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <span className="font-semibold text-neutral-800">{filas.length} fila(s) detectada(s)</span>
                <span className="text-green-700">✅ {validas} listas</span>
                {invalidas > 0 && <span className="text-red-700">❌ {invalidas} con problemas</span>}
              </div>

              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-neutral-100 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-neutral-700">Nombre</th>
                        <th className="text-left px-3 py-2 font-semibold text-neutral-700">Fecha</th>
                        <th className="text-left px-3 py-2 font-semibold text-neutral-700">Sucursal</th>
                        <th className="text-left px-3 py-2 font-semibold text-neutral-700">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map((f, i) => (
                        <tr key={i} className={cn('border-t border-neutral-100', f.error && 'bg-red-50')}>
                          <td className="px-3 py-1.5 text-neutral-800">{f.nombre || '—'}</td>
                          <td className="px-3 py-1.5 text-neutral-600">{f.fecha || '—'}</td>
                          <td className="px-3 py-1.5 text-neutral-600">{f.sucursalNombre || '—'}</td>
                          <td className="px-3 py-1.5">
                            {f.error
                              ? <span className="text-red-700">{f.error}</span>
                              : <span className="text-green-700">✅ listo</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {invalidas > 0 && (
                <p className="text-xs text-neutral-500">
                  Las filas con problemas se omiten. Corrige el texto (o crea la sucursal faltante) y vuelve a revisar.
                </p>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={importar}
                  disabled={importing || validas === 0}
                  className="btn-primary gap-2 disabled:opacity-50"
                >
                  {importing
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Importando {progreso.hechos}/{progreso.total}…</>
                    : <><CheckCircle2 className="w-4 h-4" /> Importar {validas} cumpleaños</>}
                </button>
                <button onClick={() => setFilas(null)} disabled={importing} className="btn-secondary disabled:opacity-50">
                  Volver a editar
                </button>
              </div>
            </div>
          )}

          {/* Resultado */}
          {resultado && (
            <div
              className={cn(
                'rounded-xl p-4 text-sm border',
                resultado.fallidos === 0
                  ? 'bg-green-50 border-green-200 text-green-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              )}
            >
              <p className="font-semibold">
                {resultado.fallidos === 0
                  ? `¡Listo! Se importaron ${resultado.ok} cumpleaños ✅`
                  : `Se importaron ${resultado.ok} y fallaron ${resultado.fallidos}`}
              </p>
              {resultado.errores.length > 0 && (
                <ul className="mt-2 text-xs list-disc list-inside space-y-0.5">
                  {resultado.errores.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                  {resultado.errores.length > 10 && <li>…y {resultado.errores.length - 10} más</li>}
                </ul>
              )}
              <div className="mt-3 flex gap-3">
                <button onClick={cerrar} className="btn-secondary">Cerrar</button>
                <button onClick={reset} className="btn-primary">Importar otro lote</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
