"use client"

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Dialog, DialogHeader, DialogContent, DialogDescription, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createConfig, testConnection as testConnectionApi } from "@/lib/config-service";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "sonner";

interface ConfigureDialog {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dbConnection: DbConnection
  setPlanConn: Dispatch<SetStateAction<string>>
}

interface DbConnection {
  dbHost: string
  dbPort: string
  dbName: string
  dbUser: string
  dbPass: string
  dbType: string
}

export default function ConfigureDialog({ open, onOpenChange, dbConnection, setPlanConn }: ConfigureDialog) {
  const [dbHost, setDbHost] = useState(dbConnection.dbHost)
  const [dbPort, setDbPort] = useState(dbConnection.dbPort)
  const [dbName, setDbName] = useState(dbConnection.dbName)
  const [dbUser, setDbUser] = useState(dbConnection.dbUser)
  const [dbPass, setDbPass] = useState(dbConnection.dbPass)
  const [dbType, setDbType] = useState(dbConnection.dbType)

  useEffect(() => {
    setDbHost(dbConnection.dbHost)
    setDbPort(dbConnection.dbPort)
    setDbName(dbConnection.dbName)
    setDbUser(dbConnection.dbUser)
    setDbPass(dbConnection.dbPass)
    setDbType(dbConnection.dbType)
  }, [dbConnection])

  const databaseTypes = [
    { value: "postgres", label: "postgres" },
    { value: "sqlserver", label: "sqlserver" },
  ]

  const saveConnectionFromDialog = async () => {
    const segments = [
      dbHost && `host=${dbHost}`,
      dbUser && `user=${dbUser}`,
      dbPass && `password=${dbPass}`,
      dbName && `dbname=${dbName}`,
      dbPort && `port=${dbPort}`,
      dbType && `type=${dbType}`,
      // Defaults as requested
      `sslmode=disable`,
    ].filter(Boolean) as string[]
    const conn = segments.join(",")
    console.log(conn)
    setPlanConn(conn)
    try {
      const username = 'Administrator'
      await createConfig({
        username,
        plan_dsn: conn
      })
      toast.success('Configuration saved')
      onOpenChange(false)
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to save configuration'
      toast.error(message)
    }
  }

  const testConnection = async () => {
    const segments = [
      dbHost && `host=${dbHost}`,
      dbUser && `user=${dbUser}`,
      dbPass && `password=${dbPass}`,
      dbName && `dbname=${dbName}`,
      dbPort && `port=${dbPort}`,
      dbType && `type=${dbType}`,
      // Defaults as requested
      `sslmode=disable`,
    ].filter(Boolean) as string[]
    const conn = segments.join(",")

    if (!conn || !conn.trim()) {
      toast.warning("Please enter a connection string to test")
      return
    }

    try {
      const result = await testConnectionApi(conn.trim())

      if (result.success) {
        toast.success(result.message || "Connection successful")
      } else {
        toast.error(result.error || "Connection failed")
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || "Failed to test connection"
      toast.error(errorMessage)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{"Edit Connection"}</DialogTitle>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={testConnection}>
            Test Connection
          </Button>
          <Button onClick={saveConnectionFromDialog}>
            Save Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
