'use client'

import { createContext, useContext } from 'react'

const LicenseModeContext = createContext(true)

export function LicenseModeProvider({
  editable,
  children,
}: {
  editable: boolean
  children: React.ReactNode
}) {
  return <LicenseModeContext.Provider value={editable}>{children}</LicenseModeContext.Provider>
}

export function useLicenseEditable(): boolean {
  return useContext(LicenseModeContext)
}
