import { getDB } from './schema'
import type {
  ProyeccionConfig,
  CategoriaIngreso,
  CategoriaEgreso,
  Prestamo,
  Escenario,
} from '../types'

// ─── Config ───────────────────────────────────────────────────────────────────

export async function dbGetConfig(): Promise<ProyeccionConfig | undefined> {
  const db = await getDB()
  return db.get('config', 'singleton')
}

export async function dbSaveConfig(config: ProyeccionConfig): Promise<void> {
  const db = await getDB()
  await db.put('config', config)
}

// ─── Ingresos ─────────────────────────────────────────────────────────────────

export async function dbGetIngresos(): Promise<CategoriaIngreso[]> {
  const db = await getDB()
  return db.getAllFromIndex('categorias_ingreso', 'by-orden')
}

export async function dbSaveIngreso(categoria: CategoriaIngreso): Promise<void> {
  const db = await getDB()
  await db.put('categorias_ingreso', categoria)
}

export async function dbDeleteIngreso(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('categorias_ingreso', id)
}

export async function dbClearIngresos(): Promise<void> {
  const db = await getDB()
  await db.clear('categorias_ingreso')
}

// ─── Egresos ──────────────────────────────────────────────────────────────────

export async function dbGetEgresos(): Promise<CategoriaEgreso[]> {
  const db = await getDB()
  return db.getAllFromIndex('categorias_egreso', 'by-orden')
}

export async function dbSaveEgreso(categoria: CategoriaEgreso): Promise<void> {
  const db = await getDB()
  await db.put('categorias_egreso', categoria)
}

export async function dbDeleteEgreso(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('categorias_egreso', id)
}

export async function dbClearEgresos(): Promise<void> {
  const db = await getDB()
  await db.clear('categorias_egreso')
}

// ─── Préstamos ────────────────────────────────────────────────────────────────

export async function dbGetPrestamos(): Promise<Prestamo[]> {
  const db = await getDB()
  return db.getAll('prestamos')
}

export async function dbSavePrestamo(prestamo: Prestamo): Promise<void> {
  const db = await getDB()
  await db.put('prestamos', prestamo)
}

export async function dbDeletePrestamo(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('prestamos', id)
}

export async function dbClearPrestamos(): Promise<void> {
  const db = await getDB()
  await db.clear('prestamos')
}

// ─── Escenarios ───────────────────────────────────────────────────────────────

export async function dbGetEscenarios(): Promise<Escenario[]> {
  const db = await getDB()
  return db.getAll('escenarios')
}

export async function dbSaveEscenario(escenario: Escenario): Promise<void> {
  const db = await getDB()
  await db.put('escenarios', escenario)
}

export async function dbDeleteEscenario(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('escenarios', id)
}

// ─── Reset completo ───────────────────────────────────────────────────────────

export async function dbResetAll(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(
    ['config', 'categorias_ingreso', 'categorias_egreso', 'prestamos', 'escenarios'],
    'readwrite'
  )
  await Promise.all([
    tx.objectStore('config').clear(),
    tx.objectStore('categorias_ingreso').clear(),
    tx.objectStore('categorias_egreso').clear(),
    tx.objectStore('prestamos').clear(),
    tx.objectStore('escenarios').clear(),
    tx.done,
  ])
}
