import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  ProyeccionConfig,
  CategoriaIngreso,
  CategoriaEgreso,
  Prestamo,
  Escenario,
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
}

let dbInstance: IDBPDatabase<FlujosysDB> | null = null

export async function getDB(): Promise<IDBPDatabase<FlujosysDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<FlujosysDB>('flujosys-db', 1, {
    upgrade(db) {
      db.createObjectStore('config', { keyPath: 'id' })

      const ingresosStore = db.createObjectStore('categorias_ingreso', { keyPath: 'id' })
      ingresosStore.createIndex('by-orden', 'orden')

      const egresosStore = db.createObjectStore('categorias_egreso', { keyPath: 'id' })
      egresosStore.createIndex('by-orden', 'orden')

      db.createObjectStore('prestamos', { keyPath: 'id' })

      const escenariosStore = db.createObjectStore('escenarios', { keyPath: 'id' })
      escenariosStore.createIndex('by-nombre', 'nombre')
    },
  })

  return dbInstance
}
