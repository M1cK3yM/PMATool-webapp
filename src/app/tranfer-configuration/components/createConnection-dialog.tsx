"use client"

import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Combobox } from "@/components/ui/combobox"
import { DbConfig } from "../page"

interface DbConnection {
  dbHost: string
  dbPort: string
  dbName: string
  dbUser: string
  dbPass: string
  dbType: string
}

interface CorrectConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isEditing: boolean
  dialogFor: any
  dbConnection: DbConnection
  setSource: Dispatch<SetStateAction<DbConfig>>
  setDest: Dispatch<SetStateAction<DbConfig>>
}


export function CreateConnectionDialog({
  open,
  onOpenChange,
  isEditing = true,
  dialogFor,
  setSource,
  dbConnection,
  setDest,
}: CorrectConnectionDialogProps) {
  const [dbHost, setDbHost] = useState(dbConnection.dbHost)
  const [dbPort, setDbPort] = useState(dbConnection.dbPort)
  const [dbName, setDbName] = useState(dbConnection.dbName)
  const [dbUser, setDbUser] = useState(dbConnection.dbUser)
  const [dbPass, setDbPass] = useState(dbConnection.dbPass)
  const [dbType, setDbType] = useState(dbConnection.dbType)
  const [dbEnc, setDbEnc] = useState(true)


  useEffect(() => {
    setDbHost(dbConnection.dbHost)
    setDbPort(dbConnection.dbPort)
    setDbName(dbConnection.dbName)
    setDbUser(dbConnection.dbUser)
    setDbPass(dbConnection.dbPass)
    setDbType(dbConnection.dbType)
  }, [dbConnection])

  function saveConnectionFromDialog() {
    // Build a Postgres DSN-style string
    const segments = [
      dbHost && `host=${dbHost}`,
      dbUser && `user=${dbUser}`,
      dbPass && `password=${dbPass}`,
      dbName && `dbname=${dbName}`,
      dbPort && `port=${dbPort}`,
      dbType && `type=${dbType}`,
      // Defaults as requested
      dbEnc && `dbEnc=disable`,
    ].filter(Boolean) as string[]
    const conn = segments.join(",")
    if (dialogFor) {
      if (dialogFor.scope === "source") {
        setSource(prev => ({ ...prev, [dialogFor.field]: conn }))
      } else {
        setDest(prev => ({ ...prev, [dialogFor.field]: conn }))
      }
    }
    onOpenChange(false)
  }

  const databaseTypes = [
    { value: "postgres", label: "postgres" },
    { value: "sqlserver", label: "sqlserver" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Connection" : "Create Connection"}</DialogTitle>
          <DialogDescription>Enter database connection details.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1 text-sm">Database</Label>
            <Combobox choices={databaseTypes} value={dbType} setValue={setDbType} defaultValue={dbType} placeHolder="Database" />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="host" className="col-span-1 text-sm">Host</Label>
            <Input id="host" className="col-span-3" value={dbHost} onChange={(e) => setDbHost(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="port" className="col-span-1 text-sm">Port</Label>
            <Input id="port" className="col-span-3" value={dbPort} onChange={(e) => setDbPort(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="db" className="col-span-1 text-sm">Database</Label>
            <Input id="db" className="col-span-3" value={dbName} onChange={(e) => setDbName(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="user" className="col-span-1 text-sm">User</Label>
            <Input id="user" className="col-span-3" value={dbUser} onChange={(e) => setDbUser(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="pass" className="col-span-1 text-sm">Password</Label>
            <Input id="pass" type="password" className="col-span-3" value={dbPass} onChange={(e) => setDbPass(e.target.value)} />
          </div>
          {dbType === 'sqlserver' && (
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="dbEnc" className="col-span-1 text-sm">Disable Encryption</Label>
              <div className="col-span-3 flex items-center">
                <Checkbox id="dbEnc" checked={dbEnc} onCheckedChange={() => setDbEnc(!dbEnc)} />
                <span className="ml-2 text-xs text-gray-500">Enable this to disable encryption for older SQL servers.</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={saveConnectionFromDialog}>
            Save Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
