import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  ProyeccionConfig,
  CategoriaIngreso,
  CategoriaEgreso,
  Prestamo,
  Escenario,
  Proyeccion,
} from '../types'

export interface FlujosysDB extends DBSchema {
  config: {
    key: 'singleton'
    value: ProyeccionConfig
  }
  categorias_ingreso: {
    key: string
    value: CategoriaIngreso
    indexes: { 'by-orden': number }
  }
  categorias_egreso: {
    key: string
    value: CategoriaEgreso
    indexes: { 'by-orden': number }
  }
  prestamos: {
    key: string
    value: Prestamo
  }
  escenarios: {
    key: string
    value: Escenario
    indexes: { 'by-nombre': string }
  }
  proyecciones: {
    key: string
    value: Proyeccion
    indexes: { 'by-fecha': string }
  }
}

let dbInstance: IDBPDatabase<FlujosysDB> | null = null

export async function getDB(): Promise<IDBPDatabase<FlujosysDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<FlujosysDB>('flujosys-db', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('config', { keyPath: 'id' })

        const ingresosStore = db.createObjectStore('categorias_ingreso', { keyPath: 'id' })
        ingresosStore.createIndex('by-orden', 'orden')

        const egresosStore = db.createObjectStore('categorias_egreso', { keyPath: 'id' })
        egresosStore.createIndex('by-orden', 'orden')

        db.createObjectStore('prestamos', { keyPath: 'id' })

        const escenariosStore = db.createObjectStore('escenarios', { keyPath: 'id' })
        escenariosStore.createIndex('by-nombre', 'nombre')
      }
      if (oldVersion < 2) {
        const proyeccionesStore = db.createObjectStore('proyecciones', { keyPath: 'id' })
        proyeccionesStore.createIndex('by-fecha', 'creadoEn')
      }
    },
  })

  return dbInstance
}
